import asyncio
from ollama_service import generate_chat, create_embeddings


async def main():
    messages = [
        {
            "role": "user",
            "content": "Say hello and explain what you can do."
        }
    ]

    answer = await generate_chat(messages)
    print("AI RESPONSE:")
    print(answer)

    embeddings = await create_embeddings(["Hello world"])

    print("\nEMBEDDING TEST:")
    print("Number of embeddings:", len(embeddings))
    print("Embedding dimensions:", len(embeddings[0]))


asyncio.run(main())