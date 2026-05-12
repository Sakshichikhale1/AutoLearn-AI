import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'https://autolearnai-backend.onrender.com/mindmap/generate',
    data=b'{"content": "This is a test of the mindmap generation API. Please generate a simple mindmap."}',
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS")
    print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"Other Error: {e}")
