'use client';

import { useEffect } from 'react';
import { Drawer } from 'vaul';
import Script from 'next/script';
import { X } from 'lucide-react';

interface FeedDetailSheetProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedDetailSheet({ item, isOpen, onClose }: FeedDetailSheetProps) {
  // 모바일 뒤로가기 연동 로직
  useEffect(() => {
    if (isOpen) {
      // 1. 창이 열릴 때 히스토리에 가상의 상태 추가
      window.history.pushState({ modalOpen: true }, '');

      // 2. popstate(뒤로가기) 이벤트 핸들러 등록
      const handlePopState = (event: PopStateEvent) => {
        // 뒤로가기 감지 시 창 닫기 (이때 히스토리는 이미 pop된 상태)
        onClose();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  // 수동으로 닫기 버튼을 누를 때의 래퍼 함수
  const handleManualClose = () => {
    // 만약 히스토리에 가상 상태가 남아있다면 뒤로가기를 한 번 실행해줌
    if (window.history.state?.modalOpen) {
      window.history.back();
    }
    onClose();
  };

  useEffect(() => {
    // 인스타그램 임베드 재활성화 로직 (React 19 Safe)
    if (isOpen && item?.platform === 'INSTA' && typeof window !== 'undefined') {
      const checkInstgrm = setInterval(() => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
          clearInterval(checkInstgrm);
        }
      }, 100);
      
      return () => clearInterval(checkInstgrm);
    }
  }, [isOpen, item]);

  if (!item) return null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleManualClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-white dark:bg-zinc-900 flex flex-col rounded-t-[32px] h-[92%] fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="relative p-4 flex-1 overflow-y-auto overflow-x-hidden">
            {/* accessibility 필수 요소 */}
            <Drawer.Title className="sr-only">{item.title || '부천 축구동 게시물'}</Drawer.Title>
            <Drawer.Description className="sr-only">{item.caption || '게시물 상세 내용'}</Drawer.Description>

            {/* Close Button & Handle */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-1.5 rounded-full bg-zinc-200 mb-4" />
              <button 
                onClick={handleManualClose}
                className="absolute right-4 top-4 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                <X size={20} className="text-zinc-600" />
              </button>
            </div>

            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-red-600/20">
                  BFC
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight dark:text-zinc-100">{item.username}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{item.platform}</p>
                </div>
              </div>

              {/* 플랫폼별 동적 임베드 */}
              <div className="rounded-2xl overflow-hidden shadow-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-black min-h-[300px] flex items-center justify-center">
                {item.platform === 'INSTA' ? (
                  <div className="w-full">
                    <blockquote
                      className="instagram-media w-full"
                      data-instgrm-permalink={item.origin_url}
                      data-instgrm-version="14"
                    />
                    <Script src="https://www.instagram.com/embed.js" strategy="afterInteractive" />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${item.external_id}?autoplay=1`}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>

              {/* 캡션 본문 */}
              <div className="mt-8 mb-12">
                <h1 className="text-xl font-bold mb-4 leading-tight dark:text-white">{item.title}</h1>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {item.caption}
                </p>
                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                   <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{new Date(item.published_at).toLocaleDateString()}</span>
                   <a 
                    href={item.origin_url} 
                    target="_blank" 
                    className="text-xs font-bold text-red-600 dark:text-red-500 hover:underline"
                   >
                     원본 게시물 보기 →
                   </a>
                </div>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
