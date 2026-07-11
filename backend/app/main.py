"""GoNow Backend - FastAPI application."""
import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env from backend directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

from app.routers import players, chat

app = FastAPI(
    title="GoNow API",
    description="European Go Database player tracking API",
    version="1.0.0",
)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(players.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"message": "GoNow API is running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
