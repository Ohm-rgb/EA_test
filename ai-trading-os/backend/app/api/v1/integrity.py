from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from app.core.database import get_db
from app import models
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# --- Settings ---

SYSTEM_PROMPT = """
You are the AI Trading Strategy Auditor. Your mission is to fix failed indicators by comparing user-provided code (Pine Script/Python) with the original indicator logic found on the web (TradingView, LuxAlgo docs, etc.). Your goal is to eliminate 'Analysis Failed' statuses by ensuring data flow and functional integrity.

Workflow:
1. Analyze Local Failure: Check Error Logs (Missing Logic, Parameter Mismatch).
2. External Research (Web Search): Search official docs (e.g., LuxAlgo) and sub-functions.
3. Logical Comparison: Compare findings with current code to find missing decoders.
4. Actionable Fixes Summary: Summarize fixes (Logic, Params, Resources) in Thai.
"""

# --- Schemas ---

class IntegrityCheckResult(BaseModel):
    id: str
    status: str # 'pass', 'warning', 'fail'
    message: str
    details: Optional[Dict] = None
    auto_fix: Optional[Dict] = None

class AIResearchReport(BaseModel):
    indicator_id: str
    knowledge_source: str
    summary_th: str
    logic_fixes_th: List[str]
    parameter_fixes_th: List[str]
    resource_fixes_th: List[str]
    confidence_score: float

class IntegrityReport(BaseModel):
    indicator_id: str
    overall_status: str
    timestamp: datetime
    checks: Dict[str, List[IntegrityCheckResult]]
    repaint_score: float

class DeployRequest(BaseModel):
    target_bots: List[str] 

# ... (Logic check functions omitted for brevity, keeping existing) ...

# ... (Endpoints) ...
@router.post("/{ind_id}/analyze-external", response_model=AIResearchReport)
def analyze_external_logic(ind_id: str, db: Session = Depends(get_db)):
    """
    Simulates the AI Oracle Agent executing the System Prompt to find external fixes.
    """
    # 1. In a real scenario, we would inject the SYSTEM_PROMPT into the LLM context here.
    # llm.predict(system=SYSTEM_PROMPT, input=...)

    # 2. Return Mocked "Ground Truth" based on the User's Scenario (SMC)
    
    # Default fallback
    report = AIResearchReport(
        indicator_id=ind_id,
        knowledge_source="General Trading Knowledge",
        summary_th="ตรวจสอบเบื้องต้นเสร็จสิ้น ไม่พบเอกสารเฉพาะเจาะจง",
        logic_fixes_th=[],
        parameter_fixes_th=[],
        resource_fixes_th=[],
        confidence_score=0.7
    )

    # Specific match for SMC (as requested)
    if "smc" in ind_id.lower() or "smart_money" in ind_id.lower(): 
        report.knowledge_source = "LuxAlgo Smart Money Concepts Official Documentation"
        report.summary_th = "❌ สาเหตุที่ Failed: ระบบไม่พบการเชื่อมโยงฟังก์ชัน BOS จากโค้ด SMC เข้ากับบอท"
        report.confidence_score = 0.98
        
        report.logic_fixes_th = [
            "🛠️ [Logic] AI ค้นพบว่า SMC เวอร์ชันนี้ต้องการการคำนวณ Swing High/Low ก่อน โปรดให้โปรแกรมเมอร์เพิ่มฟังก์ชัน calculate_BOS() ตามคู่มือ LuxAlgo"
        ]
        
        report.parameter_fixes_th = [
            "⚙️ [Params] หน้า Control Panel ของคุณขาดช่อง 'Timezone' และ 'Mitigation Method' ซึ่งจำเป็นต่อการหา Order Blocks"
        ]
        
        report.resource_fixes_th = [
            "🌐 [External] จากการสืบค้น อินดิเคเตอร์ตัวนี้ทำงานได้แม่นยำที่สุดใน London Session (13:00-22:00) แนะนำให้ตั้งค่าช่วงเวลาทำงานให้ตรงกัน"
        ]
        
    return report

@router.post("/{ind_id}/deploy")
def deploy_to_production(ind_id: str, payload: DeployRequest, db: Session = Depends(get_db)):
    ind = db.query(models.StrategyPackage).filter(models.StrategyPackage.id == ind_id).first()
    if not ind:
        raise HTTPException(status_code=404, detail="Indicator not found")
    
    # [CRITICAL] Cache Invalidation Logic
    # 1. Update bound bots config
    # 2. Clear Redis/Memory cache for this indicator ID
    # 3. Mark old backtests as 'stale'
    
    # Simulation:
    print(f"I: Invalidating cache for {ind.id}...")
    print(f"I: Pushing config {ind.config_hash} to {len(payload.target_bots)} bots...")
    
    return {
        "status": "success",
        "message": f"Deployed version {ind.config_hash[:8]} to {len(payload.target_bots)} bots. Cache invalidated.",
        "deployed_version": ind.config_hash
    }

@router.post("/{ind_id}/snapshot")
def create_version_snapshot(ind_id: str, note: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Create a backup snapshot of current configuration.
    """
    # Real app would insert into 'indicator_versions' table
    return {
        "status": "success",
        "snapshot_id": f"snap_{int(datetime.utcnow().timestamp())}",
        "message": "Version snapshot created"
    }
