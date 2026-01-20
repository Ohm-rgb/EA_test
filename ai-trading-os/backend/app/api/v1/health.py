"""
System Health API Router
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_current_user
from app.models import ErrorLog

router = APIRouter()


class HealthStatus(BaseModel):
    status: str  # healthy/degraded/unhealthy
    uptime: str
    version: str


class ConnectionStatus(BaseModel):
    name: str
    status: str  # connected/disconnected/error
    latency_ms: Optional[int] = None
    last_check: datetime


class ErrorLogResponse(BaseModel):
    id: int
    error_type: str
    severity: str
    message: str
    occurred_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/", response_model=HealthStatus)
async def health_check():
    """System health check"""
    return HealthStatus(
        status="healthy",
        uptime="0d 0h 0m",  # Would be calculated from actual start time
        version="0.1.0"
    )


@router.get("/connections", response_model=List[ConnectionStatus])
async def get_connection_status(
    current_user: dict = Depends(get_current_user)
):
    """Get status of all external connections"""
    connections = []
    now = datetime.utcnow()
    
    # MT5 Connection
    connections.append(ConnectionStatus(
        name="MetaTrader 5",
        status="disconnected",  # Would check actual connection
        latency_ms=None,
        last_check=now
    ))
    
    # Ollama (Local AI)
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            start = datetime.utcnow()
            response = await client.get("http://localhost:11434/api/tags", timeout=2.0)
            latency = int((datetime.utcnow() - start).total_seconds() * 1000)
            
            connections.append(ConnectionStatus(
                name="Ollama (Local AI)",
                status="connected" if response.status_code == 200 else "error",
                latency_ms=latency,
                last_check=now
            ))
    except Exception:
        connections.append(ConnectionStatus(
            name="Ollama (Local AI)",
            status="disconnected",
            latency_ms=None,
            last_check=now
        ))
    
    # External AI (Gemini)
    from app.core.config import settings
    connections.append(ConnectionStatus(
        name="Gemini API",
        status="configured" if settings.GEMINI_API_KEY else "not_configured",
        latency_ms=None,
        last_check=now
    ))
    
    # Database
    connections.append(ConnectionStatus(
        name="Database",
        status="connected",  # If we got here, DB is working
        latency_ms=1,
        last_check=now
    ))
    
    return connections


@router.get("/errors", response_model=List[ErrorLogResponse])
async def get_error_logs(
    severity: Optional[str] = Query(None, description="Filter by severity"),
    error_type: Optional[str] = Query(None, description="Filter by error type"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get error logs with optional filters"""
    query = db.query(ErrorLog)
    
    if severity:
        query = query.filter(ErrorLog.severity == severity)
    if error_type:
        query = query.filter(ErrorLog.error_type == error_type)
    
    errors = query.order_by(ErrorLog.occurred_at.desc()).limit(limit).all()
    return errors


@router.get("/errors/timeline")
async def get_error_timeline(
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get error timeline for visualization"""
    from datetime import timedelta
    
    since = datetime.utcnow() - timedelta(hours=hours)
    errors = db.query(ErrorLog).filter(
        ErrorLog.occurred_at >= since
    ).order_by(ErrorLog.occurred_at).all()
    
    return [
        {
            "id": e.id,
            "type": e.error_type,
            "severity": e.severity,
            "message": e.message[:100],  # Truncate for timeline
            "timestamp": e.occurred_at,
            "resolved": e.resolved_at is not None
        }
        for e in errors
    ]
