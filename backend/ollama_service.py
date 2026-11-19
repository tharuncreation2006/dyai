
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv(
    "OLLAMA_BASE_URL",
    "http://127.0.0.1:8001"
).rstrip("/")

GATEWAY_TOKEN = os.getenv("OLLAMA_GATEWAY_TOKEN")

CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2:3b")
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "embeddinggemma")

if not GATEWAY_TOKEN:
    raise RuntimeError("OLLAMA_GATEWAY_TOKEN is missing")

HEADERS = {
    "Authorization": f"Bearer {GATEWAY_TOKEN}",
    "ngrok-skip-browser-warning": "true"
}


async def generate_chat(messages):
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/chat",
            headers=HEADERS,
            json={
                "model": CHAT_MODEL,
                "messages": messages,
                "stream": False
            }
        )

        response.raise_for_status()
        return response.json()


async def create_embeddings(texts):
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/embed",
            headers=HEADERS,
            json={
                "model": EMBED_MODEL,
                "input": texts
            }
        )

        response.raise_for_status()
        return response.json()["embeddings"]
