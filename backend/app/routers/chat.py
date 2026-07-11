"""AI Chat API route - Agentic chat with EGD tool calling."""
from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_agent import agent_chat

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the AI chat assistant with agentic tool calling."""
    try:
        result = await agent_chat(
            message=request.message,
            history=request.history,
            context=request.context,
        )
        return ChatResponse(
            reply=result["reply"],
            model=result.get("model"),
            tool_calls=result.get("tool_calls"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
"""AI Chat API route (OpenRouter proxy)."""
import os
import httpx
from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/api", tags=["chat"])

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """You are a helpful Go (the board game) analytics assistant.
You help users understand player statistics, rating changes, tournament performance,
and Go-related questions. Be concise and insightful.
When discussing ratings, remember that Go ratings (GoR) roughly correspond to:
- 30k-20k: Beginner
- 19k-10k: Intermediate
- 9k-1k: Advanced
- 1d-7d: Dan levels (expert)

Provide insights about player progress, trends, and comparisons when asked."""


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message to the AI chat assistant."""
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        return ChatResponse(
            reply="AI chat is not configured yet. Please add your OpenRouter API key to the backend .env file.",
            model="none",
        )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add context if provided (e.g., current player data)
    if request.context:
        messages.append({
            "role": "system",
            "content": f"Current player context:\n{request.context}",
        })

    # Add conversation history
    if request.history:
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})

    # Add current message
    messages.append({"role": "user", "content": request.message})

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-3.5-turbo",
                    "messages": messages,
                    "max_tokens": 500,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            model = data.get("model", "unknown")
            return ChatResponse(reply=reply, model=model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat API error: {str(e)}")
