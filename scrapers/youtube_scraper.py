"""
BFC-TGD (Bucheon Football Village - 부천 축구동)
Copyright (c) 2026 kshan0515. Licensed under the MIT License.
Created with ❤️ for Bucheon FC 1995 Fans.
"""
import os
import datetime
from googleapiclient.discovery import build
from pymongo import MongoClient, UpdateOne

# 환경 변수 로드 (GitHub Secrets 또는 Local .env)
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'bfc-tgd'

def scrape_youtube():
    # keywords = ['부천FC', '부천FC1995', 'BFC1995']
    keywords = ['부천FC', '부천FC1995']
    if not YOUTUBE_API_KEY or not MONGO_URI:
        print("❌ Error: YOUTUBE_API_KEY or MONGO_URI environment variable is not set.")
        return

    # 48시간 전 시간 계산 (유튜브 검색 API 인덱싱 지연 대비)
    time_threshold = (datetime.datetime.utcnow() - datetime.timedelta(hours=48)).isoformat() + "Z"
    print(f"🚀 Starting YouTube scrape for keywords: {', '.join(keywords)}")
    print(f"📅 Fetching videos published after: {time_threshold} (Last 48 hours)")

    try:
        # 1. 유튜브 API 클라이언트 초기화
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        all_collected_items = []
        
        for keyword in keywords:
            print(f"🔍 Searching for: {keyword}...")
            collected_for_keyword = []
            next_page_token = None
            max_per_keyword = 50 # 각 키워드별 최대 50개
            
            while len(collected_for_keyword) < max_per_keyword:
                request = youtube.search().list(
                    part="snippet",
                    q=keyword,
                    maxResults=50,
                    type="video",
                    order="date",
                    publishedAfter=time_threshold,
                    pageToken=next_page_token
                )
                response = request.execute()
                
                items = response.get('items', [])
                if not items:
                    break
                    
                collected_for_keyword.extend(items)
                next_page_token = response.get('nextPageToken')
                
                if not next_page_token:
                    break
            
            all_collected_items.extend(collected_for_keyword)
            print(f"✅ Found {len(collected_for_keyword)} items for '{keyword}'")

        # 2. MongoDB Atlas 연결
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db['contents']

        operations = []
        for item in all_collected_items:
            video_id = item['id']['videoId']
            snippet = item['snippet']
            channel_title = snippet.get('channelTitle', '')
            
            # 블랙리스트 채널 필터링 (저장 안함)
            if is_excluded_channel(channel_title):
                print(f"🚫 블랙리스트 채널 영상 건너뜀: {channel_title} - {snippet.get('title')}")
                continue
            
            # 날짜 파싱: ISO 문자열을 datetime 객체로 변환
            pub_date_str = snippet['publishedAt']
            pub_date = datetime.datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))

            content_doc = {
                "external_id": video_id,
                "platform": "YOUTUBE",
                "type": "VIDEO",
                "title": snippet['title'],
                "caption": snippet['description'],
                "media_uri": snippet['thumbnails']['high']['url'],
                "origin_url": f"https://www.youtube.com/watch?v={video_id}",
                "published_at": pub_date, # datetime 객체로 저장
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

        # 3. 벌크 실행
        if operations:
            result = collection.bulk_write(operations)
            print(f"✅ [v2.3] Final Success! Total {len(all_collected_items)} records processed.")
            print(f"📊 Stats - Upserted: {result.upserted_count}, Matched: {result.matched_count}")
        else:
            print("⚠️ No videos found for any keywords in the last week.")

    except Exception as e:
        print(f"❌ Critical Error: {str(e)}")

def is_excluded_channel(channel_title):
    # 제외할 채널명 리스트 (부분 일치 또는 정확한 일치 가능)
    EXCLUDED_CHANNELS = ['안지환2015', '부천유나이티드']
    
    for excluded in EXCLUDED_CHANNELS:
        if excluded in channel_title:
            return True
    return False

if __name__ == "__main__":
    scrape_youtube()
