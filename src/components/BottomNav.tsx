import { Trophy, Swords, BarChart3, Users, CalendarPlus, Shield } from 'lucide-react';

export type TabId = 'results' | 'tournaments' | 'h2h' | 'stats' | 'players' | 'teams';

const tabs: { id: TabId; label: string; icon: typeof Trophy }[] = [
  { id: 'results', label: '賽果', icon: Trophy },
  { id: 'tournaments', label: '賽事', icon: CalendarPlus },
  { id: 'h2h', label: '對戰', icon: Swords },
  { id: 'stats', label: '排行', icon: BarChart3 },
  { id: 'players', label: '球員', icon: Users },
  { id: 'teams', label: '球隊', icon: Shield },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
}) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex w-full">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{ flex: '1 1 0', minWidth: 0 }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                on ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Icon size={18} strokeWidth={on ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-tight tracking-wide">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
