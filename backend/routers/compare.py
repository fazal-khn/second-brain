import os
import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from database import get_db
from models import User, Document, Comparison
from schemas import ComparisonCreate, ComparisonResponse
from auth import get_current_user
from pipeline import get_openai_client
from fpdf import FPDF

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/compare",
    tags=["compare"]
)

def query_gpt_comparison(docs: List[Document]) -> Dict[str, Any]:
    client = get_openai_client()
    num_docs = len(docs)
    
    # Dynamically structure prompt based on number of documents
    doc_inputs = ""
    for i, doc in enumerate(docs):
        # Truncate text to avoid context overload (e.g. max 35,000 chars per doc)
        truncated_text = (doc.extracted_text or "")[:35000]
        doc_inputs += f"\nDocument {i+1} ({doc.filename}) [ID: doc{i+1}]:\n{truncated_text}\n"

    if num_docs == 2:
        prompt = f"""You are an expert document analyst. Compare these 2 documents thoroughly.

{doc_inputs}

Provide a thorough comparison in exactly this JSON format:
{{
  "similarity_score": 0-100,
  "common_topics": ["Topic covered in both documents"],
  "unique_to_doc1": ["Topics only in document 1"],
  "unique_to_doc2": ["Topics only in document 2"],
  "agreements": [{{"topic": "topic name", "description": "how they agree"}}],
  "contradictions": [{{"topic": "topic name", "doc1_says": "what doc 1 says", "doc2_says": "what doc 2 says"}}],
  "more_detailed_on": [{{"topic": "topic", "winner": "doc1 or doc2", "reason": "why"}}],
  "overall_verdict": "2-3 sentence summary of the key differences and relationship between these documents"
}}
"""
    else: # num_docs == 3
        prompt = f"""You are an expert document analyst. Compare these 3 documents thoroughly.

{doc_inputs}

Provide a thorough comparison in exactly this JSON format:
{{
  "similarity_score": 0-100,
  "common_topics": ["Topic covered in all documents"],
  "unique_to_doc1": ["Topics only in document 1"],
  "unique_to_doc2": ["Topics only in document 2"],
  "unique_to_doc3": ["Topics only in document 3"],
  "agreements": [{{"topic": "topic name", "description": "how they agree across documents"}}],
  "contradictions": [{{"topic": "topic name", "doc1_says": "...", "doc2_says": "...", "doc3_says": "..."}}],
  "more_detailed_on": [{{"topic": "topic", "winner": "doc1, doc2 or doc3", "reason": "why"}}],
  "overall_verdict": "2-3 sentence summary of the key differences and relationship between these documents"
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional comparative analyst. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        content_str = response.choices[0].message.content
        return json.loads(content_str)
    except Exception as e:
        logger.error(f"Error querying OpenAI GPT-4o for comparison: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI comparison failed: {str(e)}"
        )

@router.post("", response_model=ComparisonResponse)
def compare_documents(
    payload: ComparisonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc_ids = payload.document_ids
    if len(doc_ids) < 2 or len(doc_ids) > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must select either 2 or 3 documents to compare."
        )

    # 1. Fetch documents and verify user owns all of them
    docs = db.query(Document).filter(
        Document.id.in_(doc_ids),
        Document.user_id == current_user.id
    ).all()

    if len(docs) != len(doc_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected documents do not exist or do not belong to you."
        )

    for doc in docs:
        if doc.processing_status != "ready":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document '{doc.filename}' is not fully processed yet."
            )

    # 2. Check if this exact comparison already exists in DB (same user and same doc IDs)
    # Sort doc_ids to ensure order-independent caching
    sorted_ids = sorted(doc_ids)
    
    # We retrieve comparisons and match sorted IDs
    all_comparisons = db.query(Comparison).filter(Comparison.user_id == current_user.id).all()
    for comp in all_comparisons:
        if sorted(comp.document_ids) == sorted_ids:
            return comp

    # 3. Generate comparison
    comparison_result = query_gpt_comparison(docs)

    # Save to database
    db_comparison = Comparison(
        user_id=current_user.id,
        document_ids=doc_ids,
        result=comparison_result
    )
    db.add(db_comparison)
    db.commit()
    db.refresh(db_comparison)

    return db_comparison


# PDF Generator Class using fpdf2
class ComparisonPDF(FPDF):
    def header(self):
        self.set_fill_color(124, 58, 237) # Purple Theme
        self.rect(0, 0, 210, 15, 'F')
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 12)
        self.cell(0, 5, 'AI DOCUMENT ANALYZER - COMPARISON REPORT', 0, 1, 'C')
        self.ln(10)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}} - Generated by AI Document Analyzer', 0, 0, 'C')

@router.get("/{id}/report")
def export_comparison_report(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comparison = db.query(Comparison).filter(Comparison.id == id, Comparison.user_id == current_user.id).first()
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comparison not found"
        )

    # Fetch document filenames
    docs = db.query(Document).filter(
        Document.id.in_(comparison.document_ids),
        Document.user_id == current_user.id
    ).all()
    doc_map = {f"doc{i+1}": doc.filename for i, doc in enumerate(docs)}
    doc_list_names = ", ".join([doc.filename for doc in docs])

    res = comparison.result
    
    # Initialize PDF
    pdf = ComparisonPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # 1. Main Title
    pdf.set_text_color(20, 20, 20)
    pdf.set_font('Helvetica', 'B', 20)
    pdf.cell(0, 10, "Document Comparison Report", 0, 1, 'L')
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, f"Compared files: {doc_list_names}", 0, 1, 'L')
    pdf.ln(5)

    # 2. Similarity Score Badge
    score = res.get("similarity_score", 0)
    pdf.set_fill_color(243, 244, 246)
    pdf.rect(10, pdf.get_y(), 190, 20, 'F')
    
    pdf.set_xy(15, pdf.get_y() + 5)
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(124, 58, 237) # Purple
    pdf.cell(50, 10, f"Similarity Index: {score}%", 0, 0, 'L')
    
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(80, 80, 80)
    
    status_text = "Highly Similar" if score > 75 else "Moderately Similar" if score > 40 else "Distinct Documents"
    pdf.cell(0, 10, f"Analysis: {status_text}", 0, 1, 'R')
    pdf.ln(10)

    # 3. Overall Verdict
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 10, "Overall Comparative Verdict", 0, 1)
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(0, 6, res.get("overall_verdict", "N/A"))
    pdf.ln(8)

    # 4. Common Topics
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(20, 20, 20)
    pdf.cell(0, 10, "Common Topics Covered", 0, 1)
    pdf.set_font('Helvetica', '', 10)
    for topic in res.get("common_topics", []):
        pdf.cell(5, 6, "-", 0, 0)
        pdf.cell(0, 6, topic, 0, 1)
    pdf.ln(8)

    # 5. Agreements Table
    pdf.set_font('Helvetica', 'B', 14)
    pdf.cell(0, 10, "Agreement Points", 0, 1)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_fill_color(220, 252, 231) # light green
    pdf.cell(60, 8, "Topic", 1, 0, 'L', True)
    pdf.cell(130, 8, "Points of Agreement", 1, 1, 'L', True)
    pdf.set_font('Helvetica', '', 10)
    for agree in res.get("agreements", []):
        x = pdf.get_x()
        y = pdf.get_y()
        pdf.multi_cell(60, 6, agree.get("topic", "N/A"), 1, 'L')
        y1 = pdf.get_y()
        pdf.set_xy(x + 60, y)
        pdf.multi_cell(130, 6, agree.get("description", "N/A"), 1, 'L')
        y2 = pdf.get_y()
        pdf.set_xy(x, max(y1, y2))
    pdf.ln(8)

    # 6. Contradictions Table
    pdf.set_font('Helvetica', 'B', 14)
    pdf.cell(0, 10, "Contradiction & Divergence Points", 0, 1)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_fill_color(254, 226, 226) # light red
    pdf.cell(50, 8, "Topic", 1, 0, 'L', True)
    pdf.cell(70, 8, f"Says: {doc_map.get('doc1', 'Document 1')}", 1, 0, 'L', True)
    pdf.cell(70, 8, f"Says: {doc_map.get('doc2', 'Document 2')}", 1, 1, 'L', True)
    pdf.set_font('Helvetica', '', 9)
    for contra in res.get("contradictions", []):
        x = pdf.get_x()
        y = pdf.get_y()
        pdf.multi_cell(50, 6, contra.get("topic", "N/A"), 1, 'L')
        y1 = pdf.get_y()
        pdf.set_xy(x + 50, y)
        pdf.multi_cell(70, 6, contra.get("doc1_says", contra.get("doc1", "N/A")), 1, 'L')
        y2 = pdf.get_y()
        pdf.set_xy(x + 120, y)
        pdf.multi_cell(70, 6, contra.get("doc2_says", contra.get("doc2", "N/A")), 1, 'L')
        y3 = pdf.get_y()
        pdf.set_xy(x, max(y1, y2, y3))
    pdf.ln(8)

    # Output to BytesIO
    pdf_bytes = pdf.output(dest='S')
    buffer = BytesIO(pdf_bytes)
    
    response = StreamingResponse(buffer, media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=document_comparison_report_{id}.pdf"
    return response
