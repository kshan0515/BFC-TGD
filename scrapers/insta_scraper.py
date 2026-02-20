"""
BFC-TGD (Bucheon FC 1995 Integrated Search Agent)
Copyright (c) 2026 kshan0515. Licensed under the MIT License.
Created with ❤️ for Bucheon FC 1995 Fans.
"""
import os
import datetime
from apify_client import ApifyClient
from instaloader import Instaloader, Hashtag
from pymongo import MongoClient, UpdateOne

# 환경 변수 로드
MONGO_URI = os.getenv('MONGO_URI')
APIFY_TOKEN = os.getenv('APIFY_TOKEN')
INSTA_USER = os.getenv('INSTA_USER') # 옵션: 로그인용 아이디
INSTA_PASS = os.getenv('INSTA_PASS') # 옵션: 로그인용 비밀번호
DB_NAME = 'bfc-tgd'

def scrape_via_apify(tags):
    """Apify를 사용하여 안전하게 인스타그램 수집 (비용 극대화 최적화)"""
    if not APIFY_TOKEN:
        print("⚠️ Skip Apify: APIFY_TOKEN is not set.")
        return []

    # --- 비용 최적화 Pre-check (타이트한 110분 적용) ---
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    last_item = db['contents'].find_one(
        {"platform": "INSTA"},
        sort=[("updated_at", -1)]
    )
    
    if last_item and "updated_at" in last_item:
        time_diff = datetime.datetime.utcnow() - last_item["updated_at"]
        if time_diff < datetime.timedelta(minutes=110):
            print(f"☕ Scraped recently ({time_diff.seconds // 60}m ago). Skipping to save Apify credits.")
            return []
    # -----------------------------------------------

    print(f"🚀 [Apify] Starting ultra-optimized scrape for tags: {tags}")
    apify_client = ApifyClient(APIFY_TOKEN)
    
    run_input = {
        "hashtags": tags,
        "resultsLimit": 30, # 2시간 주기 내의 신규물 누락 방지를 위해 30개로 상향
    }
    
    run = apify_client.actor("apify/instagram-hashtag-scraper").call(run_input=run_input)
    
    # 최근 2시간 이내의 게시물만 수집하도록 시간 기준 설정
    time_threshold = datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    
    collected_data = []
    for item in apify_client.dataset(run["defaultDatasetId"]).iterate_items():
        # 날짜 체크: Apify가 가져온 데이터 중에서도 너무 오래된 것은 제외
        # 타임스탬프 형식 처리 (Z -> +00:00)
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
            "published_at": pub_date, # 문자열 대신 datetime 객체 저장
            "username": item.get("ownerUsername"),
            "metadata": {
                "shortcode": item.get("shortCode"),
                "likes": item.get("likesCount"),
                "comments": item.get("commentsCount")
            }
        })
    return collected_data

def scrape_via_instaloader(tag_name):
    """Instaloader를 사용한 직접 수집 (로그인 옵션 포함)"""
    print(f"🚀 [Instaloader] Starting scrape for #{tag_name}")
    L = Instaloader()
    
    if INSTA_USER and INSTA_PASS:
        try:
            L.login(INSTA_USER, INSTA_PASS)
            print(f"✅ Logged in as {INSTA_USER}")
        except Exception as e:
            print(f"⚠️ Login failed: {e}. Attempting as anonymous...")

    two_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    hashtag = Hashtag.from_name(L.context, tag_name)
    
    collected_data = []
    for post in hashtag.get_posts():
        if post.date_utc < two_hours_ago:
            break
        
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
                "comments": post.comments
            }
        })
    return collected_data

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
    try:
        data = scrape_via_apify(tags)
    except Exception as e:
        print(f"📡 Apify failed (possibly out of credits): {e}")
        data = []

    # 2. Apify 결과가 없거나 실패했을 경우에만 내 계정(Instaloader)으로 백업 실행
    if not data:
        print("🔄 [Backup] Apify is unavailable. Switching to direct Instaloader scrape...")
        if not (INSTA_USER and INSTA_PASS):
            print("❌ Error: INSTA_USER or INSTA_PASS is not set for backup scrape.")
        else:
            for t in tags:
                try:
                    data.extend(scrape_via_instaloader(t))
                except Exception as ex:
                    print(f"❌ Backup scrape failed for #{t}: {ex}")
            
    # 3. 데이터 저장
    if data:
        save_to_mongo(data)
    else:
        print("⚠️ No data collected from any source.")

if __name__ == "__main__":
    main()
