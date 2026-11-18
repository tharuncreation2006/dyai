import os
from fastapi import FastAPI, HTTPException
from pymongo.errors import PyMongoError
from fastapi.middleware.cors import CORSMiddleware

from database import client, db, check_database_connection
from auth import router as auth_router
from chat import router as chat_router
from chatbots import router as chatbots_router
from analytics import router as analytics_router
from visitors import router as visitors_router
from documents import router as documents_router

app = FastAPI(title="Dynamic AI Chatbot Platform")

# Configure CORS origins
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(chatbots_router)
app.include_router(analytics_router)
app.include_router(visitors_router)
app.include_router(documents_router)


@app.get("/")
def home():
    return {"message": "Chatbot API is running!"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/db-test")
def database_test():
    try:
        check_database_connection()
        return {
            "database": "MongoDB connected",
            "database_name": db.name
        }
    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="MongoDB connection failed"
        )


@app.on_event("shutdown")
def shutdown():
    client.close()
