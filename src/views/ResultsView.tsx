import { useMemo, useState } from 'react';
import { Loader2, Trophy, Medal, Lock, Pencil, MapPin, Plus, ChevronDown } from 'lucide-react';
import type { MatchWithPerformances, Tournament, Team } from '@/lib/types';
import { getResult, rankLabel } from '@/lib/types';

const STAGE_SORT_PRIORITY: Record<number, number> = {
  2: 0,  // 決賽
  3: 1,  // 季軍賽
  4: 2,  // 4強
  8: 3,  // 8強
  16: 4, // 16強
  0: 5,  // 小組賽
};

function stagePriority(stage: number): number {
  return STAGE_SORT_PRIORITY[stage] ?? 99;
}
import { MatchCard } from '@/components/MatchCard';

type TournamentGroup = {
  tournament: Tournament | null;
  matches: MatchWithPerformances[];
  wins: number;
  losses: number;
  draws: number;
  gf: number;
  ga: number;
};

export function ResultsView({
  matches,
  tournaments,
  teams,
  loading,
  error,
  onDelete,
  onEdit,
  onEditTournament,
  onLogMatch,
}: {
  matches: MatchWithPerformances[];
  tournaments: Tournament[];
  teams: Team[];
  loading: boolean;
  error: string | null;
  onDelete?: (m: MatchWithPerformances) => void;
  onEdit?: (m: MatchWithPerformances) => void;
  onEditTournament?: (t: Tournament) => void;
  onLogMatch?: (t: Tournament) => void;
}) {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const groups = useMemo(() => {
    const tMap = new Map(tournaments.map((t) => [t.id, t]));
    const byTournament = new Map<string, TournamentGroup>();
    const unassigned: MatchWithPerformances[] = [];

    // Ensure every tournament appears, even with zero matches
    for (const t of tournaments) {
      byTournament.set(t.id, {
        tournament: t,
        matches: [],
        wins: 0,
        losses: 0,
        draws: 0,
        gf: 0,
        ga: 0,
      });
    }

    for (const m of matches) {
      if (!m.tournament_id) {
        unassigned.push(m);
        continue;
      }
      const cur =
        byTournament.get(m.tournament_id) ??
        {
          tournament: tMap.get(m.tournament_id) ?? null,
          matches: [],
          wins: 0,
          losses: 0,
          draws: 0,
          gf: 0,
          ga: 0,
        };
      cur.matches.push(m);
      cur.gf += m.our_score;
      cur.ga += m.opp_score;
      const r = getResult(m.our_score, m.opp_score, m.pk_our, m.pk_opp);
      if (r === 'win') cur.wins++;
      else if (r === 'loss') cur.losses++;
      else cur.draws++;
      byTournament.set(m.tournament_id, cur);
    }

    for (const g of byTournament.values()) {
      g.matches.sort((a, b) => {
        const sp = stagePriority(a.stage) - stagePriority(b.stage);
        if (sp !== 0) return sp;
        return a.match_date < b.match_date ? 1 : -1;
      });
    }

    const sorted = Array.from(byTournament.values()).sort((a, b) => {
      const aDate = a.tournament?.start_date ?? a.matches[0]?.match_date ?? '';
      const bDate = b.tournament?.start_date ?? b.matches[0]?.match_date ?? '';
      return aDate < bDate ? 1 : -1;
    });

    if (unassigned.length > 0) {
      sorted.push({
        tournament: null,
        matches: unassigned,
        wins: 0,
        losses: 0,
        draws: 0,
        gf: 0,
        ga: 0,
      });
    }
    return sorted;
  }, [matches, tournaments]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-rose-400 text-sm py-20">{error}</div>;
  }
  if (matches.length === 0 && tournaments.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-20">
        尚無賽果紀錄
        <div className="mt-1 text-xs">到「盃賽」分頁新增盃賽後即可登錄比賽</div>
      </div>
    );
  }
  if (matches.length === 0 && tournaments.length > 0) {
    return (
      <div className="space-y-6">
        <div className="text-center text-slate-500 text-sm py-6">
          尚未登錄任何賽果，點擊下方盃賽的「登錄」按鈕開始
        </div>
        {groups.map((g) => (
          <TournamentSection
            key={g.tournament?.id ?? 'unassigned'}
            group={g}
            teamName={g.tournament ? teamMap.get(g.tournament.team_id)?.name ?? null : null}
            teams={teams}
            onDelete={onDelete}
            onEdit={onEdit}
            onEditTournament={onEditTournament}
            onLogMatch={onLogMatch}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <TournamentSection
          key={g.tournament?.id ?? 'unassigned'}
          group={g}
          teamName={g.tournament ? teamMap.get(g.tournament.team_id)?.name ?? null : null}
          teams={teams}
          onDelete={onDelete}
          onEdit={onEdit}
          onEditTournament={onEditTournament}
          onLogMatch={onLogMatch}
        />
      ))}
    </div>
  );
}

