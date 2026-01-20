"""
Tests for Bot Control API
"""
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

# Test state transition validation
from app.api.v1.bots import validate_transition, VALID_TRANSITIONS


class TestStateTransitions:
    """Test bot state transition validation logic."""
    
    def test_stopped_can_start(self):
        """Bot can start from stopped state."""
        assert validate_transition("stopped", "start") is True
    
    def test_stopped_cannot_pause(self):
        """Bot cannot pause from stopped state."""
        assert validate_transition("stopped", "pause") is False
    
    def test_stopped_cannot_stop(self):
        """Bot cannot stop from stopped state."""
        assert validate_transition("stopped", "stop") is False
    
    def test_running_can_stop(self):
        """Bot can stop from running state."""
        assert validate_transition("running", "stop") is True
    
    def test_running_can_pause(self):
        """Bot can pause from running state."""
        assert validate_transition("running", "pause") is True
    
    def test_running_cannot_start(self):
        """Bot cannot start when already running."""
        assert validate_transition("running", "start") is False
    
    def test_paused_can_start(self):
        """Bot can start from paused state (resume)."""
        assert validate_transition("paused", "start") is True
    
    def test_paused_can_stop(self):
        """Bot can stop from paused state."""
        assert validate_transition("paused", "stop") is True
    
    def test_paused_cannot_pause(self):
        """Bot cannot pause when already paused."""
        assert validate_transition("paused", "pause") is False


class TestValidTransitionsConfig:
    """Test VALID_TRANSITIONS configuration is complete."""
    
    def test_all_states_have_transitions(self):
        """All states should have defined transitions."""
        expected_states = ["stopped", "running", "paused"]
        for state in expected_states:
            assert state in VALID_TRANSITIONS, f"Missing state: {state}"
    
    def test_stopped_transitions(self):
        """Stopped state should only allow start."""
        assert VALID_TRANSITIONS["stopped"] == ["start"]
    
    def test_running_transitions(self):
        """Running state should allow stop and pause."""
        assert set(VALID_TRANSITIONS["running"]) == {"stop", "pause"}
    
    def test_paused_transitions(self):
        """Paused state should allow start and stop."""
        assert set(VALID_TRANSITIONS["paused"]) == {"start", "stop"}


class TestRateLimiting:
    """Test rate limiting logic."""
    
    def test_rate_limit_allows_initial_requests(self):
        """Rate limiter should allow initial requests."""
        from app.api.v1.bots import check_rate_limit, _rate_limit_store
        
        # Clear any existing state
        test_user = "test_rate_limit_user"
        if test_user in _rate_limit_store:
            del _rate_limit_store[test_user]
        
        # First request should be allowed
        assert check_rate_limit(test_user) is True
    
    def test_rate_limit_blocks_excessive_requests(self):
        """Rate limiter should block after too many requests."""
        from app.api.v1.bots import check_rate_limit, _rate_limit_store, RATE_LIMIT_REQUESTS
        
        test_user = "test_excessive_user"
        if test_user in _rate_limit_store:
            del _rate_limit_store[test_user]
        
        # Make max allowed requests
        for _ in range(RATE_LIMIT_REQUESTS):
            check_rate_limit(test_user)
        
        # Next request should be blocked
        assert check_rate_limit(test_user) is False
