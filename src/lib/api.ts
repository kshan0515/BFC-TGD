export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1995';

export interface FeedItem {
  id: string;
  platform: 'INSTA' | 'YOUTUBE';
  type: string;
  external_id: string; // 수정
  title?: string;
  caption?: string;
  media_uri: string;   // 수정
  origin_url: string;  // 수정
  published_at: string; // 수정
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

export async function getFeed(page = 1, limit = 20, platform?: string): Promise<FeedResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/contents`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (platform) url.searchParams.append('platform', platform);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      mode: 'cors', // CORS 모드 명시
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      throw new Error('Failed to fetch feed');
    }
    return res.json();
  } catch (error) {
    console.error('Fetch error details:', error);
    throw error;
  }
}
