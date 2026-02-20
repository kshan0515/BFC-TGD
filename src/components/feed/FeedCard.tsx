'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface FeedCardProps {
  item: any;
  onClick: () => void;
}

export default function FeedCard({ item, onClick }: FeedCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-[0_0_20px_rgba(218,41,28,0.3)] dark:hover:shadow-[0_0_25px_rgba(218,41,28,0.2)] transition-all duration-300"
    >
      {/* 플랫폼 뱃지 */}
      <div className="absolute top-2 right-2 z-10 bg-black/60 dark:bg-zinc-950/80 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
        <span className="text-[10px] font-bold text-white tracking-tighter">
          {item.platform === 'INSTA' ? '📸 INSTA' : '📺 YOUTUBE'}
        </span>
      </div>

      {/* 이미지 썸네일 영역 - 플랫폼별 동적 비율 적용 */}
      <div className={`relative w-full overflow-hidden ${
        item.platform === 'YOUTUBE' ? 'aspect-video' : 'aspect-[4/5]'
      }`}>
        <Image
          src={item.media_uri}
          alt={item.title || 'Feed Image'}
          fill
          unoptimized={true}
          priority={true}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {/* Hover 시 상단 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* 텍스트 영역 */}
      <div className="p-3 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">
            {item.username}
          </h3>
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">
            {new Date(item.published_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm font-bold line-clamp-2 text-zinc-800 dark:text-zinc-50 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {item.title || item.caption}
        </p>
      </div>
    </motion.div>
  );
}
