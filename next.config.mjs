import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // 개발 환경에서는 PWA 비활성화 (Turbopack 호환)
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {}, // Next.js 16 Turbopack 경고 제거
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' }, // 모든 인스타 CDN 서브도메인 허용
      { protocol: 'https', hostname: '**.fbcdn.net' }, // 페이스북 기반 CDN 허용
      { protocol: 'https', hostname: 'i.ytimg.com' }, // 유튜브 썸네일
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default withSerwist(nextConfig);
