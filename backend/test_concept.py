import os
import json
import asyncio
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

async def test_concept_extraction():
    content = "Quantum entanglement is a physical phenomenon that occurs when pairs or groups of particles are generated, interact, or share spatial proximity in ways such that the quantum state of each particle cannot be described independently of the state of the others, even when the particles are separated by a large distance."
    
    prompt = f"""You are an elite academic tutor. Analyze the provided multimodal content to create a comprehensive, premium study suite.
    Return STRICT JSON:
    {{
      "notes": [],
      "quiz": [],
      "flashcards": [],
      "vocabulary": [],
      "main_concept": "The overarching primary topic name for further research"
    }}
    Content: {content}"""

    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an elite academic tutor. Output strict JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        response_format={"type": "json_object"},
    )
    
    data = json.loads(resp.choices[0].message.content)
    print(f"Extracted Concept: {data.get('main_concept')}")

if __name__ == "__main__":
    asyncio.run(test_concept_extraction())
