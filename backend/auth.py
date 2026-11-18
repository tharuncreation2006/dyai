
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from pwdlib import PasswordHash
from pymongo.errors import DuplicateKeyError

from database import users_collection

router = APIRouter(prefix="/auth", tags=["Authentication"])

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "temporary-fallback-secret-key-change-in-production"
)

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", status_code=201)
def register(data: RegisterRequest):
    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters",
        )

    email = str(data.email).lower().strip()

    if users_collection.find_one({"email": email}):
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    user = {
        "name": data.name.strip(),
        "email": email,
        "password_hash": password_hash.hash(data.password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = users_collection.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    return {
        "message": "Registration successful",
        "user_id": str(result.inserted_id),
        "name": user["name"],
        "email": email,
    }


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    email = form.username.lower().strip()
    user = users_collection.find_one({"email": email})

    if not user or not password_hash.verify(
        form.password, user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(str(user["_id"]))

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": TOKEN_EXPIRE_MINUTES * 60,
    }


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = users_collection.find_one({"_id": object_id})

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
