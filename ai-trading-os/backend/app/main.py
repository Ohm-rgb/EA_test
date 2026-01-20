"""
AI Trading OS - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, bots, trades, portfolio, settings as settings_api, chat, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    Base.metadata.create_all(bind=engine)
    print("🚀 AI Trading OS Backend Started")
    yield
    # Shutdown
    print("👋 AI Trading OS Backend Stopped")


app = FastAPI(
    title="AI Trading OS",
    description="AI-Driven Trading & Portfolio Management System",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(bots.router, prefix="/api/v1/bots", tags=["Bot Profiles"])
app.include_router(trades.router, prefix="/api/v1/trades", tags=["Trading"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["Portfolio"])
app.include_router(settings_api.router, prefix="/api/v1/settings", tags=["Settings"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI Chat"])
app.include_router(health.router, prefix="/api/v1/health", tags=["System Health"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "AI Trading OS",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs"
    }
