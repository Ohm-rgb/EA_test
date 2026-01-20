"""
Audit Logging Service
Logs security-sensitive actions (bot control, auth events) for compliance and debugging.
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Ensure logs directory exists
AUDIT_LOG_DIR = Path(__file__).parent.parent.parent / "logs" / "audit"
AUDIT_LOG_DIR.mkdir(parents=True, exist_ok=True)

BOT_CONTROL_LOG = AUDIT_LOG_DIR / "bot_control.jsonl"


class AuditService:
    """Service for audit logging of security-sensitive actions."""
    
    def log_bot_control(
        self,
        user_id: int,
        username: str,
        action: str,
        bot_id: Optional[int] = None,
        bot_name: Optional[str] = None,
        result: str = "success",
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log bot control action.
        
        Args:
            user_id: ID of user performing action
            username: Username of user
            action: Action performed (start, stop, pause, emergency_stop)
            bot_id: ID of bot being controlled (None for emergency_stop)
            bot_name: Name of bot (for readability)
            result: Result of action (success, failed, rejected)
            error_message: Error message if action failed
            ip_address: Client IP address
            extra: Additional context data
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "bot_control",
            "user_id": user_id,
            "username": username,
            "action": action,
            "bot_id": bot_id,
            "bot_name": bot_name,
            "result": result,
            "error_message": error_message,
            "ip_address": ip_address,
            "extra": extra or {}
        }
        
        self._write_log(BOT_CONTROL_LOG, log_entry)
        
        # Also log to standard logger for real-time monitoring
        log_msg = f"[AUDIT] {action.upper()} bot_id={bot_id} by user={username} result={result}"
        if result == "success":
            logger.info(log_msg)
        else:
            logger.warning(f"{log_msg} error={error_message}")
    
    def log_auth_event(
        self,
        event_type: str,
        username: str,
        result: str,
        ip_address: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> None:
        """
        Log authentication event.
        
        Args:
            event_type: Type of event (login, logout, session_refresh)
            username: Username attempting authentication
            result: Result (success, failed)
            ip_address: Client IP address
            error_message: Error message if failed
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": f"auth_{event_type}",
            "username": username,
            "result": result,
            "ip_address": ip_address,
            "error_message": error_message
        }
        
        auth_log = AUDIT_LOG_DIR / "auth.jsonl"
        self._write_log(auth_log, log_entry)
    
    def _write_log(self, log_file: Path, entry: Dict[str, Any]) -> None:
        """Write log entry to JSONL file."""
        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")


# Singleton instance
audit_service = AuditService()
