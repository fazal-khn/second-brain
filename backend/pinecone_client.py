import os
import logging
from typing import List, Dict, Any
from pinecone import Pinecone
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX")

def get_pinecone_index():
    if not PINECONE_API_KEY or PINECONE_API_KEY == "mock_pinecone_api_key":
        logger.warning("Pinecone API Key is set to mock values. Pinecone operations will fail.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pinecone credentials not configured. Please set PINECONE_API_KEY and PINECONE_INDEX in your .env file."
        )
    
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        # Check if index exists in index list
        active_indexes = [idx.name for idx in pc.list_indexes()]
        if PINECONE_INDEX_NAME not in active_indexes:
            logger.error(f"Pinecone index '{PINECONE_INDEX_NAME}' does not exist in active indexes: {active_indexes}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Pinecone index '{PINECONE_INDEX_NAME}' not found. Please create a Pinecone index with 1536 dimensions (Cosine similarity)."
            )
        
        return pc.Index(PINECONE_INDEX_NAME)
    except Exception as e:
        logger.error(f"Failed to connect to Pinecone index: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pinecone connection error: {str(e)}"
        )

def upsert_document_chunks(vectors: List[Dict[str, Any]], namespace: str):
    """
    vectors is a list of dicts:
    {
      "id": str,
      "values": List[float], (1536 floats)
      "metadata": {
        "text": str,
        "page": int,
        "document_id": str
      }
    }
    """
    index = get_pinecone_index()
    try:
        # Pinecone upsert takes list of tuples or dicts
        # Batch upsert in chunks of 100 to avoid request size limits
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch, namespace=namespace)
        logger.info(f"Successfully upserted {len(vectors)} chunks to Pinecone namespace: {namespace}")
    except Exception as e:
        logger.error(f"Failed to upsert vectors to Pinecone: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pinecone upsert failed: {str(e)}"
        )

def query_document_chunks(query_vector: List[float], namespace: str, top_k: int = 5) -> List[Dict[str, Any]]:
    index = get_pinecone_index()
    try:
        response = index.query(
            vector=query_vector,
            top_k=top_k,
            include_metadata=True,
            namespace=namespace
        )
        # Parse matches
        results = []
        for match in response.get("matches", []):
            results.append({
                "score": match.get("score"),
                "text": match.get("metadata", {}).get("text", ""),
                "page": match.get("metadata", {}).get("page", 1),
                "document_id": match.get("metadata", {}).get("document_id", "")
            })
        return results
    except Exception as e:
        logger.error(f"Failed to query Pinecone: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pinecone query failed: {str(e)}"
        )

def delete_document_namespace(namespace: str):
    index = get_pinecone_index()
    try:
        index.delete(delete_all=True, namespace=namespace)
        logger.info(f"Successfully deleted Pinecone namespace: {namespace}")
    except Exception as e:
        logger.error(f"Failed to delete Pinecone namespace: {e}")
        # We don't necessarily want to block doc delete if Pinecone delete fails (e.g. namespace already gone/doesn't exist)
        # but let's log it and allow it.
        pass
