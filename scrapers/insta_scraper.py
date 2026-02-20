import os
import datetime
from instaloader import Instaloader, Hashtag
from pymongo import MongoClient, UpdateOne

# 환경 변수 로드
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'bfc-tgd'

def scrape_instagram(tag_name='부천FC'):
    if not MONGO_URI:
        print("❌ Error: MONGO_URI environment variable is not set.")
        return

    L = Instaloader()
    # 차단 방지를 위한 User-Agent 설정
    L.context.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    # 수집 기준 시간 계산 (최근 2시간 이내)
    now = datetime.datetime.utcnow()
    time_threshold = now - datetime.timedelta(hours=2)
    
    print(f"📸 [v1.0] Starting Instagram scrape for #{tag_name}")
    print(f"📅 Fetching posts published after: {time_threshold} UTC (Last 2 hours)")

    try:
        # 1. 해시태그 객체 로드
        hashtag = Hashtag.from_name(L.context, tag_name)
        
        # 2. MongoDB 연결
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db['contents']

        operations = []
        collected_count = 0
        
        # 3. 포스트 순회 (해시태그 포스트는 기본적으로 최신순)
        for post in hashtag.get_posts():
            # 2시간보다 오래된 게시물이 나오면 즉시 중단
            if post.date_utc < time_threshold:
                print(f"🛑 Reached older posts (Date: {post.date_utc}). Stopping.")
                break
            
            # 데이터 스키마 (프론트엔드 snake_case 호환)
            content_doc = {
                "external_id": post.shortcode,
                "platform": "INSTA",
                "type": "IMAGE" if not post.is_video else "VIDEO",
                "title": None,
                "caption": post.caption,
                "media_uri": post.url,
                "origin_url": f"https://www.instagram.com/p/{post.shortcode}/",
                "published_at": post.date_utc,
                "username": post.owner_username,
                "metadata": {
                    "shortcode": post.shortcode,
                    "likes": post.likes,
                    "comments": post.comments,
                    "is_video": post.is_video
                },
                "updated_at": datetime.datetime.utcnow()
            }

            # shortcode 기준 UPSERT
            operations.append(
                UpdateOne(
                    {"external_id": post.shortcode},
                    {"$set": content_doc},
                    upsert=True
                )
            )
            collected_count += 1
            print(f"✅ Found: {post.shortcode} by {post.owner_username}")

        # 4. 벌크 실행
        if operations:
            result = collection.bulk_write(operations)
            print(f"🎉 Final Success! Processed {collected_count} posts.")
            print(f"📊 Stats - Upserted: {result.upserted_count}, Matched: {result.matched_count}")
        else:
            print("⚠️ No new posts found in the last 2 hours.")

    except Exception as e:
        print(f"❌ Critical Error: {str(e)}")

if __name__ == "__main__":
    # 여러 해시태그 수집 (확장 가능)
    tags = ['부천FC', '부천FC1995']
    for t in tags:
        scrape_instagram(t)
