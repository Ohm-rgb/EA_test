"""
AI Trading OS - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api import bots, indicators, rules # Import our new routers directly
from app.api.v1 import auth, trades, portfolio, settings as settings_api, chat, health



# Force reload trigger
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    Base.metadata.create_all(bind=engine)
    
    # Create default settings if not exists
    from app.core.database import SessionLocal
    from app.models.models import Settings, User
    
    db = SessionLocal()
    try:
        # Create default user if not exists
        if not db.query(User).first():
            default_user = User(
                username="admin",
                password_hash="$2b$12$dummyhashfordev"  # Placeholder
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
            print("[OK] Created default user")
        
        # Create default settings if not exists
        if not db.query(Settings).first():
            user = db.query(User).first()
            default_settings = Settings(
                user_id=user.id,
                risk_profile="balanced",
                max_drawdown_percent=10.0,
                news_sensitivity="soft_filter",
                primary_ai_provider="ollama",
                local_ai_model="llama3.2:3b",
                external_ai_provider="gemini",
                external_ai_model="gemini-2.5-flash",
                monthly_token_limit=100000,
                mt5_account_type="demo"
            )
            db.add(default_settings)
            db.commit()
            print("[OK] Created default settings")
    finally:
        db.close()
    
    print("[STARTUP] AI Trading OS Backend Started")
    yield
    # Shutdown
    print("[SHUTDOWN] AI Trading OS Backend Stopped")


app = FastAPI(
    title="AI Trading OS",
    description="AI-Driven Trading & Portfolio Management System",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(bots.router, prefix="/api/v1/bots", tags=["Bot Profiles"])
app.include_router(indicators.router, prefix="/api/v1/indicators", tags=["Indicators"])
app.include_router(rules.router, prefix="/api/v1/rules", tags=["Rules"]) # Added Rules Router
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
