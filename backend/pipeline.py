import os
import re
import logging
import docx
import pdfplumber
import PyPDF2
import tiktoken
from typing import List, Dict, Any, Tuple
from openai import OpenAI
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def get_openai_client():
    if not OPENAI_API_KEY or OPENAI_API_KEY == "mock_openai_api_key":
        logger.warning("OpenAI API Key is set to mock values. OpenAI integrations will fail.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file."
        )
    return OpenAI(api_key=OPENAI_API_KEY)

def count_tokens(text: str) -> int:
    try:
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception as e:
        logger.error(f"Error encoding tokens: {e}")
        # Rough fallback: 1 token ~= 4 characters or 0.75 words
        return len(text.split()) * 4 // 3

def extract_pages_pdf(file_path: str) -> List[Dict[str, Any]]:
    pages_data = []
    
    # 1. Try extracting with pdfplumber (best for structured text and tables)
    try:
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                # Clean text a bit
                text = re.sub(r'\s+', ' ', text).strip()
                pages_data.append({
                    "page_number": i + 1,
                    "text": text
                })
        
        # If pdfplumber didn't find any text, try PyPDF2 as a fallback
        total_text_len = sum(len(p["text"]) for p in pages_data)
        if total_text_len == 0:
            logger.info("pdfplumber extracted 0 characters. Trying PyPDF2 fallback...")
            pages_data = []
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for i, page in enumerate(reader.pages):
                    text = page.extract_text() or ""
                    text = re.sub(r'\s+', ' ', text).strip()
                    pages_data.append({
                        "page_number": i + 1,
                        "text": text
                    })
    except Exception as e:
        logger.error(f"Error reading PDF: {e}")
        # Fallback PyPDF2 in case pdfplumber failed
        try:
            pages_data = []
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for i, page in enumerate(reader.pages):
                    text = page.extract_text() or ""
                    text = re.sub(r'\s+', ' ', text).strip()
                    pages_data.append({
                        "page_number": i + 1,
                        "text": text
                    })
        except Exception as ex:
            logger.error(f"Fallback PyPDF2 also failed: {ex}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to extract text from PDF: {str(e)}"
            )
            
    return pages_data

def extract_pages_docx(file_path: str) -> List[Dict[str, Any]]:
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        
        # Merge all text with spaces
        merged_text = " ".join(full_text)
        
        # Word documents don't have hard physical pages like PDFs.
        # We divide it logically: approx 400 words per "page"
        words = merged_text.split()
        words_per_page = 400
        pages_data = []
        
        for i in range(0, len(words), words_per_page):
            page_words = words[i:i + words_per_page]
            page_text = " ".join(page_words)
            pages_data.append({
                "page_number": (i // words_per_page) + 1,
                "text": page_text
            })
            
        return pages_data
    except Exception as e:
        logger.error(f"Error reading DOCX: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from DOCX: {str(e)}"
        )

def extract_pages_txt(file_path: str) -> List[Dict[str, Any]]:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        
        # Clean text
        text = re.sub(r'\s+', ' ', text).strip()
        words = text.split()
        words_per_page = 400
        pages_data = []
        
        for i in range(0, len(words), words_per_page):
            page_words = words[i:i + words_per_page]
            page_text = " ".join(page_words)
            pages_data.append({
                "page_number": (i // words_per_page) + 1,
                "text": page_text
            })
            
        return pages_data
    except Exception as e:
        logger.error(f"Error reading TXT: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from TXT: {str(e)}"
        )

def get_text_chunks(pages: List[Dict[str, Any]], chunk_size: int = 500, chunk_overlap: int = 50) -> List[Dict[str, Any]]:
    """
    Splits page texts into chunks of `chunk_size` tokens with `chunk_overlap` tokens overlap.
    Retains page number context for source citations.
    """
    chunks = []
    encoding = tiktoken.get_encoding("cl100k_base")
    
    for page in pages:
        page_num = page["page_number"]
        page_text = page["text"]
        
        if not page_text:
            continue
            
        tokens = encoding.encode(page_text)
        num_tokens = len(tokens)
        
        if num_tokens <= chunk_size:
            chunks.append({
                "text": page_text,
                "page_number": page_num,
                "token_count": num_tokens
            })
            continue
            
        # Sliding window chunking on the page level
        start = 0
        while start < num_tokens:
            end = start + chunk_size
            chunk_tokens = tokens[start:end]
            chunk_text = encoding.decode(chunk_tokens)
            
            chunks.append({
                "text": chunk_text,
                "page_number": page_num,
                "token_count": len(chunk_tokens)
            })
            
            start += (chunk_size - chunk_overlap)
            
    return chunks

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    client = get_openai_client()
    try:
        # OpenAI embedding API supports batching
        # text-embedding-3-small yields 1536-dimensional vectors
        response = client.embeddings.create(
            input=texts,
            model="text-embedding-3-small"
        )
        return [data.embedding for data in response.data]
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OpenAI embedding generation failed: {str(e)}"
        )
