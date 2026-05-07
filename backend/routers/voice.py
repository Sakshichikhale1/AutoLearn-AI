import os
import asyncio
import json
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from dotenv import load_dotenv
from groq import Groq 
load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

router = APIRouter(prefix="/voice", tags=["voice"])

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: str | None = None


@router.post("/tts")
async def tts(req: TTSRequest):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(500, "ELEVENLABS_API_KEY not configured")

    voice_id = req.voice_id or ELEVENLABS_VOICE_ID
    url = ELEVENLABS_URL.format(voice_id=voice_id) + "?output_format=mp3_44100_128"

    payload = {
        "text": req.text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,
            "use_speaker_boost": True,
        },
    }
    headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}

    async def stream():
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as r:
                if r.status_code != 200:
                    body = await r.aread()
                    raise HTTPException(r.status_code, f"ElevenLabs: {body.decode()[:300]}")
                async for chunk in r.aiter_bytes():
                    yield chunk

    return StreamingResponse(stream(), media_type="audio/mpeg")


from fastapi import UploadFile, File
import io

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        file_content = await file.read()
        
        def call_groq_whisper():
            return groq_client.audio.transcriptions.create(
                file=(file.filename, file_content),
                model="whisper-large-v3",
                response_format="text",
            )
        
        transcript = await asyncio.to_thread(call_groq_whisper)
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(500, f"Transcription failed: {str(e)}")


class PodcastRequest(BaseModel):
    content: str

@router.post("/podcast/script")
async def generate_podcast_script(req: PodcastRequest):
    try:
        prompt = f"""Turn the following educational content into a fun, engaging 2-minute podcast script between two hosts, Alex (expert) and Sam (curious learner).
        
        Alex should be knowledgeable but approachable. Sam should ask the kind of questions a student would ask.
        The dialogue should be natural.
        
        CRITICAL: Do NOT include stage directions (like 'Intro music', 'laughs', 'fades out') in the "text" field. The "text" field MUST only contain spoken words.
        {req.content[:8000]}
        
        Return STRICT JSON:
        {{
          "title": "Episode Title",
          "script": [
            {{"speaker": "Alex", "text": "..."}},
            {{"speaker": "Sam", "text": "..."}}
          ]
        }}"""

        def call_groq():
            return groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
        
        resp = await asyncio.to_thread(call_groq)
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        raise HTTPException(500, f"Podcast generation failed: {str(e)}")
