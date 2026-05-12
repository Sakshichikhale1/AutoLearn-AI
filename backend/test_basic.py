from youtube_transcript_api import YouTubeTranscriptApi

video_id = "26QPDBe-NB8"
try:
    # Try the most basic call
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    print(f"Success! First 100 chars: {str(transcript)[:100]}")
except Exception as e:
    print(f"Failed: {e}")
