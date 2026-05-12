import os
from dotenv import load_dotenv
import groq

load_dotenv()
client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": "Test"}],
    )
    print("SUCCESS")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")
