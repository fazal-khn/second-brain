import os
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Document, ChatMessage
from schemas import ChatMessageCreate, ChatResponse, ChatMessageResponse, SuggestedQuestionsResponse
from auth import get_current_user
from pinecone_client import query_document_chunks
from pipeline import generate_embeddings, get_openai_client

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

@router.post("/{id}", response_model=ChatResponse)
def chat_with_document(
    id: str,
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch document and verify ownership
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if doc.processing_status != "ready":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document is not ready for chat.")

    user_question = payload.content.strip()

    # 2. Embed user question
    question_embeddings = generate_embeddings([user_question])
    question_vector = question_embeddings[0]

    # 3. Query Pinecone for 5 most relevant chunks
    namespace = f"user_{current_user.id}_doc_{id}"
    matched_chunks = query_document_chunks(question_vector, namespace, top_k=5)

    # 4. Form retrieved chunks string
    retrieved_chunks_str = ""
    source_chunks_meta = []
    
    for i, chunk in enumerate(matched_chunks):
        page_num = chunk.get("page", 1)
        text = chunk.get("text", "")
        retrieved_chunks_str += f"\n--- Excerpt {i+1} (Page {page_num}) ---\n{text}\n"
        source_chunks_meta.append({
            "page": page_num,
            "text_snippet": text[:150] + "..." if len(text) > 150 else text
        })

    # 5. Build RAG Prompt
    rag_prompt = f"""You are an intelligent document assistant. Answer the user's question using ONLY the provided document excerpts below.

Document excerpts (with page references):
{retrieved_chunks_str}

User question: {user_question}

Rules:
- Answer ONLY from the document content provided
- Always cite your source: mention the page/section
- If the answer is not in the excerpts, say exactly:
  "This specific information is not found in the document. The closest related content I found is: [brief description]"
- Be direct and specific
- Format your answer clearly with bullet points if listing multiple items

Answer:"""

    # 6. Call GPT-4o
    openai_client = get_openai_client()
    try:
        completion = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a precise document QA assistant."},
                {"role": "user", "content": rag_prompt}
            ],
            temperature=0.0 # High precision, no hallucinations
        )
        assistant_reply = completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error calling GPT-4o for chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI service failed: {str(e)}"
        )

    # 7. Log history to DB
    # Save User message
    user_msg = ChatMessage(
        document_id=id,
        user_id=current_user.id,
        role="user",
        content=user_question
    )
    db.add(user_msg)
    
    # Save Assistant message
    assistant_msg = ChatMessage(
        document_id=id,
        user_id=current_user.id,
        role="assistant",
        content=assistant_reply,
        source_chunks=source_chunks_meta
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        response=assistant_reply,
        source_chunks=source_chunks_meta
    )


@router.get("/{id}/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.document_id == id,
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).all()

    return messages


@router.delete("/{id}/history")
def clear_chat_history(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    db.query(ChatMessage).filter(
        ChatMessage.document_id == id,
        ChatMessage.user_id == current_user.id
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"detail": "Chat history cleared successfully"}


@router.get("/{id}/suggested-questions", response_model=SuggestedQuestionsResponse)
def get_suggested_questions(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Static default questions
    questions = [
        "What is the main purpose of this document?",
        "What are the key conclusions?",
        "Who is the target audience?"
    ]

    # Generate 3 dynamic questions from text content
    doc_text = doc.extracted_text or ""
    # Sample the beginning of text
    sample_text = doc_text[:8000]
    
    if len(sample_text.strip()) > 100:
        openai_client = get_openai_client()
        try:
            prompt = f"""Based on the following document excerpt, generate exactly 3 interesting and highly specific questions that a user might want to ask about it.
Respond in exactly this JSON format:
{{
  "questions": ["Specific Question 1?", "Specific Question 2?", "Specific Question 3?"]
}}
Excerpt:
{sample_text}"""

            import json
            completion = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.5
            )
            res = json.loads(completion.choices[0].message.content)
            dynamic_questions = res.get("questions", [])
            questions.extend(dynamic_questions[:3])
        except Exception as e:
            logger.error(f"Error generating dynamic questions: {e}")
            # Fallback to general questions
            questions.extend([
                "What are the major terms or points?",
                "Are there any dates or deadlines?",
                "Summarize the key action items."
            ])
    else:
        questions.extend([
            "What are the major terms or points?",
            "Are there any dates or deadlines?",
            "Summarize the key action items."
        ])

    return SuggestedQuestionsResponse(questions=questions)
