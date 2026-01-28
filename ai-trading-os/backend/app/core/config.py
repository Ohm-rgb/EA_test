"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Database
    DATABASE_URL: str = "sqlite:///./dev_v2.db"
    
    # JWT
    JWT_SECRET: str = "change-this-to-a-secure-random-string"
    JWT_EXPIRE_HOURS: int = 24
    JWT_ALGORITHM: str = "HS256"
    
    # MT5
    MT5_SERVER: str = ""
    MT5_LOGIN: str = ""
    MT5_PASSWORD: str = ""
    
    # AI - Ollama (Local)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:8b"
    
    # AI - Gemini (External)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # App
    APP_ENV: str = "development"
    DEBUG: bool = True
    CORS_ORIGINS: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
