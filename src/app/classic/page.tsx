/**
 * Copyright (c) 2026 kshan0515. Licensed under the MIT License.
 * Created with ❤️ for Bucheon FC 1995 Fans.
 */
'use client';

import { getFeed, FeedItem } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ClassicPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedItem, setFocusedItem] = useState<FeedItem | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const router = useRouter();
  
  // 데이터 중복 로드 방지 및 타이머
  const isFetching = useRef(false);
  const touchStart = useRef<number | null>(null);
  const embedTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (pageNum: number) => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const data = await getFeed(pageNum, 40);
      if (pageNum === 1) {
        setItems(data.items);
        if (data.items.length > 0) setFocusedItem(data.items[0]);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }
      setTotalCount(data.meta.total);
      setHasMore(data.meta.page < data.meta.totalPages);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString('ko-KR'));
    fetchData(1);
  }, [fetchData]);

  // 리스트 끝에 도달 시 추가 데이터 로드 감시
  useEffect(() => {
    if (selectedIndex >= items.length - 5 && hasMore && !isFetching.current) {
      fetchData(page);
    }
  }, [selectedIndex, items.length, hasMore, page, fetchData]);

  // Index가 변경될 때마다 focusedItem 업데이트 및 임베드 지연 로딩
  useEffect(() => {
    if (items[selectedIndex]) {
      setFocusedItem(items[selectedIndex]);
      setShowEmbed(false); 

      if (embedTimer.current) clearTimeout(embedTimer.current);
      embedTimer.current = setTimeout(() => {
        setShowEmbed(true);
      }, 800);
    }
  }, [selectedIndex, items]);

  useEffect(() => {
    // 인스타그램 임베드 재활성화 로직
    if (showEmbed && focusedItem?.platform === 'INSTA' && typeof window !== 'undefined') {
      const processEmbed = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
          return true;
        }
        return false;
      };

      if (!processEmbed()) {
        const interval = setInterval(() => {
          if (processEmbed()) clearInterval(interval);
        }, 200);
        setTimeout(() => clearInterval(interval), 3000);
      }
    }
  }, [showEmbed, focusedItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isReading) setIsReading(false);
        else router.push('/');
      }

      if (!isReading) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 15, items.length - 1));
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 15, 0));
        }
        if (e.key === 'Enter') {
          if (items[selectedIndex]) setIsReading(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, items, selectedIndex, isReading]);

  // 모바일 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const touchEnd = e.touches[0].clientY;
    const diff = touchStart.current - touchEnd;

    if (Math.abs(diff) > 30) {
      if (diff > 0) setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      else setSelectedIndex(prev => Math.max(prev - 1, 0));
      touchStart.current = null;
    }
  };

  return (
    <div className="bg-[#0000AA] text-[#FFFFFF] selection:bg-[#FFFF00] selection:text-[#0000AA] relative font-mono overflow-hidden" 
         style={{ 
           fontFamily: "'DungGeunMo', monospace",
           textShadow: '0 0 1px rgba(255, 255, 255, 0.25)'
         }}>
      
      {/* CRT Overlay Effects */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.15]" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', 
               backgroundSize: '100% 3px, 3px 100%' 
             }}>
        </div>
        <div className="absolute inset-0 bg-white opacity-[0.015] animate-[flicker_0.15s_infinite] pointer-events-none"></div>
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.6)] pointer-events-none"></div>
      </div>

      <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />

      {/* ------------------- [ PC Version Layout ] ------------------- */}
      <div className="hidden lg:block min-h-screen p-4 overflow-auto relative z-10">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <header className="text-center border-b-2 border-white pb-2 mb-6">
              <h1 className="text-2xl font-bold tracking-widest">*** 부천 축구동 - 온라인 정보망 ***</h1>
              <p className="text-base mt-1">접속 시간: {currentTime || '데이터 수신 중...'}</p>
            </header>

            <div className="mb-6 flex justify-between text-[#FFFF00] text-lg">
              <span>[ 게시판: 전체 피드 ]</span>
              <span>(H)도움말 (X)로그아웃</span>
            </div>

            <div className="grid grid-cols-12 gap-2 border-b border-white pb-1 mb-2 text-[#FFFF00] text-lg">
              <div className="col-span-1 text-center">번호</div>
              <div className="col-span-2 text-center">플랫폼</div>
              <div className="col-span-7">제목/내용</div>
              <div className="col-span-2 text-right">날짜</div>
            </div>

            <div className="space-y-1 text-lg mb-10 min-h-[540px]">
              {loading ? (
                <div className="text-center py-10 animate-pulse text-gray-400">데이터 수신 중...</div>
              ) : (
                items.map((item, index) => (
                  <div 
                    key={item.id} 
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => setIsReading(true)}
                    className={`grid grid-cols-12 gap-2 transition-colors py-0.5 cursor-pointer group
                      ${selectedIndex === index ? 'bg-[#FFFF00] text-[#0000AA]' : ''}
                    `}
                  >
                    <div className="col-span-1 text-center text-gray-400 group-hover:text-inherit font-normal">{totalCount - index}</div>
                    <div className="col-span-2 text-center truncate">[{item.platform === 'INSTA' ? '인스타' : '유튜브'}]</div>
                    <div className="col-span-7 flex items-center gap-2 overflow-hidden">
                      <span className="truncate flex-1">
                        {item.title || item.caption?.substring(0, 40) || '제목 없음'}
                      </span>
                      <span className="shrink-0 text-xs opacity-50 group-hover:opacity-100 font-normal">
                        ({item.username})
                      </span>
                    </div>
                    <div className="col-span-2 text-right font-mono text-sm">
                      {currentTime ? formatRelativeTime(item.published_at) : '.. . ..'}
                    </div>
                  </div>
                ))
                .slice(Math.floor(selectedIndex / 15) * 15, Math.floor(selectedIndex / 15) * 15 + 15)
              )}
            </div>

            <div className="bg-white text-[#0000AA] px-4 py-1 font-bold flex justify-between items-center text-sm">
              <div className="flex items-center gap-4">
                <span>(↑↓)이동 (←→)페이지 (Enter)본문보기 (ESC)종료</span>
                <div className="flex items-center gap-2 border-l border-[#0000AA] pl-4">
                  <button 
                    onClick={() => setSelectedIndex(prev => Math.max(prev - 15, 0))}
                    className="hover:bg-[#0000AA] hover:text-white px-1 transition-colors"
                  >
                    [이전]
                  </button>
                  <button 
                    onClick={() => setSelectedIndex(prev => Math.min(prev + 15, items.length - 1))}
                    className="hover:bg-[#0000AA] hover:text-white px-1 transition-colors"
                  >
                    [다음]
                  </button>
                </div>
              </div>
              <span>[ 전체: {totalCount}개 / 현재: {selectedIndex + 1}번째 ]</span>
            </div>
          </div>

          <div className="col-span-4 sticky top-4 h-fit">
            <div className="border-2 border-white p-2 bg-[#0000AA]">
              <div className="bg-white text-[#0000AA] px-2 mb-2 font-bold flex justify-between text-xs">
                <span>[ 미리보기: VGA ]</span>
                {focusedItem && (
                  <button onClick={() => setIsReading(true)} className="text-red-600 hover:underline">
                    [ 원본 게시물 보기 ]
                  </button>
                )}
              </div>
              <div className="relative aspect-square border border-white overflow-hidden bg-black">
                {focusedItem ? (
                  <>
                    <img src={focusedItem.media_uri} alt="P" className="w-full h-full object-cover" />
                    {showEmbed && (
                      <div className="absolute inset-0 bg-black animate-[fadeIn_0.3s_ease-out] flex items-center justify-center overflow-hidden">
                        {focusedItem.platform === 'INSTA' ? (
                          <div className="w-full flex justify-center p-1">
                            <div className="min-w-full">
                              <blockquote
                                className="instagram-media w-full"
                                data-instgrm-permalink={focusedItem.origin_url}
                                data-instgrm-version="14"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <iframe
                              src={`https://www.youtube.com/embed/${focusedItem.external_id}?autoplay=1&mute=1`}
                              className="w-full aspect-video border-0"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 italic text-sm">NO DATA</div>
                )}
                <div className="absolute bottom-0 right-0 bg-black text-white text-[10px] px-1 opacity-70 font-mono z-20">
                  {focusedItem?.platform === 'INSTA' ? '인스타' : focusedItem?.platform === 'YOUTUBE' ? '유튜브' : ''}
                </div>
              </div>
              <div className="mt-3 text-xs space-y-2 opacity-90">
                <p className="text-[#FFFF00] font-bold">제목: {focusedItem?.title || 'NONE'}</p>
                <p className="leading-normal line-clamp-4">{focusedItem?.caption || '-'}</p>
              </div>
            </div>
            <Link href="/" className="mt-6 block text-center border-2 border-[#FFFF00] text-[#FFFF00] py-2 hover:bg-[#FFFF00] hover:text-[#0000AA] font-bold transition-all">
              현대적 UI로 돌아가기 (ESC)
            </Link>
          </div>
        </div>
      </div>

      {/* PC 버전 전용 본문 보기 모달 */}
      {isReading && focusedItem && (
        <div className="hidden lg:flex fixed inset-0 z-[100] bg-[#0000AA] flex-col p-8 animate-[fadeIn_0.2s_ease-out]">
          <header className="border-b-2 border-white pb-4 mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-[#FFFF00] mb-2">{focusedItem.title || '게시물 읽기'}</h2>
              <p className="text-sm opacity-80">작성자: {focusedItem.username} | 플랫폼: {focusedItem.platform} | 일시: {new Date(focusedItem.published_at).toLocaleString()}</p>
            </div>
            <button onClick={() => setIsReading(false)} className="bg-white text-[#0000AA] px-4 py-1 font-bold hover:bg-[#FFFF00]">
              (ESC) 목록으로
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto no-scrollbar flex gap-8">
            <div className="flex-1 bg-black rounded-lg border border-white/20 overflow-hidden flex items-center justify-center">
              {focusedItem.platform === 'INSTA' ? (
                <div className="w-full max-w-md bg-white p-4 overflow-auto h-full no-scrollbar">
                  <blockquote
                    className="instagram-media w-full"
                    data-instgrm-permalink={focusedItem.origin_url}
                    data-instgrm-version="14"
                  />
                </div>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${focusedItem.external_id}?autoplay=1`}
                  className="w-full aspect-video border-0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              )}
            </div>
            <div className="w-80 space-y-6">
              <div className="bg-[#000088] p-4 border border-white/20 h-full overflow-y-auto">
                <h3 className="text-[#FFFF00] font-bold mb-4">[ 캡션 전문 ]</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{focusedItem.caption}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- [ Mobile Version Layout ] ------------------- */}
      <div 
        className="lg:hidden h-[100dvh] flex flex-col overflow-hidden relative z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {!isReading ? (
          <>
            <header className="p-3 border-b-2 border-white bg-[#0000AA] shrink-0">
              <h1 className="text-base font-bold tracking-tighter">*** 부천 축구동 - 온라인 뷰어 ***</h1>
            </header>

            <section className="flex-1 min-h-0 bg-[#0000AA] relative overflow-hidden flex flex-col">
              <div className="p-2 text-[10px] text-[#FFFF00] border-b border-white/30 shrink-0 flex justify-between items-center">
                <span>[ 게시판: 전체 피드 ]</span>
                <span className="animate-pulse">● 온라인</span>
              </div>
              
              <div className="flex-1 relative overflow-hidden">
                <div 
                  className="absolute left-0 right-0 h-[6.666%] bg-[#FFFF00] transition-all duration-150 z-0"
                  style={{ top: `${(selectedIndex % 15) * 6.666}%` }}
                ></div>

                <div className="relative z-10 h-full grid grid-rows-15">
                  {items.slice(Math.floor(selectedIndex / 15) * 15, Math.floor(selectedIndex / 15) * 15 + 15).map((item, idx) => {
                    const globalIndex = Math.floor(selectedIndex / 15) * 15 + idx;
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <div 
                        key={item.id}
                        className={`px-4 flex items-center justify-between transition-colors duration-150 border-b border-white/5
                          ${isSelected ? 'text-[#0000AA] font-bold' : 'text-white opacity-70'}
                        `}
                        onClick={() => {
                          setSelectedIndex(globalIndex);
                          setIsReading(true);
                        }}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="text-[9px] w-4 text-center shrink-0">{totalCount - globalIndex}</span>
                          <span className="shrink-0 text-[9px] font-bold">
                            [{item.platform === 'INSTA' ? '인스타' : '유튜브'}]
                          </span>
                          <span className="shrink-0 text-[9px] opacity-60 max-w-[60px] truncate">{item.username}</span>
                          <span className="truncate text-[11px] border-l border-white/10 pl-1.5">{item.title || item.caption?.substring(0, 30)}</span>
                        </div>
                        <span className="text-[8px] font-mono shrink-0 ml-2">
                          {currentTime ? formatRelativeTime(item.published_at) : '.. . ..'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <footer className="p-3 border-t-2 border-white bg-[#0000AA] flex justify-between items-center shrink-0 min-h-[70px]">
              <div className="text-[10px] flex flex-col items-start gap-0.5">
                <span className="text-[#FFFF00] font-bold uppercase tracking-widest">Index</span>
                <span>{selectedIndex + 1} / {totalCount}</span>
              </div>

              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
                <button onClick={() => setSelectedIndex(prev => Math.max(prev - 15, 0))} className="w-9 h-9 border border-white flex items-center justify-center active:bg-white active:text-[#0000AA] transition-colors text-white font-bold text-xs">◀</button>
                <button onClick={() => setSelectedIndex(prev => Math.max(prev - 1, 0))} className="w-9 h-9 border border-white flex items-center justify-center active:bg-white active:text-[#0000AA] transition-colors text-white font-bold text-xs">▲</button>
                <button onClick={() => setSelectedIndex(prev => Math.min(prev + 1, items.length - 1))} className="w-9 h-9 border border-white flex items-center justify-center active:bg-white active:text-[#0000AA] transition-colors text-white font-bold text-xs">▼</button>
                <button onClick={() => setSelectedIndex(prev => Math.min(prev + 15, items.length - 1))} className="w-9 h-9 border border-white flex items-center justify-center active:bg-white active:text-[#0000AA] transition-colors text-white font-bold text-xs">▶</button>
              </div>

              <Link href="/" className="text-[10px] border-2 border-[#FFFF00] px-3 py-2 text-[#FFFF00] font-bold active:bg-[#FFFF00] active:text-[#0000AA]">종료</Link>
            </footer>
          </>
        ) : (
          /* 모바일 본문 읽기 모드 */
          <div className="flex-1 flex flex-col bg-[#0000AA] animate-[fadeIn_0.2s_ease-out]">
            <header className="p-3 border-b-2 border-white flex justify-between items-center bg-[#0000AA]">
              <div className="truncate pr-4">
                <h2 className="text-[#FFFF00] font-bold text-sm truncate">{focusedItem?.title || '게시물 읽기'}</h2>
                <p className="text-[10px] opacity-70">{focusedItem?.username} | {focusedItem?.platform}</p>
              </div>
              <button onClick={() => setIsReading(false)} className="bg-white text-[#0000AA] px-3 py-1 text-[10px] font-bold shrink-0">목록으로</button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">
              <div className="bg-black rounded border border-white/20 overflow-hidden flex items-center justify-center min-h-[250px]">
                {focusedItem?.platform === 'INSTA' ? (
                  <div className="w-full bg-white p-2">
                    <blockquote
                      className="instagram-media w-full"
                      data-instgrm-permalink={focusedItem?.origin_url}
                      data-instgrm-version="14"
                    />
                  </div>
                ) : (
                  <iframe
                    src={`https://www.youtube.com/embed/${focusedItem?.external_id}?autoplay=1`}
                    className="w-full aspect-video border-0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                )}
              </div>
              <div className="bg-[#000088] p-4 border border-white/10">
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{focusedItem?.caption}</p>
              </div>
            </div>

            <footer className="p-3 border-t-2 border-white flex justify-between items-center bg-[#0000AA]">
              <span className="text-[10px] text-[#FFFF00]">{selectedIndex + 1} / {totalCount}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (selectedIndex > 0) setSelectedIndex(prev => prev - 1);
                  }} 
                  className="border border-white px-3 py-1 text-[10px] active:bg-white active:text-[#0000AA]"
                >
                  이전글
                </button>
                <button 
                  onClick={() => {
                    if (selectedIndex < items.length - 1) setSelectedIndex(prev => prev + 1);
                  }} 
                  className="border border-white px-3 py-1 text-[10px] active:bg-white active:text-[#0000AA]"
                >
                  다음글
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes flicker {
          0% { opacity: 0.012; }
          50% { opacity: 0.018; }
          100% { opacity: 0.012; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
