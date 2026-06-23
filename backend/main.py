from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)

# Fail-safe database table initialization on startup
try:
    logging.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logging.info("Database tables initialized successfully.")
except Exception as e:
    logging.error(f"Error initializing database tables on startup: {e}")

app = FastAPI(
    title="AI Document Analyzer API",
    description="Backend API powering the AI Document Analyzer (AllPDF.online Upgrade)",
    version="1.0.0"
)

# CORS configuration
# Allow Next.js frontend running on port 3000 to interact with credentials (cookies)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
from routers import auth, documents, analyze, chat, compare

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(analyze.router)
app.include_router(chat.router)
app.include_router(compare.router)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "AI Document Analyzer Backend"}
