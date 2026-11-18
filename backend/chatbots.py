
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId

from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/chatbots", tags=["Chatbots"])

chatbots_collection = db["chatbots"]


# Request models
class ChatbotCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    welcome_message: str = "Hello! How can I help you?"
    instructions: str = ""
    model: str = "llama3.2:3b"
    language: str = "English"
    color: str = Field(
    default="#7C3AED",
    pattern=r"^#[0-9A-Fa-f]{6}$"  
    )
    logo: str | None = Field(default=None, max_length=1500000)

class ChatbotUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    welcome_message: str | None = None
    instructions: str | None = None
    model: str | None = None
    language: str | None = None
    color: str | None = Field(
    default=None,
    pattern=r"^#[0-9A-Fa-f]{6}$"
    )
    logo: str | None = Field(default=None, max_length=1500000)

def get_owner_id(current_user):
    return str(current_user["id"])


def get_owned_chatbot(chatbot_id, owner_id):
    if not ObjectId.is_valid(chatbot_id):
        raise HTTPException(status_code=400, detail="Invalid chatbot ID")

    oid = ObjectId(chatbot_id)

    # Check whether the chatbot exists, regardless of owner
    chatbot = chatbots_collection.find_one({"_id": oid})

    print("\n--- CHATBOT DEBUG ---")
    print("Chatbot ID:", chatbot_id)
    print("Current owner ID:", repr(owner_id))

    if chatbot:
        print("Stored user ID:", repr(chatbot.get("user_id")))
        print("Stored user ID type:", type(chatbot.get("user_id")).__name__)
        print("Database:", chatbots_collection.database.name)
        print("Collection:", chatbots_collection.name)
    else:
        print("Chatbot ID does not exist in this collection.")

    # Keep the ownership check
    if not chatbot or str(chatbot.get("user_id")) != str(owner_id):
        raise HTTPException(status_code=404, detail="Chatbot not found")

    return chatbot

def format_chatbot(chatbot):
    published_at = chatbot.get("published_at")

    return {
        "id": str(chatbot["_id"]),
        "name": chatbot["name"],
        "description": chatbot.get("description", ""),
        "welcome_message": chatbot.get("welcome_message", ""),
        "instructions": chatbot.get("instructions", ""),
        "model": chatbot.get("model", "llama3.2:3b"),
        "language": chatbot.get("language", "English"),
        "status": chatbot.get("status", "draft"),
        "public_id": chatbot.get("public_id"),
        "published_at": (
            published_at.isoformat() if published_at else None
        ),
        "created_at": chatbot["created_at"].isoformat(),
        "color": chatbot.get("color", "#7C3AED"),
        "logo": chatbot.get("logo"),
    }


# Create chatbot
@router.post("")
def create_chatbot(
    data: ChatbotCreate,
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)

    chatbot = {
        **data.model_dump(),
        "user_id": owner_id,
        "status": "draft",
        "public_id": None,
        "published_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = chatbots_collection.insert_one(chatbot)
    chatbot["_id"] = result.inserted_id

    return {
        "message": "Chatbot created successfully",
        "chatbot": format_chatbot(chatbot)
    }


# Get all chatbots belonging to logged-in user




# Get all chatbots belonging to logged-in user
@router.get("")
def get_chatbots(
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)

    print("\n--- GET CHATBOTS DEBUG ---")
    print("Current owner ID:", repr(owner_id))
    print("Database:", db.name)

    chatbots = chatbots_collection.find({
        "user_id": owner_id
    }).sort("created_at", -1)

    result = [format_chatbot(bot) for bot in chatbots]

    print("Chatbots returned:", len(result))
    print("--- END DEBUG ---\n")

    return result


# Update chatbot
@router.put("/{chatbot_id}")
def update_chatbot(
    chatbot_id: str,
    data: ChatbotUpdate,
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)

    get_owned_chatbot(chatbot_id, owner_id)

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No update fields provided"
        )

    updates["updated_at"] = datetime.now(timezone.utc)

    chatbots_collection.update_one(
        {
            "_id": ObjectId(chatbot_id),
            "user_id": owner_id
        },
        {"$set": updates}
    )

    chatbot = get_owned_chatbot(chatbot_id, owner_id)

    return {
        "message": "Chatbot updated successfully",
        "chatbot": format_chatbot(chatbot)
    }



# Publish chatbot
@router.post("/{chatbot_id}/publish")
def publish_chatbot(
    chatbot_id: str,
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)

    chatbot = get_owned_chatbot(chatbot_id, owner_id)

    now = datetime.now(timezone.utc)

    public_id = chatbot.get("public_id") or str(uuid4())

    result = chatbots_collection.update_one(
        {
            "_id": chatbot["_id"],
            "user_id": owner_id
        },
        {
            "$set": {
                "status": "published",
                "public_id": public_id,
                "published_at": now,
                "updated_at": now
            }
        }
    )

    if result.modified_count == 0 and chatbot.get("status") != "published":
        raise HTTPException(
            status_code=500,
            detail="Failed to publish chatbot"
        )

    return {
        "message": "Chatbot published successfully",
        "status": "published",
        "chatbot_id": chatbot_id,
        "public_id": public_id
    }



# Unpublish chatbot
@router.post("/{chatbot_id}/unpublish")
def unpublish_chatbot(
    chatbot_id: str,
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)

    chatbot = get_owned_chatbot(chatbot_id, owner_id)

    result = chatbots_collection.update_one(
        {
            "_id": chatbot["_id"],
            "user_id": owner_id
        },
        {
            "$set": {
                "status": "draft",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Chatbot not found"
        )

    return {
        "message": "Chatbot unpublished successfully",
        "status": "draft",
        "chatbot_id": chatbot_id
    }

# Public chatbot configuration
# No login required, but only published chatbots are accessible.
@router.get("/public/{public_id}")
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

    # Return only information safe for public access.
   
    return {
        "public_id": chatbot["public_id"],
        "name": chatbot["name"],
        "description": chatbot.get("description", ""),
        "welcome_message": chatbot.get(
            "welcome_message",
            "Hello! How can I help you?"
        ),
        "language": chatbot.get("language", "English"),
        "color": chatbot.get("color", "#7C3AED"),
        "logo": chatbot.get("logo"),
    }



# Delete chatbot
@router.delete("/{chatbot_id}")
def delete_chatbot(
    chatbot_id: str,
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)

    chatbot = get_owned_chatbot(chatbot_id, owner_id)

    chatbots_collection.delete_one({
        "_id": chatbot["_id"],
        "user_id": owner_id
    })

    return {
        "message": "Chatbot deleted successfully"
    }
