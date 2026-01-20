"""
AI Chat API Router
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core import get_db, get_current_user
from app.models import AISession, AIMessage

router = APIRouter()


class ChatMessage(BaseModel):
    content: str
    context_page: Optional[str] = None  # Which page the user is on


class ChatResponse(BaseModel):
    message: str
    role: str
    tokens_used: int
    model_used: str


class SessionHistory(BaseModel):
    id: int
    context_page: Optional[str]
    started_at: datetime
    message_count: int

    class Config:
        from_attributes = True


class TokenUsage(BaseModel):
    today: int
    this_month: int
    monthly_limit: int
    remaining: int


@router.post("/", response_model=ChatResponse)
async def send_chat_message(
    message: ChatMessage,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send message to AI (Secretary Mode)"""
    # Create or get active session
    active_session = db.query(AISession).filter(
        AISession.ended_at.is_(None)
    ).first()
    
    if not active_session:
        active_session = AISession(
            user_id=1,  # Single-user
            context_page=message.context_page
        )
        db.add(active_session)
        db.commit()
        db.refresh(active_session)
    
    # Save user message
    user_msg = AIMessage(
        session_id=active_session.id,
        role="user",
        content=message.content
    )
    db.add(user_msg)
    
    # Generate AI response
    from app.services.ai_service import ai_service
    
    # Prepare context
    context = {
        "context_page": message.context_page,
        "user_id": current_user.get("id", 1)
    }
    
    try:
        ai_response = await ai_service.generate_response(
            prompt=message.content, 
            context=context
        )
        
        response_content = ai_response["message"]
        tokens_used = ai_response["tokens_used"]
        model_used = ai_response["model_used"]
        role = ai_response["role"]
        
    except Exception as e:
        # Fallback error message (should be handled by ai_service, but just in case)
        response_content = f"Error generating response: {str(e)}"
        tokens_used = 0
        model_used = "error"
        role = "system"
    
    # Save AI response
    ai_msg = AIMessage(
        session_id=active_session.id,
        role=role,
        content=response_content,
        tokens_used=tokens_used,
        model_used=model_used
    )
    db.add(ai_msg)
    
    # Update session token count
    active_session.total_tokens_used += tokens_used
    
    db.commit()
    
    return ChatResponse(
        message=response_content,
        role=role,
        tokens_used=tokens_used,
        model_used=model_used
    )


@router.get("/sessions", response_model=List[SessionHistory])
async def list_chat_sessions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List chat sessions"""
    sessions = db.query(AISession).order_by(AISession.started_at.desc()).limit(limit).all()
    
    results = []
    for s in sessions:
        msg_count = db.query(AIMessage).filter(AIMessage.session_id == s.id).count()
        results.append(SessionHistory(
            id=s.id,
            context_page=s.context_page,
            started_at=s.started_at,
            message_count=msg_count
        ))
    
    return results


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get messages from a session"""
    messages = db.query(AIMessage).filter(
        AIMessage.session_id == session_id
    ).order_by(AIMessage.created_at).all()
    
    return [
        {
            "role": m.role,
            "content": m.content,
            "tokens_used": m.tokens_used,
            "model_used": m.model_used,
            "created_at": m.created_at
        }
        for m in messages
    ]


@router.get("/usage", response_model=TokenUsage)
async def get_token_usage(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get token usage statistics"""
    from app.models import Settings
    
    settings = db.query(Settings).first()
    monthly_limit = settings.monthly_token_limit if settings else 100000
    
    # Calculate usage
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)
    
    today_messages = db.query(AIMessage).filter(
        AIMessage.created_at >= datetime.combine(today, datetime.min.time())
    ).all()
    today_tokens = sum(m.tokens_used or 0 for m in today_messages)
    
    month_messages = db.query(AIMessage).filter(
        AIMessage.created_at >= datetime.combine(month_start, datetime.min.time())
    ).all()
    month_tokens = sum(m.tokens_used or 0 for m in month_messages)
    
    return TokenUsage(
        today=today_tokens,
        this_month=month_tokens,
        monthly_limit=monthly_limit,
        remaining=max(0, monthly_limit - month_tokens)
    )


def _generate_mock_response(user_message: str, context_page: Optional[str]) -> str:
    """Generate mock AI response (placeholder)"""
    context_info = {
        "control_center": "ศูนย์ควบคุม",
        "bot_design": "ห้องแล็บออกแบบบอท",
        "portfolio": "แดชบอร์ดพอร์ต",
        "simulation": "Sandbox ทดลอง",
        "settings": "การตั้งค่าระบบ"
    }
    
    page_name = context_info.get(context_page, "ระบบ")
    
    # Simple mock responses based on keywords
    if "สถานะ" in user_message or "status" in user_message.lower():
        return f"ขณะนี้คุณอยู่ที่หน้า{page_name} ระบบทำงานปกติ ไม่มี Error ที่ต้องระวัง"
    elif "ช่วย" in user_message or "help" in user_message.lower():
        return f"ผมพร้อมช่วยเหลือครับ ที่หน้า{page_name}นี้ คุณสามารถดูข้อมูลและจัดการระบบได้ตามฟังก์ชันที่มี"
    elif "วิเคราะห์" in user_message or "analyze" in user_message.lower():
        return "ผมจะส่งคำขอวิเคราะห์ไปยัง AI ภายนอก รอสักครู่นะครับ..."
    else:
        return f"รับทราบครับ คำถามของคุณเกี่ยวกับ: {user_message[:50]}... ผมจะช่วยตอบในบริบทของหน้า{page_name}"
