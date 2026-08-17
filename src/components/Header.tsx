import { Shield, Info } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function Header({ onOpenChangelog }: { onOpenChangelog: () => void }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Shield size={22} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight flex-1">
          <h1 className="text-white font-bold text-lg tracking-wide">
            富譽FC
          </h1>
          <p className="text-sky-400 text-[11px] font-medium tracking-widest">
            FUYU FOOTBALL CLUB
          </p>
        </div>
        <button
          onClick={onOpenChangelog}
          className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="更新紀錄"
        >
          <Info size={18} className="text-slate-400" />
        </button>
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="切換深淺色模式"
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
