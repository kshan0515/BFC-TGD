/**
 * BFC-TGD (DB Maintenance)
 * MongoDB에 저장된 블랙리스트 채널 영상 데이터를 일괄 삭제합니다.
 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// .env.local 직접 파싱 (환경 변수 로드)
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

async function runCleanup() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ Error: MONGO_URI not found in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('bfc-tgd');
    const collection = database.collection('contents');

    // 🚫 블랙리스트 채널명 (정규식 부분 일치 검색)
    const blacklistedPattern = /안지환2015|부천유나이티드|태산축구|신용산축구부/;

    console.log(`🧹 DB 정리 시작: 블랙리스트 채널 데이터를 삭제합니다...`);

    const result = await collection.deleteMany({
      username: {
        $regex: blacklistedPattern,
        $options: 'i'
      }
    });

    if (result.deletedCount > 0) {
      console.log(`✅ 정리 완료! 총 ${result.deletedCount}개의 블랙리스트 채널 영상이 삭제되었습니다.`);
    } else {
      console.log(`✨ 삭제할 데이터가 없습니다. DB가 깨끗합니다.`);
    }

  } catch (error) {
    console.error("❌ Critical Error during cleanup:", error.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

runCleanup();
