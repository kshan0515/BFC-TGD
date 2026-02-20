import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '부천FC 1995 통합검색단 (BFC-TGD)',
  description: '부천FC 1995 소셜 미디어 통합검색단 (부천FC 통검단, BFC-TGD)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '부천FC 통검단',
  },
};

export const viewport: Viewport = {
  themeColor: '#DA291C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // 노치 및 폴더블 화면 대응
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased bg-zinc-50 dark:bg-zinc-950">
        {children}
      </body>
    </html>
  );
}
