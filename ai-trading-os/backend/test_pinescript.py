"""
Quick test for Pine Script parsing endpoint
"""
import requests
import json

# Simple RSI Strategy
simple_script = """
//@version=5
strategy("RSI Strategy")
rsi = ta.rsi(close, 14)
if rsi < 30
    strategy.entry("Buy", strategy.long)
if rsi > 70
    strategy.close("Buy")
"""

url = "http://localhost:8000/api/v1/chat/parse-pinescript?debug=true"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer mock-token"
}
payload = {"script": simple_script}

print("Testing Pine Script Parse Endpoint...")
print("-" * 50)

try:
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
