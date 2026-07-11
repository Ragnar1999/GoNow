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
