"""Agentic chat loop with OpenRouter tool calling."""
import os
import json
import httpx
from typing import Optional
from app.models.chat import ChatMessage
from app.services.egd_tools import EGD_TOOLS, execute_tool

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.environ.get("CHAT_MODEL", "google/gemini-2.0-flash-001")
MAX_ITERATIONS = int(os.environ.get("CHAT_MAX_ITERATIONS", "3"))

SYSTEM_PROMPT = """You are a helpful Go (the board game) analytics assistant called GoNow.
You help users understand player statistics, rating changes, tournament performance,
and Go-related questions. You have access to the European Go Database (EGD) tools.

When asked about specific players, use the search_player or get_player_details tools
to look up real data. Be concise and insightful. When presenting data, use clear
formatting with bullet points or tables.

Rating context:
- 30k-20k: Beginner
- 19k-10k: Intermediate
- 9k-1k: Advanced
- 1d-7d: Dan levels (expert)

Always try to provide insights about player progress, trends, and comparisons."""

SUMMARIZATION_SYSTEM_PROMPT = """You are a summarizer assistant. Your only job is to take
the provided conversation, which may include tool use and raw data, and summarize it into
a clear, concise, friendly answer for a Go (board game) enthusiast. Focus on the key insights,
remove technical jargon, make it easy to understand, and keep the tone friendly and helpful.
Use bullet points or tables where appropriate for clarity."""


async def summarize_conversation(
    messages: list[dict],
    api_key: str,
) -> str:
    """
    Summarize the conversation using a dedicated summarization step
    """
    async with httpx.AsyncClient(timeout=60) as client:
        # Prepare summarization prompt
        summary_messages = [
            {"role": "system", "content": SUMMARIZATION_SYSTEM_PROMPT}
        ]
        # Add the conversation history (without tool call IDs, just content)
        for msg in messages[1:]:  # Skip initial system prompt
            if msg.get("role") == "tool":
                continue  # Skip raw tool results
            summary_messages.append({
                "role": msg.get("role"),
                "content": msg.get("content", ""),
            })
        
        # Add a final instruction to summarize
        summary_messages.append({
            "role": "user",
            "content": "Please summarize the above conversation, including all key findings from any tool use, into a concise, friendly answer for the user."
        })
        
        resp = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": summary_messages,
                "max_tokens": 1000,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"].get("content", "")


async def agent_chat(
    message: str,
    history: Optional[list[ChatMessage]] = None,
    context: Optional[str] = None,
) -> dict:
    """
    Run the agentic chat loop:
    1. Send user message + tools to OpenRouter
    2. If LLM calls tools, execute them and feed results back
    3. Loop until LLM produces a final text response (max MAX_ITERATIONS)
    4. Summarize the conversation with a dedicated summarization step
    Returns {"reply": str, "model": str, "tool_calls": list[str]}
    """
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        return {
            "reply": "AI chat is not configured yet. Please add your OpenRouter API key to the backend .env file.",
            "model": "none",
            "tool_calls": [],
        }

    # Build messages array
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if context:
        messages.append({
            "role": "system",
            "content": f"Current page context:\n{context}",
        })

    if history:
        for msg in history[-10:]:  # Limit history to last 10 messages
            messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": message})

    tool_calls_log = []
    final_model = MODEL

    async with httpx.AsyncClient(timeout=60) as client:
        for iteration in range(MAX_ITERATIONS):
            resp = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": messages,
                    "tools": EGD_TOOLS,
                    "max_tokens": 1000,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            final_model = data.get("model", MODEL)

            choice = data["choices"][0]
            assistant_msg = choice["message"]

            # Check if LLM wants to call tools
            tool_calls = assistant_msg.get("tool_calls")
            if tool_calls:
                # Add assistant message with tool calls to conversation
                messages.append({
                    "role": "assistant",
                    "content": assistant_msg.get("content"),
                    "tool_calls": tool_calls,
                })

                # Execute each tool call
                for tc in tool_calls:
                    fn_name = tc["function"]["name"]
                    try:
                        fn_args = json.loads(tc["function"]["arguments"])
                    except json.JSONDecodeError:
                        fn_args = {}

                    tool_calls_log.append(fn_name)
                    result = await execute_tool(fn_name, fn_args)

                    # Add tool result to conversation
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps(result),
                    })

                # Continue loop to let LLM process tool results
                continue
            else:
                # No tool calls - LLM produced initial answer, now summarize
                messages.append({
                    "role": "assistant",
                    "content": assistant_msg.get("content", ""),
                })
                break

        # If we exhausted iterations, make one more call without tools to get a text response
        if len(tool_calls_log) > 0 and len(messages) == 3 + (2 * MAX_ITERATIONS):
            messages.append({
                "role": "user",
                "content": "Please summarize your findings and provide a final answer to the user.",
            })
            resp = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": messages,
                    "max_tokens": 1000,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            final_model = data.get("model", MODEL)
            messages.append({
                "role": "assistant",
                "content": data["choices"][0]["message"].get("content", ""),
            })

        # Now run the summarization step
        summary = await summarize_conversation(messages, api_key)
        return {
            "reply": summary,
            "model": final_model,
            "tool_calls": tool_calls_log,
        }
