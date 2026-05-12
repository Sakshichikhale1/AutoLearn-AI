import os
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def test_youtube():
    try:
        print(f"Testing YouTube API with key: {YOUTUBE_API_KEY[:10]}...")
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
        request = youtube.search().list(
            q="Python Programming",
            part="snippet",
            maxResults=3,
            type="video"
        )
        response = request.execute()
        print("Success! Found videos:")
        for item in response.get("items", []):
            print(f"- {item['snippet']['title']} (ID: {item['id']['videoId']})")
    except Exception as e:
        print(f"YouTube API Error: {e}")

if __name__ == "__main__":
    test_youtube()
