/**
 * BFC-TGD (Bucheon FC 1995 Integrated Search Agent)
 * Copyright (c) 2026 kshan0515. Licensed under the MIT License.
 * Created with ❤️ for Bucheon FC 1995 Fans.
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import FeedGrid from '@/components/feed/FeedGrid';
import { getFeed, FeedItem } from '@/lib/api';
import { ThemeToggle } from '@/components/theme-toggle';

const PLATFORMS = [
  { id: undefined, label: '전체', icon: '⚽' },
  { id: 'INSTA', label: '인스타', icon: '📸' },
  { id: 'YOUTUBE', label: '유튜브', icon: '📺' },
];

export default function Home() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 데이터 로드 로직
  const loadData = useCallback(async (isInitial: boolean, platform?: string) => {
    if (isLoading || (!isInitial && !hasMore)) return;
    
    setIsLoading(true);
    const targetPage = isInitial ? 1 : page;

    try {
      const response = await getFeed(targetPage, 15, platform);
      
      if (isInitial) {
        setItems(response.items);
        setPage(2);
      } else {
        setItems(prev => [...prev, ...response.items]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.meta.page < response.meta.totalPages);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  // 초기 로드 및 플랫폼 변경 감지
  useEffect(() => {
    loadData(true, selectedPlatform);
  }, [selectedPlatform, loadData]);

  const handleLoadMore = () => {
    loadData(false, selectedPlatform);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black pb-20 transition-colors duration-500">
      {/* 고정 헤더 */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <h1 className="text-lg sm:text-xl tracking-normal flex items-center font-black">
              <span className="text-red-600">부천</span>
              <span className="text-zinc-900 dark:text-white mr-2">FC</span>
              <span className="text-red-600">통</span>
              <span className="text-zinc-900 dark:text-white mx-[1px]">합</span>
              <span className="text-red-600">검</span>
              <span className="text-zinc-900 dark:text-white mx-[1px]">색</span>
              <span className="text-red-600">단</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <ThemeToggle />
             {/* 플랫폼 필터 탭 */}
             <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-transparent dark:border-zinc-800">
              {PLATFORMS.map((p) => (
                <button
                  key={String(p.id)}
                  onClick={() => setSelectedPlatform(p.id as string)}
                  className={`relative px-3 py-1.5 text-[11px] font-bold transition-all z-10 ${
                    selectedPlatform === p.id 
                      ? 'text-white' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {selectedPlatform === p.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-red-600 rounded-lg -z-10 shadow-lg shadow-red-600/40"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="hidden sm:inline">{p.icon}</span>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 피드 그리드 */}
      <FeedGrid items={items} isLoading={isLoading} onLoadMore={handleLoadMore} />
      
      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-6 h-16 flex items-center justify-around md:hidden">
        <button className="text-red-600 font-bold text-[10px] flex flex-col items-center gap-1">
          <span className="text-lg">🏠</span>
          <span>홈</span>
        </button>
        <button className="text-zinc-400 font-bold text-[10px] flex flex-col items-center gap-1">
          <span className="text-lg">⚽</span>
          <span>경기</span>
        </button>
        <button className="text-zinc-400 font-bold text-[10px] flex flex-col items-center gap-1">
          <span className="text-lg">📰</span>
          <span>뉴스</span>
        </button>
      </nav>
    </main>
  );
}
