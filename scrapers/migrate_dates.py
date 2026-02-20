import os
from pymongo import MongoClient
import datetime

MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'bfc-tgd'

def migrate():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db['contents']
    
    cursor = collection.find({"published_at": {"$type": "string"}})
    count = 0
    
    for doc in cursor:
        try:
            # ISO 형식 문자열을 datetime 객체로 변환
            date_str = doc['published_at'].replace("Z", "+00:00")
            dt_obj = datetime.datetime.fromisoformat(date_str)
            
            collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"published_at": dt_obj}}
            )
            count += 1
        except Exception as e:
            print(f"❌ Error converting {doc['_id']}: {e}")
            
    print(f"✅ Successfully migrated {count} documents to Date objects.")

if __name__ == "__main__":
    migrate()
