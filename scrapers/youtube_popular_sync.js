/**
 * 조회수 상위 인기 영상을 수집하여 초기 DB를 채웁니다. (Node.js 버전)
 */
const { MongoClient } = require('mongodb');
const https = require('https');
const fs = require('fs');
const path = require('path');

// .env.local 직접 파싱
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split(/\r?\n/);
      lines.forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
    } catch (err) {
      console.error('Error loading .env.local:', err);
    }
  }
}

loadEnv();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'bfc-tgd';

const EXCLUDED_CHANNELS = ['안지환2015', '부천유나이티드'];

function isExcludedChannel(channelTitle) {
  return EXCLUDED_CHANNELS.some(excluded => channelTitle.includes(excluded));
}

function fetchYouTube(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'YouTube API Error'));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`JSON Parse Error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request Timeout'));
    });
  });
}

async function syncPopularVideos() {
  if (!YOUTUBE_API_KEY || !MONGO_URI) {
    console.error("❌ Error: YOUTUBE_API_KEY or MONGO_URI not found in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);

  try {
    const keyword = encodeURIComponent('부천FC');
    const baseUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${keyword}&maxResults=50&type=video&order=viewCount&key=${YOUTUBE_API_KEY}`;
    
    console.log(`🚀 조회수 상위 영상 수집 시작: '부천FC'`);

    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection('contents'); // 수정됨

    let allItems = [];
    let nextPageToken = '';

    for (let i = 0; i < 2; i++) {
      const url = nextPageToken ? `${baseUrl}&pageToken=${nextPageToken}` : baseUrl;
      const response = await fetchYouTube(url);
      
      if (response.items && response.items.length > 0) {
        allItems = allItems.concat(response.items);
        nextPageToken = response.nextPageToken;
        if (!nextPageToken) break;
      } else {
        break;
      }
    }

    console.log(`✅ 총 ${allItems.length}개의 후보 영상을 찾았습니다.`);

    const operations = allItems
      .filter(item => !isExcludedChannel(item.snippet.channelTitle))
      .map(item => {
        const videoId = item.id.videoId;
        const snippet = item.snippet;
        const pubDate = new Date(snippet.publishedAt);

        return {
          updateOne: {
            filter: { external_id: videoId },
            update: {
              $set: {
                external_id: videoId,
                platform: "YOUTUBE",
                type: "VIDEO",
                title: snippet.title,
                caption: snippet.description,
                media_uri: snippet.thumbnails.high.url,
                origin_url: `https://www.youtube.com/watch?v=${videoId}`,
                published_at: pubDate,
                username: snippet.channelTitle,
                metadata: {
                  channel_id: snippet.channelId,
                  videoId: videoId
                },
                updated_at: new Date()
              }
            },
            upsert: true
          }
        };
      });

    if (operations.length > 0) {
      const result = await collection.bulkWrite(operations);
      console.log(`🎊 완료! 상위 영상 ${operations.length}개 중 ${result.upsertedCount}개 신규 추가, ${result.matchedCount}개 업데이트되었습니다.`);
    } else {
      console.log("⚠️ 수집된 영상이 없습니다.");
    }

  } catch (error) {
    console.error("❌ Critical Error:", error.message || error);
    process.exit(1); // 에러 발생 시 강제 종료
  } finally {
    await client.close();
    process.exit(0); // 정상 종료 보장
  }
}

syncPopularVideos();
