import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.video_service import video_service

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/video", tags=["video"])

class SummarizeRequest(BaseModel):
    video_id: str | None = None
    url: str | None = None

def extract_video_id(url: str) -> str | None:
    import re
    if not url:
        return None
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"youtu\.be\/([0-9A-Za-z_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None

@router.post("/summarize")
async def summarize_video(req: SummarizeRequest):
    vid = req.video_id or extract_video_id(req.url or "")
    if not vid:
        raise HTTPException(400, "Provide video_id or valid URL")

    logger.info(f"Summarize requested for video: {vid}")
    
    try:
        # Step 1: Extract transcript using the multi-stage service
        transcript = await video_service.get_transcript(vid)
        
        # Step 2: Generate summary
        data = await video_service.summarize_transcript(transcript)
        
        return {
            "video_id": vid,
            "summary": data.get("summary", ""),
            "key_points": data.get("key_points", []),
        }
    except Exception as e:
        logger.error(f"Video summarization failed: {str(e)}")
        # Raise 400 with a clean message for the UI
        raise HTTPException(status_code=400, detail=str(e))
