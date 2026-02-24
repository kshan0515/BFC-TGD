"""
BFC-TGD (Bucheon FC 1995 Integrated Search Agent)
Copyright (c) 2026 kshan0515. Licensed under the MIT License.
Created with ❤️ for Bucheon FC 1995 Fans.
"""
import os
import datetime
import base64
from apify_client import ApifyClient
from instaloader import Instaloader, Hashtag, Post
from pymongo import MongoClient, UpdateOne

# 환경 변수 로드
MONGO_URI = os.getenv('MONGO_URI')
APIFY_TOKEN = os.getenv('APIFY_TOKEN')
INSTA_USER = os.getenv('INSTA_USER') 
INSTA_SESSION_64 = os.getenv('INSTA_SESSION_64') 
DB_NAME = 'bfc-tgd'

# 인스타그램 차단 방지를 위한 고정 User-Agent
USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"

def load_session_from_env(L, username):
    """GitHub Secrets에서 Base64 세션을 읽어 파일로 복구 및 로드"""
    if not INSTA_SESSION_64:
        print("⚠️ Skip Session Load: INSTA_SESSION_64 is not set.")
        return False

    try:
        session_path = f"/tmp/session-{username}"
        clean_session = INSTA_SESSION_64.strip().replace("\n", "").replace("\r", "")
        with open(session_path, "wb") as f:
            f.write(base64.b64decode(clean_session))
        
        L.load_session_from_file(username, filename=session_path)
        
        try:
            profile = L.test_login()
            if profile:
                print(f"✅ [Diagnostic] Session is VALID. Logged in as: {profile}")
                return True
            else:
                print(f"❌ [Diagnostic] Session is INVALID or EXPIRED.")
                return False
        except Exception as te:
            print(f"❌ [Diagnostic] test_login() failed: {te}")
            return False

    except Exception as e:
        print(f"❌ [Session] Critical failure during restoration: {e}")
        return False

def scrape_via_apify(tags):
    """Apify를 사용하여 안전하게 인스타그램 수집"""
    if not APIFY_TOKEN:
        print("⚠️ Skip Apify: APIFY_TOKEN is not set.")
        return None

    print(f"🚀 [Apify] Starting ultra-optimized scrape for tags: {tags}")
    apify_client = ApifyClient(APIFY_TOKEN)
    
    run_input = {
        "hashtags": tags,
        "resultsLimit": 20, # 비용 절감을 위해 20개로 최적화
    }
    
    try:
        run = apify_client.actor("apify/instagram-hashtag-scraper").call(
            run_input=run_input,
            timeout_secs=180, # 최대 3분만 대기
            memory_mbytes=256 # 최소 메모리 설정
        )
        
        collected_data = []
        for item in apify_client.dataset(run["defaultDatasetId"]).iterate_items():
            short_code = item.get("shortCode") or item.get("shortcode")
            display_url = item.get("displayUrl") or item.get("display_url")
            timestamp = item.get("timestamp") or item.get("taken_at_timestamp")
            
            if not short_code or not timestamp: continue
            
            try:
                if isinstance(timestamp, str):
                    pub_date = datetime.datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                else:
                    pub_date = datetime.datetime.fromtimestamp(timestamp)
            except:
                pub_date = datetime.datetime.utcnow()

            collected_data.append({
                "external_id": short_code,
                "platform": "INSTA",
                "type": "IMAGE" if item.get("type", "").lower() != "video" else "VIDEO",
                "title": None,
                "caption": item.get("caption", ""),
                "media_uri": display_url,
                "origin_url": item.get("url") or f"https://www.instagram.com/p/{short_code}/",
                "published_at": pub_date, 
                "username": item.get("ownerUsername") or item.get("owner_username", "instagram_user"),
                "metadata": {
                    "shortcode": short_code,
                    "likes": item.get("likesCount") or item.get("likes_count", 0),
                    "comments": item.get("commentsCount") or item.get("comments_count", 0)
                }
            })
        
        print(f"📦 [Apify] Parsed {len(collected_data)} items successfully.")
        return collected_data
    except Exception as e:
        print(f"📡 Apify API Error: {e}")
        return None

def scrape_via_instaloader(tag_name):
    """Instaloader를 사용한 직접 수집 (최신순 50개 무조건 수집)"""
    print(f"🚀 [Instaloader] Starting idiomatic scrape for #{tag_name}")
    L = Instaloader(user_agent=USER_AGENT)
    
    if INSTA_USER:
        load_session_from_env(L, INSTA_USER)

    try:
        hashtag = Hashtag.from_name(L.context, tag_name)
        posts = hashtag.get_posts()
        
        collected_data = []
        count = 0
        for post in posts:
            count += 1
            if count > 50: break # 최대 50개까지 확인
            
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
        print(f"❌ Instaloader Error for #{tag_name}: {e}")
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
    tags = ['부천FC']
    data = None
    
    try:
        data = scrape_via_apify(tags)
    except Exception as e:
        print(f"📡 Apify API Exception: {e}")
        data = None

    if data is None:
        print("🔄 [Backup] Apify failed. Switching to Instaloader session mode...")
        backup_data = []
        for t in tags:
            backup_data.extend(scrape_via_instaloader(t))
        data = backup_data
            
    if data:
        save_to_mongo(data)
    elif data == []:
        print("✅ Apify run successful, but returned 0 items (rare for hashtags).")
    else:
        print("⚠️ No data collected and backup also failed.")

if __name__ == "__main__":
    main()
