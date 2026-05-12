import asyncio
import logging
from youtube_transcript_api import YouTubeTranscriptApi

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_transcript():
    video_id = "26QPDBe-NB8"
    print(f"Testing transcript for {video_id}...")
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        print("Found transcripts!")
        for t in transcript_list:
            print(f"- {t.language} ({t.language_code}) [Generated: {t.is_generated}]")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_transcript())
