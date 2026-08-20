import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'fuyu-theme';
const CHOSEN_KEY = 'fuyu-theme-chosen';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      applyTheme(t);
      localStorage.setItem(CHOSEN_KEY, '1');
    },
    [applyTheme]
  );

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function hasChosenTheme(): boolean {
  return localStorage.getItem(CHOSEN_KEY) === '1';
}

export function ThemeSelector({ onChoose }: { onChoose: () => void }) {
  const { setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-2xl tracking-wide">富譽FC</h1>
          <p className="text-sky-400 text-xs font-medium tracking-widest mt-1">
            FUYU FOOTBALL CLUB
          </p>
          <p className="text-slate-400 text-sm mt-6">選擇您偏好的顯示模式</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setTheme('dark');
              onChoose();
            }}
            className="group rounded-2xl bg-slate-900 border border-slate-700 p-5 active:scale-95 transition-transform"
          >
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="h-2 w-12 rounded-full bg-slate-600" />
                <div className="h-2 w-6 rounded-full bg-sky-500" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-slate-600" />
                <div className="h-2 w-3/4 rounded-full bg-slate-700" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span className="text-white font-semibold text-sm">深色</span>
            </div>
          </button>

          <button
            onClick={() => {
              setTheme('light');
              onChoose();
            }}
            className="group rounded-2xl bg-slate-100 border border-slate-300 p-5 active:scale-95 transition-transform"
          >
            <div className="rounded-xl bg-white border border-slate-200 p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="h-2 w-12 rounded-full bg-slate-300" />
                <div className="h-2 w-6 rounded-full bg-sky-500" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-slate-300" />
                <div className="h-2 w-3/4 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              <span className="text-slate-800 font-semibold text-sm">淺色</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
