"""
Ollama Client
Integration with local Ollama instance
"""
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.model = "llama3.2:3b" # Default model

    async def is_available(self) -> bool:
        """Check if Ollama is running"""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    async def generate(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate response from Ollama"""
        
        # Build system prompt from context
        system_prompt = self._build_system_prompt(context)
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                resp.raise_for_status()
                data = resp.json()
                
                response_text = data.get("response", "")
                # Estimate tokens (rough approximation)
                total_tokens = len(prompt.split()) + len(response_text.split()) + len(system_prompt.split())
                
                return {
                    "message": response_text,
                    "role": "local_ai",
                    "model_used": self.model,
                    "tokens_used": total_tokens
                }
                
            except httpx.HTTPError as e:
                logger.error(f"Ollama generation failed: {e}")
                raise

    def _build_system_prompt(self, context: Optional[Dict[str, Any]]) -> str:
        """Construct system prompt based on context"""
        base_prompt = "You are an AI assistant for an Algorithmic Trading Platform. Be concise, professional, and helpful."
        
        if context:
            page = context.get("context_page", "unknown")
            base_prompt += f"\nUser is currently on the '{page}' page."
            
            # Add specific context hints
            if "portfolio" in page:
                base_prompt += " Focus on performance metrics, profit/loss, and risk exposure."
            elif "settings" in page:
                base_prompt += " Help with configuration, API keys, and system preferences."
            elif "bot-studio" in page:
                base_prompt += " Assist with strategy logic, indicators, and parameters."
        
        return base_prompt
