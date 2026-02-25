'use client';

import { getFeed, FeedItem } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ClassicPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedItem, setFocusedItem] = useState<FeedItem | null>(null);
  const router = useRouter();
  
  // Touch gesture tracking
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getFeed(1, 40);
        setItems(data.items);
        if (data.items.length > 0) setFocusedItem(data.items[0]);
      } catch (error) {
        console.error('Failed to fetch feed:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Index가 변경될 때마다 focusedItem 업데이트
  useEffect(() => {
    if (items[selectedIndex]) {
      setFocusedItem(items[selectedIndex]);
    }
  }, [selectedIndex, items]);

  // 모바일 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const touchEnd = e.touches[0].clientY;
    const diff = touchStart.current - touchEnd;

    // 감도 조절 (30px 이상 움직였을 때)
    if (Math.abs(diff) > 30) {
      if (diff > 0) { // Swipe Up -> Next
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
      } else { // Swipe Down -> Prev
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
      touchStart.current = null; // 연속 이동 방지
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

      {/* ------------------- [ PC Version Layout ] ------------------- */}
      <div className="hidden lg:block min-h-screen p-4 overflow-auto relative z-10">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <header className="text-center border-b-2 border-white pb-2 mb-6">
              <h1 className="text-2xl font-bold tracking-widest">*** 하이텔 축구동 - 부천 축구동 정보망 ***</h1>
              <p className="text-base mt-1">접속 시간: {new Date().toLocaleString('ko-KR')}</p>
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

            <div className="space-y-1 text-lg mb-10">
              {loading ? (
                <div className="text-center py-10 animate-pulse text-gray-400">데이터 수신 중...</div>
              ) : (
                items.map((item, index) => (
                  <Link 
                    key={item.id} 
                    href={item.origin_url}
                    target="_blank"
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`grid grid-cols-12 gap-2 transition-colors py-0.5 cursor-pointer group
                      ${selectedIndex === index ? 'bg-[#FFFF00] text-[#0000AA]' : ''}
                    `}
                  >
                    <div className="col-span-1 text-center text-gray-400 group-hover:text-inherit font-normal">{items.length - index}</div>
                    <div className="col-span-2 text-center truncate">[{item.platform === 'INSTA' ? '인스타' : '유튜브'}]</div>
                    <div className="col-span-7 truncate">{item.title || item.caption?.substring(0, 40) || '제목 없음'}</div>
                    <div className="col-span-2 text-right font-mono text-sm">{new Date(item.published_at).toLocaleDateString().substring(5)}</div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="col-span-4 sticky top-4 h-fit">
            <div className="border-2 border-white p-2 bg-[#0000AA]">
              <div className="bg-white text-[#0000AA] px-2 mb-2 font-bold flex justify-between">
                <span>[ 미리보기: VGA ]</span>
                <span>X</span>
              </div>
              <div className="relative aspect-square border border-white overflow-hidden bg-black">
                {focusedItem ? (
                  <img key={focusedItem.id} src={focusedItem.media_uri} alt="P" className="w-full h-full object-cover animate-[fadeIn_0.3s_ease-out]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 italic text-sm">NO DATA</div>
                )}
                <div className="absolute bottom-0 right-0 bg-black text-white text-[10px] px-1 opacity-70 font-mono">
                  {focusedItem?.platform} DATA RECEIVED
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

      {/* ------------------- [ Mobile Version Layout ] ------------------- */}
      <div 
        className="lg:hidden h-[100dvh] flex flex-col overflow-hidden relative z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <header className="p-2 border-b-2 border-white bg-[#0000AA] shrink-0">
          <h1 className="text-base font-bold tracking-tighter">*** 하이텔 뷰어 - 부천 축구동 ***</h1>
        </header>

        {/* 1. Fixed Preview Area */}
        <section className="flex-[0.8] min-h-0 flex flex-col border-b-2 border-white bg-black relative">
          <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
            {focusedItem ? (
              <img key={focusedItem.id} src={focusedItem.media_uri} alt="P" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-gray-600 italic text-xs">데이터 대기 중...</div>
            )}
            <div className="absolute top-2 left-2 bg-[#0000AA] border border-white px-1.5 py-0.5 text-[9px] font-mono">
              {focusedItem?.platform || 'SYS'} STREAM: OK
            </div>
          </div>
          <div className="h-16 bg-[#0000AA] border-t border-white p-2 overflow-y-auto shrink-0 font-mono">
            <p className="text-[10px] leading-[1.3] opacity-90 line-clamp-3 italic text-[#FFFF00]">
              &gt; {focusedItem?.title || focusedItem?.caption?.substring(0, 60) || '정보 없음'}
            </p>
          </div>
        </section>

        {/* 2. Fixed List with Moving Cursor */}
        <section className="flex-1 min-h-0 bg-[#0000AA] relative overflow-hidden flex flex-col">
          <div className="p-2 text-[10px] text-[#FFFF00] border-b border-white/30 shrink-0 flex justify-between">
            <span>[ 게시물 리스트 ]</span>
            <span>▲▼ 스와이프로 이동</span>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            {/* Moving Selection Bar */}
            <div 
              className="absolute left-0 right-0 h-10 bg-[#FFFF00] transition-all duration-150 z-0"
              style={{ top: `calc(${(selectedIndex % 6)} * 40px)` }}
            ></div>

            {/* List Content (Paged) */}
            <div className="relative z-10">
              {items.slice(Math.floor(selectedIndex / 6) * 6, Math.floor(selectedIndex / 6) * 6 + 6).map((item, idx) => {
                const globalIndex = Math.floor(selectedIndex / 6) * 6 + idx;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <div 
                    key={item.id}
                    className={`h-10 px-4 flex items-center justify-between transition-colors duration-150
                      ${isSelected ? 'text-[#0000AA] font-bold' : 'text-white opacity-60'}
                    `}
                    onClick={() => window.open(item.origin_url, '_blank')}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span className="text-[10px] w-4 text-center">{items.length - globalIndex}</span>
                      <span className="truncate text-xs">{item.title || item.caption?.substring(0, 30)}</span>
                    </div>
                    <span className="text-[9px] font-mono shrink-0 ml-2">
                      {new Date(item.published_at).toLocaleDateString().substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="p-2 border-t-2 border-white bg-[#0000AA] flex justify-between items-center shrink-0">
          <div className="text-[10px] flex items-center space-x-1">
            <span className="text-[#FFFF00] font-bold">INDEX:</span>
            <span>{selectedIndex + 1} / {items.length}</span>
            <span className="w-1.5 h-3 bg-white animate-bounce ml-1"></span>
          </div>
          <Link href="/" className="text-[9px] border border-[#FFFF00] px-2 py-0.5 text-[#FFFF00]">나가기</Link>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes flicker {
          0% { opacity: 0.012; }
          50% { opacity: 0.018; }
          100% { opacity: 0.012; }
        }
      `}</style>
    </div>
  );
}
