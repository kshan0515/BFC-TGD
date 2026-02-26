'use client';

import { MATCH_DATA, Match } from '@/lib/matchData';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function MatchSchedule() {
  const now = new Date();
  const nextMatchRef = useRef<HTMLDivElement>(null);

  // 다가올 가장 가까운 경기의 인덱스 찾기
  const nextMatchIndex = MATCH_DATA.findIndex(match => new Date(match.date) >= now);

  useEffect(() => {
    // 다가올 경기가 있다면 해당 위치로 스크롤
    if (nextMatchRef.current) {
      nextMatchRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  // 날짜 포맷팅 함수
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      month: d.getMonth() + 1,
      day: d.getDate(),
      weekday: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
      time: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black dark:text-white">2026 경기 일정</h2>
        <span className="text-xs font-bold px-2 py-1 bg-red-600 text-white rounded">K LEAGUE 1</span>
      </div>

      <div className="space-y-4">
        {MATCH_DATA.map((match, index) => {
          const { month, day, weekday, time } = formatDate(match.date);
          const isPast = new Date(match.date) < now;
          const isNextMatch = index === nextMatchIndex;

          return (
            <motion.div
              key={match.id}
              ref={isNextMatch ? nextMatchRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
                isNextMatch
                  ? 'border-red-500 dark:border-red-600 ring-2 ring-red-500/20 shadow-xl scale-[1.02] z-10'
                  : isPast 
                    ? 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800 opacity-60' 
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'
              } p-5`}
            >
              {isNextMatch && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-bl-xl">
                  NEXT MATCH
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[50px]">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">{month}월</p>
                    <p className="text-2xl font-black dark:text-white leading-none">{day}</p>
                    <p className="text-[10px] font-bold text-zinc-500">({weekday})</p>
                  </div>
                  
                  <div className="h-10 w-[1px] bg-zinc-100 dark:bg-zinc-800 mx-2" />

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        match.isHome 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {match.isHome ? 'HOME' : 'AWAY'}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">{time}</span>
                    </div>
                    <h3 className="text-lg font-black dark:text-white">
                      부천 <span className="text-zinc-300 mx-1">vs</span> {match.opponent}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 max-w-[100px] leading-tight">
                    {match.location}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
