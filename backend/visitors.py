
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from database import db, chatbots_collection

router = APIRouter(prefix="/api/public", tags=["Public Visitors"])

visitors_collection = db["visitors"]


class VisitorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    mobile: str = Field(pattern=r"^[0-9]{10}$")


@router.get("/{public_id}")
def get_public_chatbot(public_id: str):

    chatbot = chatbots_collection.find_one({
        "public_id": public_id,
        "status": "published"
    })

    if not chatbot:
        raise HTTPException(
            status_code=404,
            detail="Published chatbot not found"
        )

    return {
        "chatbot": {
            "id": str(chatbot["_id"]),
            "name": chatbot.get("name", "AI Assistant"),
            "description": chatbot.get("description", ""),
            "logo": chatbot.get("logo"),
            "color": chatbot.get("color", "#7C3AED")
        }
    }

@router.post("/{public_id}/visitors")
def save_visitor(public_id: str, visitor: VisitorCreate):

    chatbot = chatbots_collection.find_one({
        "public_id": public_id,
        "status": "published"
    })

    if not chatbot:
        raise HTTPException(
            status_code=404,
            detail="Published chatbot not found"
        )

    visitor_data = {
        "name": visitor.name.strip(),
        "email": str(visitor.email).lower(),
        "mobile": visitor.mobile,
        "chatbot_id": str(chatbot["_id"]),
        "public_id": public_id,
        "conversation_id": None,
        "created_at": datetime.now(timezone.utc)
    }

    result = visitors_collection.insert_one(visitor_data)

    return {
        "message": "Visitor details saved successfully",
        "visitor_id": str(result.inserted_id)
    }
