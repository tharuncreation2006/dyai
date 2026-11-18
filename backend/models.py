
from sqlalchemy import (
    Column, Integer, String, Text,
    ForeignKey, DateTime, func
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)

    chatbots = relationship("Chatbot", back_populates="owner")


class Chatbot(Base):
    __tablename__ = "chatbots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="chatbots")
    conversations = relationship(
        "Conversation", back_populates="chatbot"
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"))
    user_message = Column(Text, nullable=False)
    ai_response = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    chatbot = relationship(
        "Chatbot", back_populates="conversations"
    )
