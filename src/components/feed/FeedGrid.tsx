'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import FeedCard from './FeedCard';
import FeedDetailSheet from './FeedDetailSheet';

interface FeedGridProps {
  items: any[];
  isLoading: boolean;
  onLoadMore: () => void;
}

export default function FeedGrid({ items, isLoading, onLoadMore }: FeedGridProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [columnCount, setColumnCount] = useState(2); // 기본 모바일 2열

  // 1. 화면 크기에 따른 열 개수 계산
  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth >= 1024) setColumnCount(4);
      else if (window.innerWidth >= 768) setColumnCount(3);
      else setColumnCount(2);
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  // 2. 데이터를 각 열로 순서대로 배분 (진짜 Masonry 순서 보장)
  const columns = useMemo(() => {
    const cols: any[][] = Array.from({ length: columnCount }, () => []);
    items.forEach((item, index) => {
      cols[index % columnCount].push(item); // .push로 수정
    });
    return cols;
  }, [items, columnCount]);

  // 하단 도달 시 로드 트리거
  useEffect(() => {
    if (inView && !isLoading) {
      onLoadMore();
    }
  }, [inView, isLoading, onLoadMore]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
      {/* Masonry Layout: Flexbox 기반 열 정렬 */}
      <div className="flex gap-3 md:gap-4 items-start w-full">
        {columns.map((columnItems, colIndex) => (
          <div key={colIndex} className="flex-1 min-w-0 flex flex-col gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {columnItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: (index * 0.05),
                    ease: [0.23, 1, 0.32, 1] 
                  }}
                >
                  <FeedCard 
                    item={item} 
                    onClick={() => setSelectedItem(item)} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Loading & Infinite Scroll UI */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={ref} className="h-20 w-full" />

      {/* Detail View */}
      <FeedDetailSheet
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
