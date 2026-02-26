"""
BFC-TGD (Bucheon Football Village - 부천 축구동)
조회수 상위 인기 영상을 수집하여 초기 DB를 채웁니다.
"""
import os
import datetime
from googleapiclient.discovery import build
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv('.env.local')

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'bfc-tgd'

def is_excluded_channel(channel_title):
    EXCLUDED_CHANNELS = ['안지환2015', '부천유나이티드']
    for excluded in EXCLUDED_CHANNELS:
        if excluded in channel_title:
            return True
    return False

def sync_popular_videos():
    keyword = '부천FC' # 대표 키워드로 검색
    if not YOUTUBE_API_KEY or not MONGO_URI:
        print("❌ Error: YOUTUBE_API_KEY or MONGO_URI is not set.")
        return

    print(f"🚀 조회수 상위 100개 영상 수집 시작: '{keyword}'")

    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        collected_items = []
        next_page_token = None
        
        # 총 100개를 가져오기 위해 50개씩 2페이지 요청
        for _ in range(2):
            request = youtube.search().list(
                part="snippet",
                q=keyword,
                maxResults=50,
                type="video",
                order="viewCount", # 조회수 높은 순서
                pageToken=next_page_token
            )
            response = request.execute()
            
            items = response.get('items', [])
            if not items:
                break
                
            collected_items.extend(items)
            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break

        print(f"✅ 총 {len(collected_items)}개의 후보 영상을 찾았습니다.")

        # MongoDB 연결
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db['contents']

        operations = []
        for item in collected_items:
            video_id = item['id']['videoId']
            snippet = item['snippet']
            channel_title = snippet.get('channelTitle', '')
            
            # 블랙리스트 필터링
            if is_excluded_channel(channel_title):
                continue

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
                "published_at": pub_date,
                "username": channel_title,
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

        if operations:
            result = collection.bulk_write(operations)
            print(f"🎊 완료! 상위 영상 {len(operations)}개 중 {result.upserted_count}개 신규 추가, {result.matched_count}개 업데이트되었습니다.")
        else:
            print("⚠️ 수집된 영상이 없습니다.")

    except Exception as e:
        print(f"❌ Critical Error: {str(e)}")

if __name__ == "__main__":
    sync_popular_videos()
