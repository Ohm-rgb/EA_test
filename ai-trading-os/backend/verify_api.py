
import asyncio
import httpx
import sys
import json

BASE_URL = "http://localhost:8000/api/v1"

# You might need to adjust this if your backend uses auth tokens
# For now, we assume public or mock auth if implemented
HEADERS = {"Authorization": "Bearer mock-token"}

async def test_endpoint(client, method, endpoint, payload=None, description=""):
    print(f"Testing {description} ({method} {endpoint})...", end=" ")
    try:
        if method == "GET":
            resp = await client.get(endpoint, headers=HEADERS)
        elif method == "POST":
            resp = await client.post(endpoint, json=payload, headers=HEADERS)
        elif method == "PUT":
            resp = await client.put(endpoint, json=payload, headers=HEADERS)
        
        if resp.status_code in [200, 201]:
            print(f"✅ OK ({resp.status_code})")
            return resp.json()
        else:
            print(f"❌ FAILED ({resp.status_code})")
            print(f"Response: {resp.text}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

async def run_verification():
    print("=== Starting API Verification ===")
    
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Test Settings
        print("\n[Settings API]")
        settings = await test_endpoint(client, "GET", "/settings", description="Get Settings")
        
        if settings:
            update_payload = {"news_sensitivity": "hard_lock", "risk_profile": "aggressive"}
            await test_endpoint(client, "PUT", "/settings", payload=update_payload, description="Update Settings")
            
            # Verify update
            settings_new = await test_endpoint(client, "GET", "/settings", description="Verify Settings Update")
            if settings_new and settings_new.get("news_sensitivity") == "hard_lock":
                print("✅ Update Verified")
            else:
                print("❌ Update Verification Failed")

        # 2. Test Portfolio & Trades
        print("\n[Portfolio API]")
        await test_endpoint(client, "GET", "/portfolio/overview", description="Get Portfolio Overview")
        await test_endpoint(client, "GET", "/trades/?limit=5", description="Get Recent Trades")

        # 3. Test Chat (AI)
        print("\n[Chat API]")
        chat_payload = {
            "content": "Hello, what is the current trend?",
            "context_page": "portfolio"
        }
        # Note: accurate AI response depends on backend running AI service. 
        # Faiure here might mean AI service isn't reachable, which is expected if not running local LLM.
        # But API should return 200 with fallback or error message.
        await test_endpoint(client, "POST", "/chat/send", payload=chat_payload, description="Send Chat Message")

    print("\n=== Verification Complete ===")

if __name__ == "__main__":
    try:
        asyncio.run(run_verification())
    except KeyboardInterrupt:
        print("Interrupted")
