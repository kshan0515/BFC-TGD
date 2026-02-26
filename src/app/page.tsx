/**
 * Copyright (c) 2026 kshan0515. Licensed under the MIT License.
 * Created with ❤️ for Bucheon FC 1995 Fans.
 */
'use client';

import { useEffect, useState, useCallback, useRef, useTransition } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import FeedGrid from '@/components/feed/FeedGrid';
import MatchSchedule from '@/components/match/MatchSchedule';
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
  const [activeTab, setActiveTab] = useState<'home' | 'match' | 'news'>('home');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // 상태 관리를 위한 Ref들
  const isFetching = useRef(false);
  const activePlatform = useRef<string | undefined>(undefined);

  // 데이터 로드 로직
  const loadData = useCallback(async (isInitial: boolean, platform?: string) => {
    if (activeTab !== 'home') return; // 홈 탭이 아닐 때는 로드하지 않음
    if (isFetching.current) return;
    if (!isInitial && !hasMore) return;

    isFetching.current = true;
    
    if (isInitial) {
      activePlatform.current = platform;
      setItems([]); 
      setIsLoading(true);
      setPage(1);
    }
    
    try {
      const targetPage = isInitial ? 1 : page;
      const response = await getFeed(targetPage, 15, platform);
      
      // 응답 시점의 플랫폼이 현재 선택된 플랫폼과 다르면 무시
      if (isInitial && activePlatform.current !== platform) {
        return;
      }

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
      isFetching.current = false;
      setIsLoading(false);
    }
  }, [page, hasMore, activeTab]);

  // 플랫폼 변경 핸들러
  const handlePlatformChange = (platform: string | undefined) => {
    startTransition(() => {
      setSelectedPlatform(platform);
    });
  };

  // 플랫폼 변경 시 초기화
  useEffect(() => {
    if (activeTab === 'home') {
      loadData(true, selectedPlatform);
    }
  }, [selectedPlatform, activeTab]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadData(false, selectedPlatform);
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black pb-32 transition-colors duration-500">
      {/* 초슬림 고정 헤더 */}
      <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              <h1 className="text-base sm:text-lg tracking-tight flex items-center font-black">
                <span className="text-red-600">부천</span>
                <span className="text-zinc-900 dark:text-white mr-1.5">FC</span>
                <span className="text-zinc-400 dark:text-zinc-500 font-medium text-[10px] tracking-tighter hidden xs:inline">통합검색단</span>
              </h1>
            </div>

            {/* PC 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center gap-5">
              {[
                { id: 'home', label: '홈' },
                { id: 'match', label: '경기' },
                { id: 'news', label: '뉴스' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-[13px] font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'text-red-600' 
                      : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
             <Link 
              href="/classic" 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-red-600 hover:text-white transition-all font-bold text-[10px]"
             >
               <span>📺</span>
               <span className="hidden sm:inline">1995s</span>
             </Link>
             <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 탭 컨텐츠 영역 */}
      <div className="relative z-10">
        {activeTab === 'home' ? (
          <div className={isPending ? 'opacity-50 transition-opacity' : 'opacity-100'}>
            <FeedGrid items={items} isLoading={isLoading} onLoadMore={handleLoadMore} />
          </div>
        ) : activeTab === 'match' ? (
          <MatchSchedule />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-zinc-400 font-bold italic">준비 중인 기능입니다 ⚽</p>
          </div>
        )}
      </div>

      {/* 플로팅 플랫폼 필터 (홈 탭에서만 표시) */}
      {activeTab === 'home' && (
        <div className="fixed bottom-20 sm:bottom-8 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
          <div className="pointer-events-auto bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-2xl shadow-black/50 flex gap-1 max-w-sm w-full sm:w-auto">
            {PLATFORMS.map((p) => (
              <button
                key={String(p.id)}
                onClick={() => handlePlatformChange(p.id as string)}
                className={`relative flex-1 sm:flex-none sm:px-6 py-2.5 rounded-xl text-[11px] font-black transition-all ${
                  selectedPlatform === p.id 
                    ? 'text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {selectedPlatform === p.id && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-red-600 rounded-xl -z-10 shadow-lg shadow-red-600/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="flex items-center justify-center gap-2">
                  <span className="text-sm">{p.icon}</span>
                  <span>{p.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 하단 네비게이션 (모바일 전용) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-900 px-6 h-16 flex items-center justify-around md:hidden">
        {[
          { id: 'home', label: '홈', icon: '🏠' },
          { id: 'match', label: '경기', icon: '⚽' },
          { id: 'news', label: '뉴스', icon: '📰' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`${activeTab === tab.id ? 'text-red-600' : 'text-zinc-400'} font-black text-[10px] flex flex-col items-center gap-1 transition-all active:scale-95`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
