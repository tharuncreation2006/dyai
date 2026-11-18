
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from bson import ObjectId
from pymongo.errors import PyMongoError

from auth import get_current_user
from rag_service import (
    upload_document,
    documents,
    chunks_collection
)

router = APIRouter(prefix="/api", tags=["Documents"])


def get_owner_id(user):
    return str(user.get("id") or user.get("_id"))


# Get all documents belonging to the logged-in user
@router.get("/documents")
def get_documents(user=Depends(get_current_user)):

    owner_id = get_owner_id(user)

    try:
        result = documents.find(
            {"owner_id": owner_id}
        ).sort("created_at", -1)

        return [
        {
            "id": str(doc["_id"]),
            "_id": str(doc["_id"]),
            "filename": doc.get("filename", "Document"),
            "chunk_count": doc.get("chunk_count", 0),
            "status": "Uploaded",
            "created_at": doc.get("created_at")
        }
        for doc in result
    ]

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch documents."
        )


# Upload a document
@router.post("/documents/upload")
async def upload_document_api(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):

    owner_id = get_owner_id(user)

    return await upload_document(file, owner_id)


# Delete a document and its RAG chunks
@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    user=Depends(get_current_user)
):

    owner_id = get_owner_id(user)

    # Validate MongoDB ObjectId
    if not ObjectId.is_valid(document_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid document ID."
        )

    try:
        # Find the document belonging to the logged-in user
        document = documents.find_one({
            "_id": ObjectId(document_id),
            "owner_id": owner_id
        })

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found or you do not have permission to delete it."
            )

        # Delete all associated RAG chunks
        chunks_collection.delete_many({
            "document_id": document_id,
            "owner_id": owner_id
        })

        # Delete the document itself
        result = documents.delete_one({
            "_id": ObjectId(document_id),
            "owner_id": owner_id
        })

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Document could not be deleted."
            )

        return {
            "message": "Document and associated chunks deleted successfully.",
            "document_id": document_id
        }

    except PyMongoError:
        raise HTTPException(
            status_code=500,
            detail="Database error while deleting document."
        )
