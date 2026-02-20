'use server';

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
  try {
    const client = await clientPromise;
    const db = client.db('bfc-tgd');
    const collection = db.collection('contents');

    /* [마이그레이션 완료] 이미 데이터 타입 정규화가 완료되었으므로 성능을 위해 비활성화합니다.
    const stringDates = await collection.find({ published_at: { $type: "string" } }).limit(50).toArray();
    if (stringDates.length > 0) {
      console.log(`🧹 정렬 최적화 중: ${stringDates.length}개의 데이터 타입 변환...`);
      for (const doc of stringDates) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { published_at: new Date(doc.published_at) } }
        );
      }
    }
    */

    // 쿼리 필터 설정
    const query: any = {};
    if (platform) {
      query.platform = platform;
    }

    // 데이터 조회 및 정렬 (Date 객체 기반으로 플랫폼 통합 최신순 정렬)
    const [items, total] = await Promise.all([
      collection
        .find(query)
        .sort({ published_at: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query)
    ]);

    // MongoDB Document를 프론트엔드용 FeedItem 타입으로 변환
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
    console.error('❌ MongoDB 상세 에러:', error.message);
    throw new Error(`DB 조회 실패: ${error.message}`);
  }
}
