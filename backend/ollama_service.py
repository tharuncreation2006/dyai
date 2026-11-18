
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv(
    "OLLAMA_BASE_URL", "http://127.0.0.1:11434"
).rstrip("/")

CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2:3b")
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "embeddinggemma")


async def generate_chat(messages):
    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": CHAT_MODEL,
                "messages": messages,
                "stream": False
            }
        )
        response.raise_for_status()
        return response.json()["message"]["content"]


async def create_embeddings(texts):
    if not texts:
        return []

    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/embed",
            json={
                "model": EMBED_MODEL,
                "input": texts
            }
        )
        response.raise_for_status()
        return response.json()["embeddings"]
