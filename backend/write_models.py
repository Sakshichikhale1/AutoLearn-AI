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

    with open("models_list.txt", "w") as f:
        print("Fetching and writing models to models_list.txt...")
        for m in genai.list_models():
            f.write(f"{m.name}\n")
    print("Done!")
