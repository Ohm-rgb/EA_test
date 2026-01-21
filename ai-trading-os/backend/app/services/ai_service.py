"""
AI Service Facade
Manages multiple AI providers (Ollama, Gemini) with failover strategy.
"""
import logging
from typing import Optional, Dict, Any, AsyncGenerator

from app.core.config import settings
from app.services.ollama_client import OllamaClient
from app.services.gemini_client import GeminiClient

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.ollama = OllamaClient(base_url=settings.OLLAMA_BASE_URL)
        self.gemini = GeminiClient(api_key=settings.GEMINI_API_KEY)
        self.primary_provider = "ollama"  # Default, can be overridden by user settings settings

    async def generate_response(
        self, 
        prompt: str, 
        context: Optional[Dict[str, Any]] = None,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate response from AI with failover.
        
        Args:
            prompt: User message
            context: Context data (page, user info, etc.)
            provider: Force specific provider (optional)
            
        Returns:
            Dict containing: message, role, model_used, tokens_used
        """
        # Determine provider order
        target_provider = provider or self.primary_provider
        
        try:
            # Case 1: Explicitly requesting Gemini -> Direct call
            if target_provider == "gemini":
                return await self._try_gemini(prompt, context)

            # Case 2: Ollama (Primary) or Unspecified -> Try Local first, then Auto-Failover to Cloud
            # User Request: "If local system cannot process, send data outside"
            try:
                return await self._try_ollama(prompt, context)
            except Exception as e:
                logger.warning(f"Local AI (Ollama) failed: {e}. Auto-switching to Cloud (Gemini).")
                return await self._try_gemini(prompt, context)
                    
        except Exception as e:
            logger.error(f"All AI providers failed: {e}")
            return {
                "message": "Sorry, I'm having trouble connecting to my AI brain right now. Please check the system health.",
                "role": "system",
                "model_used": "error",
                "tokens_used": 0
            }

    async def _try_ollama(self, prompt: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Attempt to use Ollama"""
        if not await self.ollama.is_available():
            raise ConnectionError("Ollama service not available")
            
        return await self.ollama.generate(prompt, context)

    async def _try_gemini(self, prompt: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Attempt to use Gemini"""
        # If API key not set, try to load from database
        if not self.gemini.has_api_key():
            self._load_gemini_settings_from_db()
        
        # Check again after loading
        if not self.gemini.has_api_key():
            raise ValueError("Gemini API key not configured. Please set it in Settings page.")
            
        return await self.gemini.generate(prompt, context)

    def _load_gemini_settings_from_db(self):
        """Load Gemini API key and model from database settings"""
        try:
            from app.core.database import SessionLocal
            from app.models import Settings
            
            db = SessionLocal()
            try:
                db_settings = db.query(Settings).first()
                if db_settings:
                    if db_settings.gemini_api_key:
                        self.gemini.set_api_key(db_settings.gemini_api_key)
                        logger.info("Loaded Gemini API key from database")
                    if db_settings.external_ai_model:
                        self.gemini.model = db_settings.external_ai_model
                        logger.info(f"Using Gemini model: {db_settings.external_ai_model}")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Failed to load Gemini settings from DB: {e}")

    def update_settings(self, new_settings: Dict[str, Any]):
        """Update service settings at runtime"""
        if "gemini_api_key" in new_settings:
            self.gemini.set_api_key(new_settings["gemini_api_key"])
        
        if "primary_ai_provider" in new_settings:
            self.primary_provider = new_settings["primary_ai_provider"]

        if "local_ai_model" in new_settings:
            self.ollama.model = new_settings["local_ai_model"]
            
        if "external_ai_model" in new_settings:
            self.gemini.model = new_settings["external_ai_model"]

# Singleton instance
ai_service = AIService()

