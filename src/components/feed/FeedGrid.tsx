'use client';

import { useState, useEffect } from 'react';
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
    rootMargin: '100px', // 사용자가 도달하기 100px 전에 미리 호출
  });
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // 하단 도달 시 데이터 로드 트리거
  useEffect(() => {
    if (inView && !isLoading) {
      onLoadMore();
    }
  }, [inView, isLoading, onLoadMore]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Masonry Layout: CSS columns */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index % 5 * 0.1, type: 'spring', stiffness: 80 }}
              className="break-inside-avoid mb-4"
            >
              <FeedCard 
                item={item} 
                onClick={() => setSelectedItem(item)} 
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Skeleton UI (Loading State) */}
        {isLoading && [...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="w-full h-64 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl mb-4"
          />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={ref} className="h-20 w-full flex items-center justify-center">
        {isLoading && <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />}
      </div>

      {/* Detail View Bottom Sheet */}
      <FeedDetailSheet
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
