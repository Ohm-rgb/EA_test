"""
Gemini Client
Integration with Google Gemini API
"""
import logging
from typing import Dict, Any, Optional

# In a real app, you might use 'google-generativeai' library
# For this Sprint, we'll use direct REST calls or a placeholder if lib not installed
import httpx

logger = logging.getLogger(__name__)

from app.core.ai_models import DEFAULT_GEMINI_MODEL

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.model = DEFAULT_GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def set_api_key(self, key: str):
        self.api_key = key

    def has_api_key(self) -> bool:
        return bool(self.api_key)

    async def generate(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate response from Gemini"""
        if not self.api_key:
            raise ValueError("No API key provided for Gemini")
            
        system_content = self._build_system_content(context)
        
        # Prepare request for Gemini API
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        
        payload = {
            "contents": [{
                "parts": [{"text": f"{system_content}\n\nUser: {prompt}"}]
            }]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                
                # Extract text from response structure
                try:
                    response_text = data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    response_text = "Error parsing Gemini response."

                # Estimate tokens
                total_tokens = len(prompt.split()) + len(response_text.split()) + 50
                
                return {
                    "message": response_text,
                    "role": "external_ai",
                    "model_used": self.model,
                    "tokens_used": total_tokens
                }
                
            except httpx.HTTPError as e:
                logger.error(f"Gemini generation failed: {e}")
                raise

    def _build_system_content(self, context: Optional[Dict[str, Any]]) -> str:
        """Construct system context string"""
        base_prompt = "You are an AI assistant for an Algorithmic Trading Platform."
        if context:
            page = context.get("context_page", "")
            if page:
                base_prompt += f" Context: User is viewing {page}."
        return base_prompt
