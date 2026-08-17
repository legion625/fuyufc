import { useMemo, useState } from 'react';
import { Search, ChevronLeft, Swords, Filter } from 'lucide-react';
import type { MatchWithPerformances, Tournament, Team } from '@/lib/types';
import { getResult } from '@/lib/types';
import { MatchCard } from './MatchCard';

type OpponentStat = {
  name: string;
  total: number;
  wins: number;
  losses: number;
  draws: number;
  matches: MatchWithPerformances[];
};

export function HeadToHead({
  matches,
  tournaments,
  teams,
}: {
  matches: MatchWithPerformances[];
  tournaments: Tournament[];
  teams: Team[];
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [tournamentFilter, setTournamentFilter] = useState<string>('all');

  const filteredMatches = useMemo(() => {
    if (tournamentFilter === 'all') return matches;
    return matches.filter((m) => m.tournament_id === tournamentFilter);
  }, [matches, tournamentFilter]);

  const stats = useMemo(() => {
    const map = new Map<string, OpponentStat>();
    for (const m of filteredMatches) {
      const cur =
        map.get(m.opponent) ??
        {
          name: m.opponent,
          total: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          matches: [],
        };
      cur.total += 1;
      cur.matches.push(m);
      const r = getResult(m.our_score, m.opp_score, m.pk_our, m.pk_opp);
      if (r === 'win') cur.wins += 1;
      else if (r === 'loss') cur.losses += 1;
      else cur.draws += 1;
      map.set(m.opponent, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredMatches]);

  const searched = stats.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  if (selected) {
    const opp = stats.find((s) => s.name === selected);
    if (!opp) {
      setSelected(null);
      return null;
    }
    const winRate = opp.total > 0 ? Math.round((opp.wins / opp.total) * 100) : 0;
    const sorted = [...opp.matches].sort((a, b) =>
      a.match_date < b.match_date ? 1 : -1
    );

    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-slate-300 text-sm mb-3 active:scale-95 transition-transform"
        >
          <ChevronLeft size={18} /> 返回對手列表
        </button>

        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/40 border border-slate-700/60 p-5 mb-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold tracking-wide mb-1">
            <Swords size={14} /> 對戰對手
          </div>
          <h2 className="text-white text-xl font-bold mb-4">{opp.name}</h2>

          <div className="flex items-end gap-3 mb-4">
            <div>
              <div className="text-slate-400 text-[11px]">總勝率</div>
              <div className="text-3xl font-bold text-emerald-400 tabular-nums">
                {winRate}
                <span className="text-lg">%</span>
              </div>
            </div>
            <div className="flex-1 flex gap-2 text-center">
              <div className="flex-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-2">
                <div className="text-emerald-400 font-bold text-lg tabular-nums">
                  {opp.wins}
                </div>
                <div className="text-slate-400 text-[10px]">勝</div>
              </div>
              <div className="flex-1 rounded-xl bg-amber-400/15 border border-amber-400/30 py-2">
                <div className="text-amber-400 font-bold text-lg tabular-nums">
                  {opp.draws}
                </div>
                <div className="text-slate-400 text-[10px]">和</div>
              </div>
              <div className="flex-1 rounded-xl bg-rose-500/15 border border-rose-500/30 py-2">
                <div className="text-rose-400 font-bold text-lg tabular-nums">
                  {opp.losses}
                </div>
                <div className="text-slate-400 text-[10px]">負</div>
              </div>
            </div>
          </div>
          <div className="text-slate-400 text-xs">
            累計 {opp.total} 場對戰
          </div>
        </div>

        <div className="space-y-3">
          {sorted.map((m) => (
            <MatchCard key={m.id} match={m} teams={teams} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {tournaments.length > 0 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
          <Filter size={14} className="text-slate-500 shrink-0" />
          <FilterChip
            label="全部盃賽"
            active={tournamentFilter === 'all'}
            onClick={() => setTournamentFilter('all')}
          />
          {tournaments.map((t) => (
            <FilterChip
              key={t.id}
              label={t.name}
              active={tournamentFilter === t.id}
              onClick={() => setTournamentFilter(t.id)}
            />
          ))}
        </div>
      )}

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋對手（例如：LS紅虎、銘傳晨星）"
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {searched.length === 0 ? (
        <div className="text-center text-slate-500 text-sm py-12">
          {query ? '找不到符合的對手' : '尚無對戰紀錄'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {searched.map((opp) => {
            const winRate =
              opp.total > 0 ? Math.round((opp.wins / opp.total) * 100) : 0;
            return (
              <button
                key={opp.name}
                onClick={() => setSelected(opp.name)}
                className="w-full text-left rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">
                      {opp.name}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      對戰 {opp.total} 場 · 勝率 {winRate}%
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold tabular-nums">
                      {opp.wins}勝
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md bg-amber-400/15 text-amber-400 font-semibold tabular-nums">
                      {opp.draws}和
                    </span>
                    <span className="text-xs px-2 py-1 rounded-md bg-rose-500/15 text-rose-400 font-semibold tabular-nums">
                      {opp.losses}負
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-emerald-500 text-slate-900 border-emerald-500'
          : 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {label}
    </button>
  );
}
