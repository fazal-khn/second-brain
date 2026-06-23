# AI Document Analyzer (AllPDF.online Upgrade)

A complete, fully functional AI-powered Document Analyzer. Upload PDF, DOCX, or TXT documents to instantly summarize, search, extract key data, perform sentiment/insight analysis, trigger smart actions (like quiz or tweet thread generation), and compare multiple documents side-by-side.

## Key Features
1. **JWT Authentication**: User registration/login, secure HTTPOnly cookie tokens, and user-isolated documents.
2. **Document Processing Pipeline**:
   - Save to AWS S3.
   - Extract text using PyPDF2 & pdfplumber (PDF) or python-docx (DOCX).
   - Chunk text (500 tokens, 50 overlap) with tiktoken.
   - Embed using OpenAI `text-embedding-3-small` and upsert to Pinecone.
3. **Interactive Analysis**:
   - Summaries at 3 detail levels (Quick, Standard, Detailed).
   - RAG Chat with exact source page/section citation.
   - Structured key data extraction (exportable as CSV).
   - Deep insights: Sentiment score, keywords, readability score, reading time, topic breakdown.
   - Smart actions: Quiz, Executive Summary, Action items checklist, Twitter/X thread, Email summary, Translation.
4. **Multi-Document Comparison**: Compare up to 3 documents side-by-side (agreements, contradictions, similarity rating) and export comparison reports as PDF.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui, React Hook Form, Axios, React Dropzone, React Markdown, Recharts.
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy ORM, Alembic, OpenAI GPT-4o, Pinecone Vector DB, AWS S3.

## Setup Instructions

### 1. Configure Credentials
Duplicate `.env.example` as `.env` and fill in the following variables:
- `SECRET_KEY`: Any secure hex string.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`: AWS S3 connection settings.
- `OPENAI_API_KEY`: Required for embeddings and GPT-4o analysis.
- `PINECONE_API_KEY`, `PINECONE_INDEX`: Pinecone credentials. Ensure your Pinecone index is configured with **1536 dimensions** and **Cosine** metric.

### 2. Launching via Docker Compose
Run the following command at the root of the project to build and start the containers:
```bash
docker-compose up --build
```

The services will be exposed at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Database**: localhost:5432
