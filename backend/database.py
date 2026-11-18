import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://127.0.0.1:27017/"
)


DATABASE_NAME = os.getenv(
    "MONGODB_DATABASE",
    "dynamic_ai_chatbot"
)

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000
)

db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
workspaces_collection = db["workspaces"]
chatbots_collection = db["chatbots"]
knowledge_sources_collection = db["knowledge_sources"]
conversations_collection = db["conversations"]
messages_collection = db["messages"]

def check_database_connection():
    client.admin.command("ping")
    return True
