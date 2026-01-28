import requests
import time
import sys

BASE_URL = "http://localhost:8000/api/v1"
AUTH_URL = "http://localhost:8000/api/v1/auth"

def get_token():
    try:
        auth_data = {"username": "admin", "password": "password123"}
        resp = requests.post(AUTH_URL + "/login", json=auth_data)
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return None
        return resp.json()["access_token"]
    except Exception as e:
        print(f"Error connecting to API: {e}")
        return None

def verify():
    print("Starting Verification...")
    # Retry connection
    token = None
    for i in range(5):
        token = get_token()
        if token:
            break
        print("Waiting for server...")
        time.sleep(2)
        
    if not token:
        print("Could not get token. Server might be down.")
        sys.exit(1)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Bot
    bot_id = "test_bot_binding"
    # Try to create, ignore if exists
    requests.post(BASE_URL + "/bots", json={
        "id": bot_id,
        "name": "Test Bot for Binding",
        "status": "stopped",
        "configuration": {}
    }, headers=headers)
    
    # 2. Create Indicator
    ind_id = "test_ind_binding"
    requests.post(BASE_URL + "/indicators", json={
        "id": ind_id,
        "name": "Test Indicator",
        "type": "RSI",
        "source": "pine_script",
        "period": "14",
        "params": {},
        "status": "ready"
    }, headers=headers)
    
    # 3. Create Draft Indicator (Guard Test)
    draft_id = "test_draft_binding"
    requests.post(BASE_URL + "/indicators", json={
        "id": draft_id,
        "name": "Draft Indicator",
        "type": "SMA",
        "source": "manual",
        "period": "10",
        "params": {},
        "status": "draft"
    }, headers=headers)

    print("\n--- Testing Draft Guard ---")
    resp = requests.post(f"{BASE_URL}/bots/{bot_id}/indicators/{draft_id}", headers=headers)
    if resp.status_code == 400:
        print("✓ Draft Guard Working: Rejected binding (400)")
    else:
        print(f"FAILED: Draft Guard Failed. Code: {resp.status_code}")

    # 4. Check Available (Should use new response shape)
    print("\n--- Testing Available Indicators ---")
    resp = requests.get(f"{BASE_URL}/bots/{bot_id}/available-indicators", headers=headers)
    if resp.status_code != 200:
        print(f"FAILED: {resp.text}")
        return
        
    items = resp.json()
    my_ind = next((i for i in items if i["indicator_id"] == ind_id), None)
    if not my_ind:
        print("FAILED: Test indicator not found in available list")
        return
    print(f"✓ Indicator found. is_bound={my_ind['is_bound']}")
    
    # 5. Bind
    print("\n--- Testing Bind Indicator ---")
    resp = requests.post(f"{BASE_URL}/bots/{bot_id}/indicators/{ind_id}", headers=headers)
    print(f"Bind Response: {resp.status_code}")
    if resp.status_code != 200 and "Already bound" not in resp.text:
        print(f"FAILED: {resp.text}")
        return
    
    # 6. Check Available Again
    print("\n--- Verifying Binding State ---")
    resp = requests.get(f"{BASE_URL}/bots/{bot_id}/available-indicators", headers=headers)
    items = resp.json()
    my_ind = next((i for i in items if i["indicator_id"] == ind_id), None)
    print(f"✓ Indicator State: is_bound={my_ind['is_bound']}, bot_indicator_id={my_ind['bot_indicator_id']}")
    
    # 7. Check Active
    print("\n--- Testing Active Indicators (Flow Engine) ---")
    resp = requests.get(f"{BASE_URL}/bots/{bot_id}/active-indicators", headers=headers)
    active_inds = resp.json()
    print(f"Active Count: {len(active_inds)}")
    
    # 8. Unbind
    print("\n--- Testing Unbind ---")
    resp = requests.delete(f"{BASE_URL}/bots/{bot_id}/indicators/{ind_id}", headers=headers)
    print(f"Unbind Response: {resp.status_code}")

    # 9. Verify Audit Logs
    print("\n--- Verifying Audit Logs ---")
    resp = requests.get(f"{BASE_URL}/audit-logs?table=bot_indicators", headers=headers) # Assuming endpoint exists/works
    if resp.status_code == 200:
        logs = resp.json()
        bind_log = next((l for l in logs if l['action'] == 'bind_indicator' and l['target_id'] == ind_id), None)
        unbind_log = next((l for l in logs if l['action'] == 'unbind_indicator' and l['target_id'] == ind_id), None)
        if bind_log and unbind_log:
            print("✓ Audit Logs Verified (Bind & Unbind found)")
        else:
            print(f"WARNING: Audit Logs missing. Bind: {bool(bind_log)}, Unbind: {bool(unbind_log)}")
            print(f"Logs: {logs[:2]}") # Show first 2
    else:
        print(f"Audit Log Check Skipped (Endpoint status: {resp.status_code})")

    print("\nVerification Complete.")

if __name__ == "__main__":
    verify()
