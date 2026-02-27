import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: {
    default: '부천FC 통합검색단 (BFC-TGD) | 부천 축구동',
    template: '%s | 부천FC 통합검색단'
  },
  description: '부천FC 1995 서포터즈와 팬들을 위한 통합 소셜 미디어 허브. 인스타그램, 유튜브 최신 소식과 2026 시즌 경기 일정을 한곳에서 확인하세요.',
  keywords: ['부천FC', '부천FC1995', 'BFC', '부천축구동', '통합검색단', 'K리그', '축구 커뮤니티', '경기일정'],
  authors: [{ name: 'kshan0515' }],
  creator: 'kshan0515',
  publisher: '부천FC 통합검색단',
  metadataBase: new URL('https://bfc-tgd.vercel.app'), // 실제 도메인으로 변경 필요
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '부천FC 통합검색단 (BFC-TGD)',
    description: '부천FC 1995 팬들을 위한 실시간 소셜 미디어 피드 및 경기 일정 서비스',
    url: 'https://bfc-tgd.vercel.app',
    siteName: '부천FC 통합검색단',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '부천FC 통합검색단 (BFC-TGD)',
    description: '부천FC 1995 팬들을 위한 실시간 소셜 미디어 피드 및 경기 일정 서비스',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '부천 축구동',
  },
};

export const viewport: Viewport = {
  themeColor: '#DA291C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 구조화된 데이터 (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': '부천FC 통합검색단 (BFC-TGD)',
    'alternateName': '부천 축구동',
    'description': '부천FC 1995 팬들을 위한 인스타그램, 유튜브 통합 검색 및 경기 일정 안내 서비스',
    'url': 'https://bfc-tgd.vercel.app',
    'applicationCategory': 'SportsApplication',
    'operatingSystem': 'Web',
    'author': {
      '@type': 'Person',
      'name': 'kshan0515'
    }
  };

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-white dark:bg-black transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