function TournamentSection({
  group,
  teamName,
  teams,
  onDelete,
  onEdit,
  onEditTournament,
  onLogMatch,
}: {
  group: TournamentGroup;
  teamName: string | null;
  teams: Team[];
  onDelete?: (m: MatchWithPerformances) => void;
  onEdit?: (m: MatchWithPerformances) => void;
  onEditTournament?: (t: Tournament) => void;
  onLogMatch?: (t: Tournament) => void;
}) {
  const t = group.tournament;
  const [collapsed, setCollapsed] = useState(false);
  const dateRange =
    t?.start_date && t?.end_date && t.start_date !== t.end_date
      ? `${t.start_date.slice(5)} – ${t.end_date.slice(5)}`
      : t?.start_date
      ? t.start_date.slice(5)
      : group.matches[0]?.match_date?.slice(5) ?? '';

  return (
    <section>
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/40 border border-slate-700/60 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-400 shrink-0" />
                <h3 className="text-white font-bold text-base truncate">
                  {t?.name ?? '未歸屬盃賽'}
                </h3>
                {teamName && (
                  <span className="text-sky-400 text-sm font-semibold shrink-0">
                    · {teamName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs flex-wrap mt-1.5">
                {dateRange && <span>{dateRange}</span>}
                {dateRange && t?.location && <span>·</span>}
                {t?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {t.location}
                  </span>
                )}
                {t?.frozen && (
                  <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                    <Lock size={10} /> 鎖定
                  </span>
                )}
                {t?.final_rank != null && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Medal size={12} /> {rankLabel(t.final_rank)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200 active:scale-90 transition-transform px-2 py-1.5 rounded-lg hover:bg-slate-700/50"
                aria-label={collapsed ? '展開比賽' : '收合比賽'}
              >
                <ChevronDown
                  size={18}
                  className={`transition-transform ${collapsed ? '' : 'rotate-180'}`}
                />
                <span className="text-[10px] font-medium leading-none">{collapsed ? '展開' : '收合'}</span>
              </button>
              {t && !t.frozen && onLogMatch && (
                <button
                  onClick={() => onLogMatch(t)}
                  className="flex flex-col items-center gap-0.5 text-emerald-400 hover:text-emerald-300 active:scale-90 transition-transform px-2 py-1.5 rounded-lg hover:bg-emerald-500/10"
                  aria-label="登錄賽果"
                >
                  <Plus size={18} />
                  <span className="text-[10px] font-medium leading-none">登錄</span>
                </button>
              )}
              {t && onEditTournament && (
                <button
                  onClick={() => onEditTournament(t)}
                  className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200 active:scale-90 transition-transform px-2 py-1.5 rounded-lg hover:bg-slate-700/50"
                  aria-label="編輯盃賽"
                >
                  <Pencil size={16} />
                  <span className="text-[10px] font-medium leading-none">編輯</span>
                </button>
              )}
            </div>
          </div>

          {group.matches.length > 0 && (
            <div className="flex gap-2 mt-3">
              <StatChip label="勝" value={group.wins} color="emerald" />
              <StatChip label="和" value={group.draws} color="amber" />
              <StatChip label="負" value={group.losses} color="rose" />
              <StatChip
                label="得失"
                value={`${group.gf}:${group.ga}`}
                color="slate"
              />
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-3 mt-3">
          {group.matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              teams={teams}
              onDelete={t?.frozen ? undefined : onDelete}
              onEdit={t?.frozen ? undefined : onEdit}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const colors = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  };
  return (
    <div
      className={`flex-1 rounded-xl border py-1.5 text-center ${colors[color]}`}
    >
      <div className="font-bold text-sm tabular-nums">{value}</div>
      <div className="text-[10px] opacity-80">{label}</div>
    </div>
  );
}
