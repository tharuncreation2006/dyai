
from fastapi import APIRouter, Depends
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["Analytics"])

chatbots_collection = db["chatbots"]
conversations_collection = db["conversations"]
messages_collection = db["messages"]
documents_collection = db["documents"]


def get_owner_id(user):
    return str(user.get("id") or user.get("_id"))


@router.get("/analytics/overview")
async def get_overall_analytics(
    user=Depends(get_current_user)
):
    owner_id = get_owner_id(user)

    # Total chatbots - chatbot collection uses user_id
    total_chatbots = chatbots_collection.count_documents({
        "user_id": owner_id
    })

    # Published chatbots
    published_chatbots = chatbots_collection.count_documents({
        "user_id": owner_id,
        "status": "published"
    })

    # Unpublished chatbots
    unpublished_chatbots = chatbots_collection.count_documents({
        "user_id": owner_id,
        "status": "draft"
    })

    # Total conversations - conversations use owner_id
    total_conversations = conversations_collection.count_documents({
        "owner_id": owner_id
    })

    # Total documents - documents use owner_id
    total_documents = documents_collection.count_documents({
        "owner_id": owner_id
    })

    # Get conversation IDs
    conversations = list(
        conversations_collection.find(
            {"owner_id": owner_id},
            {"_id": 1}
        )
    )

    conversation_ids = [
        str(item["_id"]) for item in conversations
    ]

    # Total messages
    total_messages = messages_collection.count_documents({
        "conversation_id": {"$in": conversation_ids}
    }) if conversation_ids else 0

    # Chatbot performance
    chatbot_stats = []

    for bot in chatbots_collection.find({
        "user_id": owner_id
    }):
        bot_id = str(bot["_id"])

        chatbot_conversations = conversations_collection.count_documents({
            "owner_id": owner_id,
            "chatbot_id": bot_id
        })

        chatbot_stats.append({
            "id": bot_id,
            "name": bot.get("name", "Untitled chatbot"),
            "is_published": bot.get("status") == "published",
            "conversations": chatbot_conversations
        })

    return {
        "overview": {
            "total_chatbots": total_chatbots,
            "published_chatbots": published_chatbots,
            "unpublished_chatbots": unpublished_chatbots,
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "total_documents": total_documents
        },
        "chatbot_stats": chatbot_stats
    }
