
import os
import secrets
import httpx

from fastapi import FastAPI, Header, HTTPException
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

OLLAMA_LOCAL_URL = os.getenv(
    "OLLAMA_LOCAL_URL",
    "http://127.0.0.1:11434"
).rstrip("/")

GATEWAY_TOKEN = os.getenv("OLLAMA_GATEWAY_TOKEN")

if not GATEWAY_TOKEN:
    raise RuntimeError("OLLAMA_GATEWAY_TOKEN is missing")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(
    payload: dict,
    authorization: str = Header(default="")
):
    expected = f"Bearer {GATEWAY_TOKEN}"

    if not secrets.compare_digest(authorization, expected):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{OLLAMA_LOCAL_URL}/api/chat",
            json=payload
        )

    return response.json() if response.is_success else HTTPException(
        status_code=response.status_code,
        detail=response.text
    )


@app.post("/api/embed")
async def embed(
    payload: dict,
    authorization: str = Header(default="")
):
    expected = f"Bearer {GATEWAY_TOKEN}"

    if not secrets.compare_digest(authorization, expected):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{OLLAMA_LOCAL_URL}/api/embed",
            json=payload
        )

    return response.json() if response.is_success else HTTPException(
        status_code=response.status_code,
        detail=response.text
    )
