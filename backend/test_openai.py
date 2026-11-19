from ollama_service import generate_chat

messages = [
    {"role": "user", "content": "Hello, introduce yourself."}
]

answer = generate_chat(messages)

print(answer)