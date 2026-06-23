import os
import json
import csv
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import StringIO
from database import get_db
from models import User, Document, DocumentSummary, ExtractedData
from schemas import (
    DocumentResponse, ExtractedDataResponse, SmartActionRequest,
    SmartActionResponse, UserResponse
)
from auth import get_current_user
from pipeline import get_openai_client

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analyze",
    tags=["analyze"]
)

# Helper function to query GPT-4o with json format
def query_gpt_json(prompt: str, system_prompt: str = "You are a helpful document analyzer.") -> Dict[str, Any]:
    client = get_openai_client()
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        content_str = response.choices[0].message.content
        return json.loads(content_str)
    except Exception as e:
        logger.error(f"Error querying OpenAI GPT-4o JSON: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI model service failed: {str(e)}"
        )

@router.get("/{id}/summary")
def get_document_summary(id: str, type: str = "standard", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate type
    if type not in ["quick", "standard", "detailed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Summary type must be 'quick', 'standard', or 'detailed'"
        )

    # 1. Check if document exists and belongs to user
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if doc.processing_status != "ready":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document processing is not finished.")

    # 2. Check if summary of this type already exists in DB
    existing_summary = db.query(DocumentSummary).filter(
        DocumentSummary.document_id == id,
        DocumentSummary.summary_type == type
    ).first()

    if existing_summary:
        return existing_summary.content

    # 3. If not, generate using GPT-4o
    doc_text = doc.extracted_text or ""
    # Truncate text if it is extremely long to fit within LLM context (e.g. 50k words)
    truncated_text = doc_text[:120000] # ~30,000 tokens

    if type == "quick":
        prompt = f"""You are an expert document analyst. Read this document content and provide an ultra-concise summary.

Document: {truncated_text}

Respond in exactly this JSON format:
{{
  "bullets": [
    "Key point 1 (max 15 words)",
    "Key point 2 (max 15 words)",
    "Key point 3 (max 15 words)"
  ],
  "one_liner": "Single sentence describing what this document is (max 20 words)",
  "document_type": "Contract/Report/Manual/Academic/Legal/Financial/Other",
  "target_audience": "Who this document is written for"
}}
"""
    elif type == "detailed":
        prompt = f"""You are an expert document analyst. Provide a comprehensive structured summary of this document.

Document: {truncated_text}

Respond in exactly this JSON format:
{{
  "title": "Document title or best guess",
  "purpose": "Why this document exists (2-3 sentences)",
  "main_sections": [
    {{
      "section": "Section name",
      "summary": "What this section covers (2-3 sentences)"
    }}
  ],
  "key_findings": ["Finding 1", "Finding 2", "Finding 3"],
  "conclusions": "Main conclusions or outcomes (2-3 sentences)",
  "important_dates": ["Any deadlines or dates mentioned"],
  "action_required": ["Any actions the reader must take"]
}}
"""
    else: # standard
        prompt = f"""You are an expert document analyst. Provide a standard summary of this document.

Document: {truncated_text}

Respond in exactly this JSON format:
{{
  "summary": "A standard paragraph summary of the document (approx 150 words)",
  "main_topic": "What the document is about in one sentence",
  "key_points": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "target_audience": "Who this document is written for",
  "document_type": "Contract/Report/Manual/Academic/Legal/Financial/Other"
}}
"""

    summary_json = query_gpt_json(prompt)

    # Save to database
    db_summary = DocumentSummary(
        document_id=id,
        summary_type=type,
        content=summary_json
    )
    db.add(db_summary)
    db.commit()

    return summary_json


@router.get("/{id}/extracted-data")
def get_extracted_data(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if doc.processing_status != "ready":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document processing is not finished.")

    # Check database cache
    existing_data = db.query(ExtractedData).filter(ExtractedData.document_id == id).first()
    if existing_data:
        return {
            "dates": existing_data.dates,
            "monetary_values": existing_data.monetary_values,
            "people": existing_data.people,
            "organizations": existing_data.organizations,
            "statistics": existing_data.statistics,
            "locations": existing_data.locations,
            "action_items": existing_data.action_items
        }

    # Generate
    doc_text = doc.extracted_text or ""
    truncated_text = doc_text[:120000]

    prompt = f"""You are a data extraction specialist. Extract all structured data from this document.

Document: {truncated_text}

Extract everything and respond in exactly this JSON format:
{{
  "dates": [{{"value": "date string", "context": "what this date refers to"}}],
  "monetary_values": [{{"value": "amount", "currency": "USD/GBP/etc", "context": "what this amount is"}}],
  "people": [{{"name": "full name", "role": "their role or title"}}],
  "organizations": [{{"name": "org name", "type": "company/gov/ngo/etc"}}],
  "statistics": [{{"value": "number or %", "context": "what this stat means"}}],
  "locations": [{{"place": "location name", "context": "why mentioned"}}],
  "action_items": [{{"action": "what must be done", "owner": "who must do it or unknown", "deadline": "by when or unknown"}}]
}}

If any category has no items, return an empty array.
"""
    data_json = query_gpt_json(prompt)

    # Save to database
    db_extracted = ExtractedData(
        document_id=id,
        dates=data_json.get("dates", []),
        monetary_values=data_json.get("monetary_values", []),
        people=data_json.get("people", []),
        organizations=data_json.get("organizations", []),
        statistics=data_json.get("statistics", []),
        locations=data_json.get("locations", []),
        action_items=data_json.get("action_items", [])
    )
    db.add(db_extracted)
    db.commit()

    return data_json


@router.get("/{id}/extracted-data/csv")
def export_extracted_data_csv(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    data = db.query(ExtractedData).filter(ExtractedData.document_id == id).first()
    if not data:
        # If not cached, trigger generation first
        data_json = get_extracted_data(id, current_user, db)
        data = db.query(ExtractedData).filter(ExtractedData.document_id == id).first()

    # Create CSV in-memory
    f = StringIO()
    writer = csv.writer(f)
    
    # Write Category Header and rows
    writer.writerow(["Category", "Item/Value", "Context/Role/Owner", "Extra Info/Deadline"])
    
    for item in data.dates:
        writer.writerow(["Date", item.get("value"), item.get("context"), ""])
    for item in data.monetary_values:
        writer.writerow(["Monetary Value", f"{item.get('value')} ({item.get('currency')})", item.get("context"), ""])
    for item in data.people:
        writer.writerow(["Person", item.get("name"), item.get("role"), ""])
    for item in data.organizations:
        writer.writerow(["Organization", item.get("name"), item.get("type"), ""])
    for item in data.statistics:
        writer.writerow(["Statistic", item.get("value"), item.get("context"), ""])
    for item in data.locations:
        writer.writerow(["Location", item.get("place"), item.get("context"), ""])
    for item in data.action_items:
        writer.writerow(["Action Item", item.get("action"), item.get("owner"), item.get("deadline")])

    f.seek(0)
    response = StreamingResponse(f, media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=extracted_data_{id}.csv"
    return response


@router.get("/{id}/insights")
def get_document_insights(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if doc.processing_status != "ready":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document processing is not finished.")

    doc_text = doc.extracted_text or ""
    truncated_text = doc_text[:120000]

    # Generate insights
    prompt = f"""You are a professional editor and analyst. Read this document text and perform deep insights analysis.

Document: {truncated_text}

Respond in exactly this JSON format:
{{
  "sentiment": {{"positive_pct": 40, "neutral_pct": 50, "negative_pct": 10}},
  "reading_level": "Elementary/High School/Academic",
  "keywords": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8", "word9", "word10"],
  "topics": [{{"topic": "Theme name", "percentage": 70}}, {{"topic": "Another theme", "percentage": 30}}],
  "structure_score": 85,
  "readability_score": 75,
  "readability_suggestions": ["First recommendation to improve reading flow", "Second suggestion"],
  "language": "Detected language (e.g. English)",
  "reading_time_minutes": 5
}}
"""
    insights_json = query_gpt_json(prompt)
    return insights_json


@router.post("/{id}/smart-action", response_model=SmartActionResponse)
def execute_smart_action(
    id: str,
    request: SmartActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if doc.processing_status != "ready":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document processing is not finished.")

    doc_text = doc.extracted_text or ""
    truncated_text = doc_text[:120000]

    action = request.action_type
    lang = request.language or "English"

    if action == "executive_summary":
        prompt = f"""Provide a comprehensive 1-page Executive Summary of this document in {lang}. Cover the background context, core objectives, major findings, and strategic impact. Make the output structured and professional.
Document: {truncated_text}
Return your response in this JSON format:
{{ "content": "Your markdown-formatted executive summary here" }}"""

    elif action == "quiz":
        prompt = f"""Generate 10 quiz questions from this document to test comprehension. Respond in this JSON format:
{{
  "content": "### Comprehension Quiz\\n\\n1. **Question 1**\\n   - Options or Question text\\n   *Answer:* Correct answer (Page X)\\n\\n..."
}}
Document: {truncated_text}"""

    elif action == "checklist":
        prompt = f"""Extract all action items, tasks, and requirements from this document into a clean, markdown checklist. Each item must have a checkbox, owner (if known), and deadline (if known).
Document: {truncated_text}
Respond in JSON:
{{ "content": "### Action Items Checklist\\n\\n- [ ] Task 1 (Owner: X, Deadline: Y)\\n- [ ] Task 2..." }}"""

    elif action == "twitter":
        prompt = f"""Convert this document into an engaging Twitter/X thread of exactly 10 tweets.
Document: {truncated_text}
Rules:
- Tweet 1: Hook that makes people want to read
- Tweets 2-9: Key insights, one per tweet
- Tweet 10: Conclusion + call to action
- Each tweet max 280 characters
- Use numbers (1/10, 2/10 etc)
- No hashtags
Respond in this JSON format:
{{ "content": "1/10: Hook tweet text\\n\\n2/10: Second tweet text\\n\\n..." }}"""

    elif action == "email":
        prompt = f"""Write a professional email summary of this document in {lang} to send to a team or executives. Include a subject line, executive greeting, main takeaways in bullet points, and next steps.
Document: {truncated_text}
Respond in this JSON format:
{{ "content": "Subject: Email Subject Here\\n\\nBody: Email Body Here" }}"""

    elif action == "translation":
        prompt = f"""Translate a standard summary of this document into the following language: {lang}. Make the translation natural and accurate.
Document: {truncated_text}
Respond in this JSON format:
{{ "content": "Translated summary text here" }}"""

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported smart action type."
        )

    res_json = query_gpt_json(prompt)
    
    # Return structural response wrapper
    return SmartActionResponse(content=res_json.get("content", ""))
