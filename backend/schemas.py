from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- User Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserGoogleLogin(BaseModel):
    email: EmailStr
    full_name: str
    uid: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    storage_used_mb: float
    created_at: datetime
    access_token: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    original_filename: str
    file_type: str
    file_size_mb: float
    s3_key: str
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    token_count: Optional[int] = None
    pinecone_namespace: Optional[str] = None
    processing_status: str
    processing_progress: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Chat Schemas ---
class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: str
    document_id: str
    user_id: str
    role: str
    content: str
    source_chunks: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    response: str
    source_chunks: Optional[List[Dict[str, Any]]] = None

class SuggestedQuestionsResponse(BaseModel):
    questions: List[str]

# --- Extracted Data Schemas ---
class ExtractedDataResponse(BaseModel):
    id: str
    document_id: str
    dates: List[Dict[str, Any]]
    monetary_values: List[Dict[str, Any]]
    people: List[Dict[str, Any]]
    organizations: List[Dict[str, Any]]
    statistics: List[Dict[str, Any]]
    locations: List[Dict[str, Any]]
    action_items: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Comparison Schemas ---
class ComparisonCreate(BaseModel):
    document_ids: List[str]

class ComparisonResponse(BaseModel):
    id: str
    user_id: str
    document_ids: List[str]
    result: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Smart Action Schemas ---
class SmartActionRequest(BaseModel):
    action_type: str  # executive_summary, quiz, checklist, twitter, email, translation
    language: Optional[str] = "English"

class SmartActionResponse(BaseModel):
    content: str
