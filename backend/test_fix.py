import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to sys.path to import services
sys.path.append(os.getcwd())

from services.video_service import video_service

load_dotenv()

async def test_crash_course():
    video_id = "26QPDBe-NB8" # Operating Systems: Crash Course Computer Science #18
    print(f"Testing real pipeline for video {video_id}...")
    try:
        transcript = await video_service.get_transcript(video_id)
        print(f"SUCCESS! Transcript length: {len(transcript)}")
        print(f"First 200 chars: {transcript[:200]}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_crash_course())
