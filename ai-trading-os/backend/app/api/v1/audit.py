from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from app import models
from app.core.database import get_db
from app.core.security import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["audit"])

class AuditLogResponse(BaseModel):
    id: int
    action: str
    target_table: Optional[str]
    target_id: Optional[str]
    old_value: Optional[Any]
    new_value: Optional[Any]
    performed_by: Optional[str]
    performed_at: datetime

    class Config:
        orm_mode = True

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    target_id: Optional[str] = Query(None, description="Filter by Target ID (e.g. Indicator ID)"),
    action: Optional[str] = Query(None, description="Filter by Action type"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get system audit logs.
    Currently returns all logs, but can be enhanced to filter by user ownership 
    if we associate logs with user_id in the future.
    """
    query = db.query(models.AuditLog)
    
    if target_id:
        query = query.filter(models.AuditLog.target_id == target_id)
    
    if action:
        query = query.filter(models.AuditLog.action == action)
        
    return query.order_by(models.AuditLog.performed_at.desc()).limit(limit).all()
