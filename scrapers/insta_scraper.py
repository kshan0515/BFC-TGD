"""
BFC-TGD (Bucheon Football Village - 부천 축구동)
Copyright (c) 2026 kshan0515. Licensed under the MIT License.
Created with ❤️ for Bucheon FC 1995 Fans.
"""
import os
import datetime
from apify_client import ApifyClient
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

# .env.local 또는 .env 파일 로드 (로컬 개발용)
env_paths = [".env.local", ".env", "../.env.local", "../.env"]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

# 환경 변수 로드
MONGO_URI = os.getenv('MONGO_URI')
APIFY_TOKEN = os.getenv('APIFY_TOKEN')
DB_NAME = 'bfc-tgd'

def scrape_via_apify(tags):
    """Apify를 사용하여 안전하게 인스타그램 수집 (최종 최적화 버전)"""
    if not APIFY_TOKEN:
        print("❌ Error: APIFY_TOKEN is not set.")
        return None

    print(f"🚀 [Apify] Starting scrape for tags: {tags}")
    apify_client = ApifyClient(APIFY_TOKEN)
    
    run_input = {
        "hashtags": tags,
        "resultsLimit": 20,
    }
    
    try:
        run = apify_client.actor("apify/instagram-hashtag-scraper").call(
            run_input=run_input,
            timeout_secs=180, # 3분 타임아웃 방어막
            memory_mbytes=256 # 비용 절감 메모리 설정
        )
        
        collected_data = []
        for item in apify_client.dataset(run["defaultDatasetId"]).iterate_items():
            # 대소문자 구분 없이 필드 추출 (방어 코드)
            short_code = item.get("shortCode") or item.get("shortcode")
            display_url = item.get("displayUrl") or item.get("display_url")
            timestamp = item.get("timestamp") or item.get("taken_at_timestamp")
            
            if not short_code or not timestamp: continue
            
            # 타임스탬프 처리
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
        operations.append(UpdateOne({"external_id": item['external_id']}, {"$set": item}, upsert=True))

    if operations:
        result = collection.bulk_write(operations)
        print(f"✅ Successfully synced {len(data)} items to MongoDB. (Upserted: {result.upserted_count})")

def main():
    tags = ['부천FC']
    
    # 오직 Apify로만 정정당당하게(?) 수집 시도
    data = scrape_via_apify(tags)

    if data:
        save_to_mongo(data)
    elif data == []:
        print("✅ Apify run successful, but returned 0 items.")
    else:
        print("⚠️ Scraping failed. No data to save.")

if __name__ == "__main__":
    main()
