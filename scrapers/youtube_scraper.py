import os
import datetime
from googleapiclient.discovery import build
from pymongo import MongoClient, UpdateOne

# 환경 변수 로드 (GitHub Secrets 또는 Local .env)
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'bfc-tgd'

def scrape_youtube(keyword='부천FC'):
    if not YOUTUBE_API_KEY or not MONGO_URI:
        print("❌ Error: YOUTUBE_API_KEY or MONGO_URI environment variable is not set.")
        return

    print(f"🚀 Starting YouTube scrape for keyword: {keyword}")

    try:
        # 1. 유튜브 API 클라이언트 초기화
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        # 2. 영상 검색 (최신순 10개)
        request = youtube.search().list(
            part="snippet",
            q=keyword,
            maxResults=10,
            type="video",
            order="date"
        )
        response = request.execute()

        # 3. MongoDB Atlas 연결
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db['contents']

        operations = []
        for item in response.get('items', []):
            video_id = item['id']['videoId']
            snippet = item['snippet']
            
            # 프론트엔드와 호환되는 데이터 구조 (snake_case)
            content_doc = {
                "external_id": video_id,
                "platform": "YOUTUBE",
                "type": "VIDEO",
                "title": snippet['title'],
                "caption": snippet['description'],
                "media_uri": snippet['thumbnails']['high']['url'],
                "origin_url": f"https://www.youtube.com/watch?v={video_id}",
                "published_at": snippet['publishedAt'],
                "username": snippet['channelTitle'],
                "metadata": {
                    "channel_id": snippet['channelId'],
                    "videoId": video_id
                },
                "updated_at": datetime.datetime.utcnow()
            }

            # external_id 기준으로 중복 체크 및 업데이트 (UPSERT)
            operations.append(
                UpdateOne(
                    {"external_id": video_id},
                    {"$set": content_doc},
                    upsert=True
                )
            )

        # 4. 일괄 실행 (Bulk Write)
        if operations:
            result = collection.bulk_write(operations)
            print(f"✅ Success! Scraped {len(operations)} videos.")
            print(f"📊 Stats - Upserted: {result.upserted_count}, Matched: {result.matched_count}")
        else:
            print("⚠️ No videos found.")

    except Exception as e:
        print(f"❌ Critical Error: {str(e)}")

if __name__ == "__main__":
    scrape_youtube()
