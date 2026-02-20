'use server'; // 서버 함수로 정의하여 클라이언트에서 호출 가능케 함

import clientPromise from './mongodb';

export interface FeedItem {
  id: string;
  platform: 'INSTA' | 'YOUTUBE';
  type: string;
  external_id: string;
  title?: string;
  caption?: string;
  media_uri: string;
  origin_url: string;
  published_at: string | Date;
  username: string;
}

export interface FeedResponse {
  items: FeedItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * MongoDB Atlas에서 직접 피드 데이터를 조회하는 서버 함수
 */
export async function getFeed(page = 1, limit = 20, platform?: string): Promise<FeedResponse> {
  // 환경 변수 로드 확인용 (값의 일부만 출력하여 보안 유지)
  const uriExists = !!process.env.MONGO_URI;
  console.log(`📡 DB 연동 시도: URI 존재 여부(${uriExists}), 플랫폼(${platform || '전체'})`);

  try {
    const client = await clientPromise;
    const db = client.db('bfc-tgd');
    const collection = db.collection('contents');

    // 필터 설정
    const query: any = {};
    if (platform) {
      query.platform = platform;
    }

    // 데이터 조회 및 정렬 (최신순)
    const [items, total] = await Promise.all([
      collection
        .find(query)
        .sort({ published_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // MongoDB Document를 FeedItem 타입으로 변환
    const formattedItems = items.map((doc: any) => ({
      id: doc._id.toString(),
      platform: doc.platform,
      type: doc.type,
      external_id: doc.external_id,
      title: doc.title,
      caption: doc.caption,
      media_uri: doc.media_uri,
      origin_url: doc.origin_url,
      published_at: doc.published_at,
      username: doc.username,
    }));

    return {
      items: formattedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    // 서버 측 콘솔에 상세 에러 출력 (Next.js 서버 터미널에서 확인 가능)
    console.error('❌ MongoDB 상세 에러:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    throw new Error(`DB 조회 실패: ${error.message}`);
  }
}
