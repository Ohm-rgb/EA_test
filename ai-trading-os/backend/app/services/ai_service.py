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
            if target_provider == "ollama":
                return await self._try_ollama(prompt, context)
            elif target_provider == "gemini":
                return await self._try_gemini(prompt, context)
            else:
                # Default to Ollama first, then Gemini
                try:
                    return await self._try_ollama(prompt, context)
                except Exception as e:
                    logger.warning(f"Ollama failed, falling back to Gemini: {e}")
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
        # Check if API key is configured
        if not self.gemini.has_api_key():
            raise ValueError("Gemini API key not configured")
            
        return await self.gemini.generate(prompt, context)

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
