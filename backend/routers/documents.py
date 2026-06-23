import os
import shutil
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Document, ChatMessage
from schemas import DocumentResponse
from auth import get_current_user
from s3 import upload_file_to_s3, delete_file_from_s3, generate_presigned_url
from pinecone_client import upsert_document_chunks, delete_document_namespace
from pipeline import (
    extract_pages_pdf, extract_pages_docx, extract_pages_txt,
    get_text_chunks, generate_embeddings, count_tokens
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

TEMP_DIR = "/tmp/ai_doc_analyzer"
os.makedirs(TEMP_DIR, exist_ok=True)

def process_document_background(doc_id: str, local_filepath: str, db_session_factory):
    # Retrieve a fresh DB session for the background thread
    db: Session = db_session_factory()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            logger.error(f"Document {doc_id} not found in background task")
            return

        # --- STEP 1: Upload to S3 (0-25%) ---
        logger.info(f"Background task starting for doc {doc_id}. Uploading to S3...")
        doc.processing_status = "processing"
        doc.processing_progress = 15
        db.commit()

        s3_key = f"users/{doc.user_id}/docs/{doc_id}_{doc.filename}"
        upload_file_to_s3(local_filepath, s3_key)
        
        doc.s3_key = s3_key
        doc.processing_progress = 25
        db.commit()

        # --- STEP 2: Extract text (25-50%) ---
        logger.info(f"Extracting text for doc {doc_id}...")
        doc.processing_progress = 35
        db.commit()

        pages_data = []
        if doc.file_type == "pdf":
            pages_data = extract_pages_pdf(local_filepath)
        elif doc.file_type == "docx":
            pages_data = extract_pages_docx(local_filepath)
        elif doc.file_type == "txt":
            pages_data = extract_pages_txt(local_filepath)
        else:
            raise ValueError(f"Unsupported file type: {doc.file_type}")

        # Compute page, word, and token count
        full_text = "\n\n".join([p["text"] for p in pages_data])
        word_count = len(full_text.split())
        token_count = count_tokens(full_text)
        page_count = len(pages_data)

        doc.extracted_text = full_text
        doc.page_count = page_count
        doc.word_count = word_count
        doc.token_count = token_count
        doc.processing_progress = 50
        db.commit()

        # --- STEP 3: Embed & Vector Ingestion (50-75%) ---
        logger.info(f"Creating embeddings and writing to Pinecone for doc {doc_id}...")
        doc.processing_progress = 60
        db.commit()

        # Chunk text (500 tokens, 50 overlap)
        chunks = get_text_chunks(pages_data, chunk_size=500, chunk_overlap=50)
        
        if chunks:
            chunk_texts = [c["text"] for c in chunks]
            # Generate OpenAI embeddings
            embeddings = generate_embeddings(chunk_texts)
            
            # Prepare vectors for Pinecone
            pinecone_vectors = []
            for i, chunk in enumerate(chunks):
                vector_id = f"chunk_{i}"
                pinecone_vectors.append({
                    "id": vector_id,
                    "values": embeddings[i],
                    "metadata": {
                        "text": chunk["text"],
                        "page": chunk["page_number"],
                        "document_id": doc_id
                    }
                })
            
            # Upsert into Pinecone with isolation namespace
            namespace = f"user_{doc.user_id}_doc_{doc_id}"
            doc.pinecone_namespace = namespace
            db.commit()
            
            upsert_document_chunks(pinecone_vectors, namespace)
        
        doc.processing_progress = 75
        db.commit()

        # --- STEP 4: Ready to Analyze! (100%) ---
        logger.info(f"Document {doc_id} processing successfully completed.")
        doc.processing_progress = 100
        doc.processing_status = "ready"
        db.commit()

    except Exception as e:
        logger.error(f"Error processing document {doc_id} in background: {e}", exc_info=True)
        # Update DB state to failed
        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                doc.processing_status = "failed"
                doc.processing_progress = 0
                db.commit()
        except Exception as db_err:
            logger.error(f"Could not update status to failed in DB: {db_err}")
    finally:
        # Clean up local temporary file
        if os.path.exists(local_filepath):
            try:
                os.remove(local_filepath)
            except Exception as e:
                logger.error(f"Failed to delete temp file {local_filepath}: {e}")
        db.close()


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file extension
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only PDF, DOCX, and TXT files are allowed."
        )

    # 50MB file size limit
    max_size = 50 * 1024 * 1024  # 50MB in bytes
    # Read file contents to inspect size
    file_content = file.file.read()
    file_size = len(file_content)
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 50MB limit."
        )
    # Reset file pointer
    file.file.seek(0)

    # Calculate file size in MB
    file_size_mb = round(file_size / (1024 * 1024), 2)

    # Check and update user storage usage (prevent users from exceeding a reasonable limit, e.g. 500MB)
    user = db.query(User).filter(User.id == current_user.id).first()
    if user.storage_used_mb + file_size_mb > 500.0:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Storage limit exceeded (max 500MB)."
        )
    user.storage_used_mb += file_size_mb
    db.commit()

    # Create temporary local file
    doc_id = str(uuid.uuid4())
    temp_filepath = os.path.join(TEMP_DIR, f"{doc_id}_{filename}")
    
    with open(temp_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Initialize DB record
    db_doc = Document(
        id=doc_id,
        user_id=current_user.id,
        filename=filename,
        original_filename=filename,
        file_type=ext,
        file_size_mb=file_size_mb,
        s3_key=f"pending/{doc_id}",  # placeholder until background task uploads
        processing_status="uploading",
        processing_progress=5
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # Trigger background ingestion process
    # We pass the SessionLocal factory to let the background task spawn its own DB session
    from database import SessionLocal
    background_tasks.add_task(
        process_document_background,
        doc_id,
        temp_filepath,
        SessionLocal
    )

    return db_doc


@router.get("", response_model=List[DocumentResponse])
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    return docs


@router.get("/{id}", response_model=DocumentResponse)
def get_document(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return doc


@router.delete("/{id}")
def delete_document(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # 1. Delete from S3
    if doc.s3_key and not doc.s3_key.startswith("pending/"):
        try:
            delete_file_from_s3(doc.s3_key)
        except Exception as e:
            logger.error(f"Failed to delete S3 file: {e}")

    # 2. Delete from Pinecone
    if doc.pinecone_namespace:
        try:
            delete_document_namespace(doc.pinecone_namespace)
        except Exception as e:
            logger.error(f"Failed to delete Pinecone namespace: {e}")

    # 3. Deduct storage usage
    user = db.query(User).filter(User.id == current_user.id).first()
    user.storage_used_mb = max(0.0, user.storage_used_mb - doc.file_size_mb)

    # 4. Delete from DB (ondelete CASCADE handles summaries, chat messages, extracted_data)
    db.delete(doc)
    db.commit()

    return {"detail": "Document successfully deleted"}


@router.get("/{id}/download")
def download_document(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if doc.processing_status != "ready":
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document is not fully processed yet."
        )

    presigned_url = generate_presigned_url(doc.s3_key, expiration=3600)
    return {"download_url": presigned_url}


@router.get("/usage/stats")
def get_usage_statistics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    
    user_id = current_user.id
    
    # 1. Total docs
    total_docs = db.query(Document).filter(Document.user_id == user_id).count()
    
    # 2. Total questions
    total_questions = db.query(ChatMessage).filter(ChatMessage.user_id == user_id, ChatMessage.role == "user").count()
    
    # 3. Total pages
    total_pages = db.query(func.sum(Document.page_count)).filter(Document.user_id == user_id).scalar() or 0
    
    # 4. Storage used
    user = db.query(User).filter(User.id == user_id).first()
    storage_used_mb = user.storage_used_mb if user else 0.0
    
    # 5. Most analyzed document
    most_analyzed_filename = "None yet"
    top_doc = db.query(Document.filename, func.count(ChatMessage.id).label('chat_count'))\
        .join(ChatMessage, ChatMessage.document_id == Document.id)\
        .filter(Document.user_id == user_id)\
        .group_by(Document.id, Document.filename)\
        .order_by(func.count(ChatMessage.id).desc())\
        .first()
        
    if top_doc:
        most_analyzed_filename = top_doc.filename
        
    # 6. Weekly questions asked (last 7 days)
    weekly_questions = []
    for i in range(6, -1, -1):
        day_date = datetime.utcnow().date() - timedelta(days=i)
        day_name = day_date.strftime("%a")
        
        start_dt = datetime.combine(day_date, datetime.min.time())
        end_dt = datetime.combine(day_date, datetime.max.time())
        
        count = db.query(ChatMessage).filter(
            ChatMessage.user_id == user_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= start_dt,
            ChatMessage.created_at <= end_dt
        ).count()
        weekly_questions.append({"day": day_name, "questions": count})
        
    return {
        "total_documents": total_docs,
        "total_questions": total_questions,
        "total_pages": total_pages,
        "most_analyzed_document": most_analyzed_filename,
        "storage_used_mb": round(storage_used_mb, 2),
        "weekly_questions": weekly_questions
    }
