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
    """Apify를 사용하여 안전하게 인스타그램 수집 (권장)"""
    if not APIFY_TOKEN:
        print("⚠️ Skip Apify: APIFY_TOKEN is not set.")
        return []

    print(f"🚀 [Apify] Starting scrape for tags: {tags}")
    client = ApifyClient(APIFY_TOKEN)
    
    # Apify 인스타그램 해시태그 스크래퍼 실행
    run_input = {
        "hashtags": tags,
        "resultsLimit": 50, # 2시간 주기 내의 데이터를 충분히 확보하기 위해 50개로 상향
    }
    
    run = client.actor("apify/instagram-hashtag-scraper").call(run_input=run_input)
    
    collected_data = []
    for item in client.dataset(run["defaultDatasetId"]).iterate_items():
        # 데이터 정규화
        collected_data.append({
            "external_id": item.get("shortCode"),
            "platform": "INSTA",
            "type": "IMAGE" if item.get("type") != "Video" else "VIDEO",
            "title": None,
            "caption": item.get("caption"),
            "media_uri": item.get("displayUrl"),
            "origin_url": item.get("url"),
            "published_at": item.get("timestamp"),
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

if __name__ == "__main__":
    tags = ['부천FC', '부천FC1995']
    
    # 1. 우선 Apify로 시도
    data = scrape_via_apify(tags)
    
    # 2. Apify 토큰이 없거나 결과가 없을 경우 (옵션) 직접 수집 시도
    if not data and INSTA_USER:
        print("🔄 Falling back to direct Instaloader scrape...")
        for t in tags:
            data.extend(scrape_via_instaloader(t))
            
    # 3. 저장
    save_to_mongo(data)
