"""Pydantic models for chat."""
from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None  # Optional player data context
    history: Optional[list[ChatMessage]] = None


class ChatResponse(BaseModel):
    reply: str
    model: Optional[str] = None
    tool_calls: Optional[list[str]] = None
