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

    # 1주일 전 시간 계산 (RFC 3339 형식)
    time_threshold = (datetime.datetime.utcnow() - datetime.timedelta(days=7)).isoformat() + "Z"
    print(f"🚀 Starting YouTube scrape for keyword: {keyword}")
    print(f"📅 Fetching videos published after: {time_threshold} (Last 7 days)")

    try:
        # 1. 유튜브 API 클라이언트 초기화
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        # 2. 영상 검색 (최대 200개 수집을 위한 페이지네이션)
        collected_items = []
        next_page_token = None
        max_total_results = 200
        
        while len(collected_items) < max_total_results:
            request = youtube.search().list(
                part="snippet",
                q=keyword,
                maxResults=min(50, max_total_results - len(collected_items)), # API 제한인 50개씩 요청
                type="video",
                order="date",
                publishedAfter=time_threshold,
                pageToken=next_page_token
            )
            response = request.execute()
            
            items = response.get('items', [])
            if not items:
                break
                
            collected_items.extend(items)
            next_page_token = response.get('nextPageToken')
            
            print(f"📦 Collected {len(collected_items)} / {max_total_results} items...")
            
            if not next_page_token:
                break

        # 3. MongoDB Atlas 연결
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db['contents']

        operations = []
        for item in collected_items:
            video_id = item['id']['videoId']
            snippet = item['snippet']
            
            # 데이터 구조 생성
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

            operations.append(
                UpdateOne(
                    {"external_id": video_id},
                    {"$set": content_doc},
                    upsert=True
                )
            )

        # 4. 벌크 실행
        if operations:
            result = collection.bulk_write(operations)
            print(f"✅ [v2.0] Final Success! Total {len(collected_items)} videos processed.")
            print(f"📊 Stats - Upserted: {result.upserted_count}, Matched: {result.matched_count}")
        else:
            print("⚠️ No videos found in the last week.")

    except Exception as e:
        print(f"❌ Critical Error: {str(e)}")

if __name__ == "__main__":
    scrape_youtube()
