import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError

# Base DATABASE_URL, defaulting to what docker-compose uses
default_db = "postgresql://postgres:postgres@db:5432/ai_doc_analyzer"
DATABASE_URL = os.getenv("DATABASE_URL", default_db)

logging.info(f"Attempting to connect to database: {DATABASE_URL}")

try:
    if DATABASE_URL.startswith("postgresql"):
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
    else:
        engine = create_engine(DATABASE_URL)
    
    # Test connection
    with engine.connect() as conn:
        logging.info("Successfully connected to the primary database.")
except (OperationalError, Exception) as e:
    logging.warning(f"Failed to connect to primary database ({e}). Falling back to local SQLite database.")
    DATABASE_URL = "sqlite:///./sql_app.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Test SQLite connection
    with engine.connect() as conn:
        logging.info("Successfully connected to the fallback SQLite database.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
