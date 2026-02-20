"""
BFC-TGD (Bucheon FC 1995 Integrated Search Agent)
Copyright (c) 2026 kshan0515. Licensed under the MIT License.
Created with ❤️ for Bucheon FC 1995 Fans.
"""
import os
import datetime
import base64
from itertools import takewhile
from apify_client import ApifyClient
from instaloader import Instaloader, Hashtag, Post
from pymongo import MongoClient, UpdateOne

# 환경 변수 로드
MONGO_URI = os.getenv('MONGO_URI')
APIFY_TOKEN = os.getenv('APIFY_TOKEN')
INSTA_USER = os.getenv('INSTA_USER') # 인스타그램 아이디 (필수)
INSTA_SESSION_64 = os.getenv('INSTA_SESSION_64') # 최고급 세션 텍스트 (Base64)
DB_NAME = 'bfc-tgd'

def load_session_from_env(L, username):
    """GitHub Secrets에서 Base64 세션을 읽어 파일로 복구 및 로드"""
    if not INSTA_SESSION_64:
        print("⚠️ Skip Session Load: INSTA_SESSION_64 is not set.")
        return False

    try:
        # 1. 임시 경로에 세션 파일 복구
        session_path = f"/tmp/session-{username}"
        with open(session_path, "wb") as f:
            f.write(base64.b64decode(INSTA_SESSION_64))
        
        # 2. 세션 로드 (로그인 대체)
        L.load_session_from_file(username, filename=session_path)
        print(f"✅ [Session] Successfully restored session for {username}")
        return True
    except Exception as e:
        print(f"❌ [Session] Failed to load session: {e}")
        return False

def scrape_via_apify(tags):
    """Apify를 사용하여 안전하게 인스타그램 수집 (비용 최적화 적용)"""
    if not APIFY_TOKEN:
        print("⚠️ Skip Apify: APIFY_TOKEN is not set.")
        return []

    # --- 최근 업데이트 여부 체크 생략 (2시간 주기면 무조건 돌리는 게 안전) ---
    print(f"🚀 [Apify] Starting ultra-optimized scrape for tags: {tags}")
    apify_client = ApifyClient(APIFY_TOKEN)
    
    run_input = {
        "hashtags": tags,
        "resultsLimit": 30, # 2시간 주기 내의 신규물 누락 방지를 위해 30개로 상향
    }
    
    try:
        run = apify_client.actor("apify/instagram-hashtag-scraper").call(run_input=run_input)
        
        # 최근 2시간 이내의 게시물만 수집하도록 시간 기준 설정
        time_threshold = datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        
        collected_data = []
        for item in apify_client.dataset(run["defaultDatasetId"]).iterate_items():
            ts_str = item.get("timestamp")
            if not ts_str: continue
            
            pub_date = datetime.datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            if pub_date.replace(tzinfo=None) < time_threshold:
                continue

            collected_data.append({
                "external_id": item.get("shortCode"),
                "platform": "INSTA",
                "type": "IMAGE" if item.get("type") != "Video" else "VIDEO",
                "title": None,
                "caption": item.get("caption"),
                "media_uri": item.get("displayUrl"),
                "origin_url": item.get("url"),
                "published_at": pub_date, 
                "username": item.get("ownerUsername"),
                "metadata": {
                    "shortcode": item.get("shortCode"),
                    "likes": item.get("likesCount"),
                    "comments": item.get("commentsCount")
                }
            })
        return collected_data
    except Exception as e:
        print(f"📡 Apify API Error: {e}")
        return []

def scrape_via_instaloader(tag_name):
    """Instaloader를 사용한 직접 수집 (세션 복구 로직 포함)"""
    print(f"🚀 [Instaloader] Starting idiomatic scrape for #{tag_name}")
    L = Instaloader()
    
    # 1. 세션 로딩 시도 (아이디/비번 로그인보다 훨씬 안전)
    if INSTA_USER:
        load_session_from_env(L, INSTA_USER)

    # 2. 수집 기준 시간 (2시간 전)
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    
    try:
        hashtag = Hashtag.from_name(L.context, tag_name)
        posts = hashtag.get_posts()
        
        collected_data = []
        # takewhile을 사용하여 2시간 이전 게시물 발견 시 즉시 종료
        for post in takewhile(lambda p: p.date_utc > since, posts):
            collected_data.append({
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
                }
            })
            print(f"📦 Found: {post.shortcode}")
            
        return collected_data
    except Exception as e:
        print(f"❌ Instaloader Error: {e}")
        return []

def save_to_mongo(data):
    if not data:
        print("⚠️ No data to save.")
        return

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db['contents']

    operations = []
    for item in data:
        if not item['external_id']: continue
        
        item['updated_at'] = datetime.datetime.utcnow()
        operations.append(
            UpdateOne(
                {"external_id": item['external_id']},
                {"$set": item},
                upsert=True
            )
        )

    if operations:
        result = collection.bulk_write(operations)
        print(f"✅ Successfully synced {len(data)} items to MongoDB.")
        print(f"📊 Stats - Upserted: {result.upserted_count}, Matched: {result.matched_count}")

def main():
    tags = ['부천FC', '부천FC1995']
    data = []
    
    # 1. 우선 안정적인 Apify로 시도
    data = scrape_via_apify(tags)

    # 2. Apify 실패 시에만 내 계정(Instaloader Session)으로 백업 실행
    if not data:
        print("🔄 [Backup] Apify is unavailable. Switching to Instaloader session mode...")
        for t in tags:
            data.extend(scrape_via_instaloader(t))
            
    # 3. 저장
    if data:
        save_to_mongo(data)
    else:
        print("⚠️ No data collected from any source.")

if __name__ == "__main__":
    main()
