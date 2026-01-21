
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.models import BotProfile, BotRule, User
from app.core import get_current_user

# Setup In-Memory DB for Testing
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def override_get_current_user():
    return {"user_id": 1, "username": "testuser"}

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create Test User
    user = User(username="testuser", password_hash="hash")
    db.add(user)
    db.commit()
    
    yield db
    
    Base.metadata.drop_all(bind=engine)
    db.close()

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest.mark.asyncio
async def test_create_and_update_rules(db_session, async_client):
    # 1. Create Bot
    response = await async_client.post(
        "/api/v1/bots/",
        json={
            "name": "RSI Bot",
            "personality": "balanced"
        },
        headers={"X-User-ID": "1"} # Mock Auth
    )
    assert response.status_code == 201
    bot_id = response.json()["id"]
    
    # 2. Add Rules (Valid)
    rules_payload = {
        "rules": [
            {
                "rule_order": 1,
                "indicator": "RSI",
                "operator": "less_than",
                "value": 30,
                "action": "Buy",
                "is_enabled": True
            }
        ],
        "confirm_empty": False
    }
    
    response = await async_client.put(f"/api/v1/bots/{bot_id}/rules", json=rules_payload, headers={"X-User-ID": "1"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["rules"]) == 1
    assert data["rules"][0]["indicator"] == "RSI"

@pytest.mark.asyncio
async def test_safety_lock(db_session, async_client):
    # Get Bot ID (assuming 1 from previous test, but safer to create new or query)
    bot_id = 1 
    
    # Start Bot
    await async_client.post(f"/api/v1/bots/{bot_id}/start", headers={"X-User-ID": "1"})
    
    # Try Update Rules
    rules_payload = {
        "rules": [],
        "confirm_empty": True
    }
    response = await async_client.put(f"/api/v1/bots/{bot_id}/rules", json=rules_payload, headers={"X-User-ID": "1"})
    assert response.status_code == 400
    assert "Bot is currently running" in response.json()["detail"]
    
    # Stop Bot to cleanup
    await async_client.post(f"/api/v1/bots/{bot_id}/stop", headers={"X-User-ID": "1"})

@pytest.mark.asyncio
async def test_empty_rules_protection(db_session, async_client):
    bot_id = 1
    
    # Empty without confirm
    response = await async_client.put(f"/api/v1/bots/{bot_id}/rules", json={"rules": []}, headers={"X-User-ID": "1"})
    assert response.status_code == 400
    assert "confirm_empty=True" in response.json()["detail"]
    
    # Empty WITH confirm
    response = await async_client.put(f"/api/v1/bots/{bot_id}/rules", json={"rules": [], "confirm_empty": True}, headers={"X-User-ID": "1"})
    assert response.status_code == 200
    assert len(response.json()["rules"]) == 0

@pytest.mark.asyncio
async def test_simulation_deterministic(db_session, async_client):
    bot_id = 1
    
    # Add rules back
    rules_payload = {
        "rules": [
            {"rule_order": 1, "indicator": "RSI", "operator": "less_than", "value": 50, "action": "Buy", "is_enabled": True},
            {"rule_order": 2, "indicator": "RSI", "operator": "greater_than", "value": 60, "action": "Close Position", "is_enabled": True}
        ]
    }
    await async_client.put(f"/api/v1/bots/{bot_id}/rules", json=rules_payload, headers={"X-User-ID": "1"})
    
    # Run Sim 1
    sim_req = {"duration_days": 10, "initial_balance": 10000}
    res1 = await async_client.post(f"/api/v1/bots/{bot_id}/simulation", json=sim_req, headers={"X-User-ID": "1"})
    
    # Run Sim 2 (Same request)
    res2 = await async_client.post(f"/api/v1/bots/{bot_id}/simulation", json=sim_req, headers={"X-User-ID": "1"})
    
    assert res1.json()["net_profit"] == res2.json()["net_profit"]
    assert res1.json()["total_trades"] == res2.json()["total_trades"]
    assert res1.json()["metadata"]["seed"] == res2.json()["metadata"]["seed"]

@pytest.mark.asyncio
async def test_terminal_action_validation(db_session, async_client):
    bot_id = 1
    # Invalid rules (No terminal action)
    rules_payload = {
        "rules": [
            {"rule_order": 1, "indicator": "RSI", "operator": "less_than", "value": 30, "action": "Wait", "is_enabled": True}
        ]
    }
    response = await async_client.put(f"/api/v1/bots/{bot_id}/rules", json=rules_payload, headers={"X-User-ID": "1"})
    assert response.status_code == 400
    assert "terminal action" in response.json()["detail"]
