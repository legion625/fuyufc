import { useMemo } from 'react';
import { Crown, Medal, Trophy } from 'lucide-react';
import type { MatchWithPerformances, Player } from '@/lib/types';
import { playerDisplayName, playerHasJerseyName } from '@/components/PlayerName';

type Row = {
  player: Player;
  value: number;
};

type RankStyle = {
  icon: typeof Crown;
  iconText: string;
  iconBorder: string;
  valueText: string;
  bar: string;
};

const RANK_STYLES: Record<number, RankStyle> = {
  1: {
    icon: Crown,
    iconText: 'text-amber-400',
    iconBorder: 'border-amber-400/70',
    valueText: 'text-amber-400',
    bar: 'bg-gradient-to-b from-amber-500 to-amber-400',
  },
  2: {
    icon: Medal,
    iconText: 'text-slate-300',
    iconBorder: 'border-slate-200',
    valueText: 'text-slate-300',
    bar: 'bg-gradient-to-b from-[#5e7dc8] to-[#4f6daf]',
  },
  3: {
    icon: Trophy,
    iconText: 'text-orange-400',
    iconBorder: 'border-orange-400/70',
    valueText: 'text-orange-400',
    bar: 'bg-gradient-to-b from-orange-500 to-orange-400',
  },
};

function PodiumPlayer({ row, rank, unit }: { row: Row; rank: number; unit: string }) {
  const style = RANK_STYLES[rank];
  const Icon = style.icon;
  const hasJerseyName = playerHasJerseyName(row.player);
  const jerseyName = playerDisplayName(row.player);
  const barHeight = rank === 1 ? 'h-[97px]' : rank === 2 ? 'h-[65px]' : 'h-[49px]';

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end text-center">
      <div className={`mb-1 flex h-12 w-12 items-center justify-center rounded-full border-2 ${style.iconBorder} ${style.iconText}`}>
        <Icon size={27} strokeWidth={1.8} />
      </div>
      <div className="w-full truncate text-sm font-bold leading-tight text-white">
        {jerseyName}
      </div>
      {hasJerseyName && (
        <div className="mt-0.5 w-full truncate text-[10px] leading-tight text-slate-400">
          {row.player.name}
        </div>
      )}
      <div className="mt-1 text-[10px] font-semibold tabular-nums text-[#4f6daf]">
        #{row.player.jersey_number ?? '—'}
      </div>
      <div className={`mt-1 text-lg font-black leading-none tabular-nums ${style.valueText}`}>
        {row.value}
        <span className="ml-0.5 text-[11px] font-bold">{unit}</span>
      </div>
      <div className={`mt-2 w-full max-w-[116px] rounded-t-lg ${barHeight} ${style.bar}`} />
    </div>
  );
}

function Leaderboard({ rows, unit }: { rows: Row[]; unit: string }) {
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  const podiumOrder = [2, 1, 3];

  if (top.length === 0) {
    return <div className="py-12 text-center text-sm text-slate-500">尚無紀錄</div>;
  }

  return (
    <>
      <div className="flex items-end justify-center gap-2 px-1">
        {podiumOrder.map((rank) => {
          const row = top[rank - 1];
          return row ? (
            <PodiumPlayer key={row.player.id} row={row} rank={rank} unit={unit} />
          ) : (
            <div key={`empty-${rank}`} className="flex-1" />
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="mt-6 space-y-2">
          {rest.map((row, index) => {
            const hasJerseyName = playerHasJerseyName(row.player);
            return (
              <div
                key={row.player.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
              >
                <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-[#4f6daf]">
                  {index + 4}
                </span>
                <div className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-semibold text-[#4f6daf]">
                    {playerDisplayName(row.player)}
                  </span>
                  {hasJerseyName && (
                    <span className="ml-1.5 text-xs text-slate-400">{row.player.name}</span>
                  )}
                  <span className="ml-1.5 text-xs text-[#4f6daf]">
                    #{row.player.jersey_number ?? '—'}
                  </span>
                </div>
                <span className="shrink-0 font-bold tabular-nums text-emerald-400">
                  {row.value}
                  <span className="ml-0.5 text-xs font-medium">{unit}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function StatsBoard({ matches }: { matches: MatchWithPerformances[] }) {
  const { goalRows, assistRows } = useMemo(() => {
    const goalMap = new Map<string, number>();
    const assistMap = new Map<string, number>();
    const playerMap = new Map<string, Player>();

    for (const match of matches) {
      for (const performance of match.performances) {
        playerMap.set(performance.player.id, performance.player);
        goalMap.set(
          performance.player.id,
          (goalMap.get(performance.player.id) ?? 0) + performance.goals
        );
        assistMap.set(
          performance.player.id,
          (assistMap.get(performance.player.id) ?? 0) + performance.assists
        );
      }
    }

    const toRows = (map: Map<string, number>): Row[] =>
      Array.from(map.entries())
        .map(([id, value]) => ({ player: playerMap.get(id)!, value }))
        .filter((row) => row.player && row.value > 0)
        .sort((a, b) => b.value - a.value);

    return { goalRows: toRows(goalMap), assistRows: toRows(assistMap) };
  }, [matches]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
          <Trophy size={18} className="text-emerald-400" /> 進球榜
        </h2>
        <Leaderboard rows={goalRows} unit="球" />
      </section>
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
          <Medal size={18} className="text-sky-400" /> 助攻榜
        </h2>
        <Leaderboard rows={assistRows} unit="次" />
      </section>
    </div>
  );
}
