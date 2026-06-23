import uuid
from sqlalchemy import Column, String, Float, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    storage_used_mb = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    comparisons = relationship("Comparison", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf, docx, txt
    file_size_mb = Column(Float, nullable=False)
    s3_key = Column(String(555), nullable=False)
    page_count = Column(Integer, nullable=True)
    word_count = Column(Integer, nullable=True)
    token_count = Column(Integer, nullable=True)
    extracted_text = Column(Text, nullable=True)
    pinecone_namespace = Column(String(255), nullable=True)
    processing_status = Column(String(50), default="uploading")  # uploading, processing, ready, failed
    processing_progress = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="documents")
    summaries = relationship("DocumentSummary", back_populates="document", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="document", cascade="all, delete-orphan")
    extracted_data = relationship("ExtractedData", back_populates="document", cascade="all, delete-orphan")

class DocumentSummary(Base):
    __tablename__ = "document_summaries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    summary_type = Column(String(50), nullable=False)  # quick, standard, detailed
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="summaries")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    source_chunks = Column(JSON, nullable=True)  # Pages or reference details
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")

class ExtractedData(Base):
    __tablename__ = "extracted_data"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    dates = Column(JSON, default=list)
    monetary_values = Column(JSON, default=list)
    people = Column(JSON, default=list)
    organizations = Column(JSON, default=list)
    statistics = Column(JSON, default=list)
    locations = Column(JSON, default=list)
    action_items = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="extracted_data")

class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_ids = Column(JSON, nullable=False)  # list of UUIDs
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="comparisons")
