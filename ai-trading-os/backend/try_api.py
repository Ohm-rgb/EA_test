import requests

try:
    response = requests.get(
        "http://localhost:8000/api/v1/bots",
        headers={"Authorization": "Bearer mock-token"}
    )
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
