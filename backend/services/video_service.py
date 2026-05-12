import os
import re
import asyncio
import logging
import tempfile
import shutil
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from groq import Groq

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoService:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.groq_api_key) if self.groq_api_key else None

    async def get_transcript(self, video_id: str) -> str:
        """
        Multi-stage transcript extraction:
        1. Official YouTube Transcript API (Manual/Auto-generated)
        2. yt-dlp Metadata/Subtitles
        3. yt-dlp Audio download + Whisper transcription (Fallback)
        """
        # Stage 1: Official API
        logger.info(f"Stage 1: Attempting official YouTubeTranscriptApi for {video_id}")
        try:
            transcript_list = await asyncio.to_thread(YouTubeTranscriptApi.list_transcripts, video_id)
            
            # Try manual English
            try:
                transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
                logger.info("Found manual English transcript")
            except:
                # Try auto-generated English
                try:
                    transcript = transcript_list.find_generated_transcript(['en', 'en-US', 'en-GB'])
                    logger.info("Found auto-generated English transcript")
                except:
                    # Try translating any available transcript to English
                    try:
                        transcript = transcript_list.find_transcript(transcript_list._manually_created_transcripts.keys()).translate('en')
                        logger.info("Translated manual transcript to English")
                    except:
                        # Final attempt: translate first available
                        transcript = list(transcript_list)[0].translate('en')
                        logger.info("Translated first available transcript to English")
            
            data = await asyncio.to_thread(transcript.fetch)
            return " ".join([t['text'] for t in data])
        except Exception as e:
            logger.warning(f"Official API failed for {video_id}: {str(e)}")

        # Stage 2: yt-dlp metadata/subtitles (sometimes bypasses restrictions)
        logger.info(f"Stage 2: Attempting yt-dlp subtitle extraction for {video_id}")
        # Note: In a real prod env, we'd pass cookies here to avoid bot detection
        # For now, we use a robust set of options
        ydl_opts = {
            'skip_download': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'quiet': True,
            'no_warnings': True,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = await asyncio.to_thread(ydl.extract_info, f"https://www.youtube.com/watch?v={video_id}", download=False)
                # If we got here and didn't crash, we might have metadata or subtitles
                # However, yt-dlp subtitle extraction to string is complex. 
                # Proceeding to Stage 3 if Stage 1 failed and Stage 2 didn't yield a direct string.
        except Exception as e:
            logger.warning(f"yt-dlp metadata extraction failed: {str(e)}")

        # Stage 3: Audio Download + Whisper (The Heavy Hitter)
        if not self.client:
            raise Exception("GROQ_API_KEY not configured for audio fallback.")

        logger.info(f"Stage 3: Attempting Audio + Whisper fallback for {video_id}")
        temp_dir = tempfile.mkdtemp()
        audio_path = os.path.join(temp_dir, "audio.m4a")
        
        ydl_opts = {
            'format': 'm4a/bestaudio/best',
            'outtmpl': audio_path,
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            'socket_timeout': 30,
            'retries': 3,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                await asyncio.to_thread(ydl.download, [f"https://www.youtube.com/watch?v={video_id}"])
                
            files = os.listdir(temp_dir)
            if not files:
                raise Exception("No audio file downloaded.")
                
            actual_audio_path = os.path.join(temp_dir, files[0])
            
            if os.path.getsize(actual_audio_path) > 25 * 1024 * 1024:
                raise Exception("Audio too large (>25MB). Use a shorter video.")
                
            with open(actual_audio_path, "rb") as f:
                transcript = await asyncio.to_thread(
                    self.client.audio.transcriptions.create,
                    file=(files[0], f.read()),
                    model="whisper-large-v3",
                    response_format="text"
                )
            return transcript
        except Exception as e:
            logger.error(f"Stage 3 failed: {str(e)}")
            raise Exception(f"Transcript unavailable for this video. (Bot protection or no captions found)")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def chunk_transcript(self, text: str, max_chars: int = 15000) -> list[str]:
        """Split long transcripts into chunks for the LLM"""
        if not text: return []
        if len(text) <= max_chars: return [text]
        
        chunks = []
        words = text.split()
        current_chunk = []
        current_len = 0
        
        for word in words:
            if current_len + len(word) + 1 > max_chars:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_len = len(word)
            else:
                current_chunk.append(word)
                current_len += len(word) + 1
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

    async def summarize_transcript(self, transcript: str) -> dict:
        """Generate AI summary using Groq"""
        if not transcript or len(transcript.strip()) < 50:
            return {
                "summary": "Video is too short or has no speech to summarize.",
                "key_points": ["No content found."]
            }

        # Chunk if needed (though 30k chars usually fits in Groq context)
        # We'll use the first 25k chars for now to be safe
        safe_transcript = transcript[:25000]

        prompt = f"""Summarize this YouTube transcript. 
        Focus on educational value. Output in English.
        
        Return STRICT JSON only:
        {{
          "summary": "Detailed 2-3 paragraph summary",
          "key_points": ["point 1", "point 2", "..."]
        }}
        
        Transcript:
        {safe_transcript}"""

        try:
            resp = await asyncio.to_thread(
                self.client.chat.completions.create,
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are an elite academic assistant. Output strict JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            import json
            content = resp.choices[0].message.content
            # Handle potential markdown wrappers
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(content)
        except Exception as e:
            logger.error(f"Summarization error: {e}")
            return {
                "summary": f"Failed to generate summary: {str(e)}",
                "key_points": []
            }

video_service = VideoService()
