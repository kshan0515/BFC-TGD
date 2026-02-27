'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // 하이드레이션 에러 방지 (클라이언트 마운트 후 렌더링)
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // 플레이스홀더
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-95"
      aria-label="Toggle Theme"
    >
      <div className="relative w-4 h-4">
        <Sun className="absolute inset-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" size={16} />
        <Moon className="absolute inset-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" size={16} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tight">
        {theme === 'dark' ? '다크' : '라이트'}
      </span>
    </button>
  );
}
