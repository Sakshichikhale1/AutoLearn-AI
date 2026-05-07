import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# Securely fetch API key from environment
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("Error: GOOGLE_API_KEY not found in environment (.env file)")
else:
    genai.configure(api_key=api_key)

    try:
        print("Listing available models...")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model: {m.name}, Methods: {m.supported_generation_methods}")
    except Exception as e:
        print(f"Error: {e}")
