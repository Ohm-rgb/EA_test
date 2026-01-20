"""
Tests for Authentication API
"""
import pytest
from unittest.mock import MagicMock, patch


class TestLoginRateLimiting:
    """Test login rate limiting logic."""
    
    def test_rate_limit_allows_initial_logins(self):
        """Rate limiter should allow initial login attempts."""
        from app.api.v1.auth import check_login_rate_limit, _login_rate_limit
        
        test_key = "test_ip:test_user"
        if test_key in _login_rate_limit:
            del _login_rate_limit[test_key]
        
        assert check_login_rate_limit(test_key) is True
    
    def test_rate_limit_blocks_excessive_logins(self):
        """Rate limiter should block after too many login attempts."""
        from app.api.v1.auth import check_login_rate_limit, _login_rate_limit, LOGIN_RATE_LIMIT
        
        test_key = "test_ip:excessive_user"
        if test_key in _login_rate_limit:
            del _login_rate_limit[test_key]
        
        # Make max allowed attempts
        for _ in range(LOGIN_RATE_LIMIT):
            check_login_rate_limit(test_key)
        
        # Next attempt should be blocked
        assert check_login_rate_limit(test_key) is False


class TestAPIKeyValidation:
    """Test API key format validation."""
    
    def test_valid_gemini_key_format(self):
        """Valid Gemini API key should pass validation."""
        from app.api.v1.settings import validate_gemini_key
        
        # Valid format: AIza followed by 35 chars
        valid_key = "AIza" + "A" * 35
        assert validate_gemini_key(valid_key) is True
    
    def test_invalid_gemini_key_format(self):
        """Invalid Gemini API key should fail validation."""
        from app.api.v1.settings import validate_gemini_key
        
        assert validate_gemini_key("invalid_key") is False
        assert validate_gemini_key("sk-123456") is False
    
    def test_empty_gemini_key_allowed(self):
        """Empty/None key should be allowed (for removal)."""
        from app.api.v1.settings import validate_gemini_key
        
        assert validate_gemini_key("") is True
        assert validate_gemini_key(None) is True
    
    def test_valid_openai_key_format(self):
        """Valid OpenAI API key should pass validation."""
        from app.api.v1.settings import validate_openai_key
        
        # Valid format: sk- followed by 40+ chars
        valid_key = "sk-" + "A" * 48
        assert validate_openai_key(valid_key) is True
    
    def test_invalid_openai_key_format(self):
        """Invalid OpenAI API key should fail validation."""
        from app.api.v1.settings import validate_openai_key
        
        assert validate_openai_key("invalid_key") is False
        assert validate_openai_key("AIza123456") is False
