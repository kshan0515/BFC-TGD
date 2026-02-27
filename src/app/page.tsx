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
  const [activeTab, setActiveTab] = useState<'home' | 'match'>('home');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // 상태 관리를 위한 Ref들
  const isFetching = useRef(false);
  const activePlatform = useRef<string | undefined>(undefined);

  // 데이터 로드 로직
  const loadData = useCallback(async (isInitial: boolean, platform?: string) => {
    if (activeTab !== 'home') return;
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
    <main className="min-h-screen bg-white dark:bg-black pb-24 transition-colors duration-500">
      {/* 초슬림 고정 헤더 */}
      <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
            <h1 className="text-base sm:text-lg tracking-tight flex items-center font-black">
              <span className="text-red-600">부천</span>
              <span className="text-zinc-900 dark:text-white mr-1.5">FC</span>
              <span className="text-zinc-400 dark:text-zinc-500 font-bold text-[10px] tracking-tighter ml-0.5">통합검색단</span>
            </h1>
          </div>

          <div className="flex items-center gap-1">
             <Link 
              href="/classic" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-95 group"
              title="클래식 모드 (1995s)"
             >
               <span className="text-base leading-none grayscale group-hover:grayscale-0 transition-all">📺</span>
               <span className="text-[10px] font-bold uppercase tracking-tight">1995s</span>
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
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MatchSchedule />
          </div>
        )}
      </div>

      {/* 하단 플로팅 인터페이스 그룹 */}
      <div className="fixed bottom-8 left-0 right-0 z-40 flex items-end justify-center gap-3 px-4 pointer-events-none">
        {/* 1. 플랫폼 필터 (홈 탭에서만 표시) */}
        {activeTab === 'home' && (
          <div className="pointer-events-auto bg-white/80 dark:bg-zinc-900/90 backdrop-blur-2xl p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl flex gap-1 max-w-sm">
            {PLATFORMS.map((p) => (
              <button
                key={String(p.id)}
                onClick={() => handlePlatformChange(p.id as string)}
                className={`relative px-3 pt-2.5 pb-1.5 rounded-xl transition-all flex flex-col items-center gap-1 min-w-[50px] ${
                  selectedPlatform === p.id 
                    ? 'text-white' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {selectedPlatform === p.id && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-red-600 rounded-xl -z-10 shadow-lg shadow-red-600/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="text-base leading-none">{p.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-tighter">{p.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 2. 경기 일정 전환 플로팅 버튼 (FAB) */}
        <button
          onClick={() => {
            setActiveTab(prev => prev === 'home' ? 'match' : 'home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`pointer-events-auto w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-2xl border transition-all active:scale-90 ${
            activeTab === 'match'
              ? 'bg-red-600 border-red-500 text-white shadow-red-600/40'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white shadow-black/20'
          }`}
          title={activeTab === 'home' ? '경기 일정 보기' : '피드로 돌아가기'}
        >
          <span className="text-xl leading-none">{activeTab === 'home' ? '📅' : '🏠'}</span>
          <span className={`text-[9px] font-black ${activeTab === 'match' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {activeTab === 'home' ? '일정' : '홈'}
          </span>
        </button>
      </div>
    </main>
  );
}
