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
    <main className="min-h-screen bg-white dark:bg-black pb-20 transition-colors duration-500">
      {/* 고정 헤더 */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
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

            {/* PC 네비게이션 메뉴 */}
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => setActiveTab('home')}
                className={`text-sm font-bold transition-colors ${activeTab === 'home' ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
              >
                홈
              </button>
              <button 
                onClick={() => setActiveTab('match')}
                className={`text-sm font-bold transition-colors ${activeTab === 'match' ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
              >
                경기
              </button>
              <button 
                onClick={() => setActiveTab('news')}
                className={`text-sm font-bold transition-colors ${activeTab === 'news' ? 'text-red-600' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
              >
                뉴스
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
             <Link 
              href="/classic" 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all font-bold text-[11px]"
              title="클래식 모드 (1995s)"
             >
               <span className="text-xs">📺</span>
               <span className="hidden sm:inline">클래식 (1995s)</span>
             </Link>
             <ThemeToggle />
             
             {/* 플랫폼 필터 탭 (홈 탭에서만 보임) */}
             {activeTab === 'home' && (
               <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-transparent dark:border-zinc-800">
                {PLATFORMS.map((p) => (
                  <button
                    key={String(p.id)}
                    onClick={() => handlePlatformChange(p.id as string)}
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
             )}
          </div>
        </div>
      </header>

      {/* 탭 컨텐츠 */}
      {activeTab === 'home' ? (
        <div className={isPending ? 'opacity-50 transition-opacity' : 'opacity-100 transition-opacity'}>
          <FeedGrid items={items} isLoading={isLoading} onLoadMore={handleLoadMore} />
        </div>
      ) : activeTab === 'match' ? (
        <MatchSchedule />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-400 font-bold italic">준비 중인 기능입니다 ⚽</p>
        </div>
      )}
      
      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 px-6 h-16 flex items-center justify-around md:hidden">
        <button 
          onClick={() => setActiveTab('home')}
          className={`${activeTab === 'home' ? 'text-red-600' : 'text-zinc-400'} font-bold text-[10px] flex flex-col items-center gap-1`}
        >
          <span className="text-lg">🏠</span>
          <span>홈</span>
        </button>
        <button 
          onClick={() => setActiveTab('match')}
          className={`${activeTab === 'match' ? 'text-red-600' : 'text-zinc-400'} font-bold text-[10px] flex flex-col items-center gap-1`}
        >
          <span className="text-lg">⚽</span>
          <span>경기</span>
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className={`${activeTab === 'news' ? 'text-red-600' : 'text-zinc-400'} font-bold text-[10px] flex flex-col items-center gap-1`}
        >
          <span className="text-lg">📰</span>
          <span>뉴스</span>
        </button>
      </nav>
    </main>
  );
}
