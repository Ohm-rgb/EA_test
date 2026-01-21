"""
AI Model Configuration
Centralized configuration for available AI models - Single Source of Truth
"""
from typing import List, Set

# ============================================
# ALLOWED LOCAL AI MODELS (Ollama)
# Update this list when adding/removing models
# ============================================
ALLOWED_LOCAL_MODELS: Set[str] = {
    "qwen3:4b",
    "qwen3:8b",
    "qwen3:14b",
    "llama3.1:8b",
    "qwen3-vl:8b",
    "qwen3-vl:8bth",
}

# Default model for new users
DEFAULT_LOCAL_MODEL = "qwen3:8b"

# ============================================
# ALLOWED EXTERNAL AI MODELS
# ============================================
ALLOWED_GEMINI_MODELS: Set[str] = {
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-flash",
}

ALLOWED_OPENAI_MODELS: Set[str] = {
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
}

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


def validate_local_model(model_name: str) -> bool:
    """
    Validate if model name is in allowed list.
    Case-insensitive matching.
    """
    if not model_name:
        return False
    return model_name.lower() in {m.lower() for m in ALLOWED_LOCAL_MODELS}


def normalize_local_model(model_name: str) -> str:
    """
    Normalize model name to match Ollama's expected format.
    Returns the canonical name from ALLOWED_LOCAL_MODELS.
    """
    if not model_name:
        return DEFAULT_LOCAL_MODEL
    
    model_lower = model_name.lower()
    for allowed in ALLOWED_LOCAL_MODELS:
        if allowed.lower() == model_lower:
            return allowed
    
    # If not found, return default
    return DEFAULT_LOCAL_MODEL


def get_available_local_models() -> List[str]:
    """Get sorted list of available local models."""
    return sorted(list(ALLOWED_LOCAL_MODELS))


def validate_gemini_model(model_name: str) -> bool:
    """Validate Gemini model name."""
    if not model_name:
        return False
    return model_name in ALLOWED_GEMINI_MODELS


def validate_openai_model(model_name: str) -> bool:
    """Validate OpenAI model name."""
    if not model_name:
        return False
    return model_name in ALLOWED_OPENAI_MODELS
