
import io
import re
import math
from datetime import datetime, timezone

from fastapi import UploadFile, HTTPException
from pypdf import PdfReader
from docx import Document

from database import db
from ollama_service import create_embeddings

# MongoDB collections
documents = db["documents"]
chunks_collection = db["document_chunks"]


# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
CHUNK_SIZE = 800
CHUNK_OVERLAP = 120
MAX_CHUNKS = 500


# Split text into smaller overlapping chunks
def split_text(text):
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        chunks.append(text[start:end])

        if end == len(text):
            break

        start = end - CHUNK_OVERLAP

    return chunks


# Extract text from supported file formats
def extract_text(filename, content):
    name = filename.lower()

    try:
        if name.endswith(".txt"):
            return content.decode("utf-8-sig")

        elif name.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(content))
            return "\n".join(
                page.extract_text() or ""
                for page in reader.pages
            )

        elif name.endswith(".docx"):
            doc = Document(io.BytesIO(content))
            return "\n".join(
                paragraph.text
                for paragraph in doc.paragraphs
            )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read document: {str(exc)}"
        )

    raise HTTPException(
        status_code=400,
        detail="Only PDF, DOCX and TXT files are supported."
    )


# Upload document and generate embeddings
async def upload_document(file: UploadFile, owner_id: str):

    filename = file.filename or "document.txt"

    # Read at most 10 MB + 1 byte to detect oversized files
    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The file is empty."
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Maximum file size is 10 MB."
        )

    # Extract text
    text = extract_text(filename, content)

    # Split extracted text
    chunks = split_text(text)

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="No readable text found in the document."
        )

    if len(chunks) > MAX_CHUNKS:
        raise HTTPException(
            status_code=400,
            detail="This document creates too many chunks. Use a smaller file."
        )

    # Generate embeddings using Ollama
    try:
        embeddings = await create_embeddings(chunks)

        if len(embeddings) != len(chunks):
            raise ValueError(
                "Embedding count does not match chunk count."
            )

        if not embeddings or not all(embeddings):
            raise ValueError(
                "Empty embeddings returned by Ollama."
            )

        dimensions = len(embeddings[0])

        if dimensions == 0:
            raise ValueError("Embedding dimensions are empty.")

        if any(len(embedding) != dimensions for embedding in embeddings):
            raise ValueError(
                "Embedding dimensions do not match."
            )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Embedding generation failed: {str(exc)}"
        )

    # Save document information
    now = datetime.now(timezone.utc)

    try:
        result = documents.insert_one({
            "owner_id": owner_id,
            "filename": filename,
            "chunk_count": len(chunks),
            "created_at": now
        })

        document_id = str(result.inserted_id)

        # Save chunks and embeddings
        chunk_records = [
            {
                "owner_id": owner_id,
                "document_id": document_id,
                "filename": filename,
                "text": chunk,
                "embedding": embedding
            }
            for chunk, embedding in zip(chunks, embeddings)
        ]

        chunks_collection.insert_many(chunk_records)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save document to database: {str(exc)}"
        )

    return {
        "document_id": document_id,
        "filename": filename,
        "chunk_count": len(chunks)
    }


# Calculate cosine similarity between embeddings
def cosine_similarity(a, b):

    if not a or not b or len(a) != len(b):
        return 0.0

    dot = sum(x * y for x, y in zip(a, b))

    norm_a = math.sqrt(
        sum(x * x for x in a)
    )

    norm_b = math.sqrt(
        sum(y * y for y in b)
    )

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (norm_a * norm_b)


# Find the most relevant document chunks
async def find_relevant_chunks(
    question,
    owner_id,
    limit=4,
    document_ids=None
):

    if not question or not question.strip():
        return []

    if document_ids is not None and not document_ids:
        return []

    # Generate embedding for the user's question
    try:
        query_embeddings = await create_embeddings([question])

        if not query_embeddings or not query_embeddings[0]:
            raise ValueError("No query embedding returned.")

        query_embedding = query_embeddings[0]

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Query embedding generation failed: {str(exc)}"
        )

    # Search only documents belonging to this user
    search_filter = {
        "owner_id": owner_id
    }

    if document_ids is not None:
        search_filter["document_id"] = {
            "$in": document_ids
        }

    cursor = chunks_collection.find(search_filter)

    scored = []

    for item in cursor:

        score = cosine_similarity(
            query_embedding,
            item.get("embedding", [])
        )

        if score > 0:
            scored.append({
                "document_id": item["document_id"],
                "filename": item["filename"],
                "text": item["text"],
                "score": score
            })

    # Sort by highest similarity
    scored.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return scored[:max(1, limit)]
