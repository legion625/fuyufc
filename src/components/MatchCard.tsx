import { useState } from 'react';
import {
  ChevronDown,
  Calendar,
  Target,
  Trash2,
  Pencil,
  Footprints,
  Trophy,
  MapPin,
  Shield,
  Sun,
  Cloud,
  CloudRain,
  CloudDrizzle,
} from 'lucide-react';
import type { MatchWithPerformances, Team } from '@/lib/types';
import { getResult, resultLabel, stageLabel, pkLabel, pkScoreLabel, WEATHER_LABELS } from '@/lib/types';
import type { WeatherChoice } from '@/lib/types';
import { PlayerName } from '@/components/PlayerName';

const resultStyles: Record<string, string> = {
  win: 'bg-emerald-500 text-slate-900',
  loss: 'bg-rose-500 text-white',
  draw: 'bg-amber-400 text-slate-900',
};

const resultRing: Record<string, string> = {
  win: 'ring-emerald-500/40',
  loss: 'ring-rose-500/40',
  draw: 'ring-amber-400/40',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}.${mm}.${dd}（${weekdays[d.getDay()]}）`;
}

export function MatchCard({
  match,
  teams,
  onDelete,
  onEdit,
  compact,
}: {
  match: MatchWithPerformances;
  teams?: Team[];
  onDelete?: (match: MatchWithPerformances) => void;
  onEdit?: (match: MatchWithPerformances) => void;
  compact?: boolean;
}) {
  const teamName = teams?.find((t) => t.id === match.team_id)?.name;
  const team = teams?.find((t) => t.id === match.team_id);
  const kitColor = match.kit === 'home' ? team?.home_kit_color : match.kit === 'away' ? team?.away_kit_color : null;
  const weatherIcons: Record<WeatherChoice, typeof Sun> = { sunny: Sun, cloudy: Cloud, overcast: CloudDrizzle, rainy: CloudRain };
  const [open, setOpen] = useState(false);
  const result = getResult(match.our_score, match.opp_score, match.pk_our, match.pk_opp);
  const pk = pkLabel(match.our_score, match.opp_score, match.pk_our, match.pk_opp);
  const pkScore = pkScoreLabel(match.pk_our, match.pk_opp);
  const played = match.performances.filter((p) => p.played);
  const scorers = match.performances.filter((p) => p.goals > 0);
  const assisters = match.performances.filter((p) => p.assists > 0);

  return (
    <div
      className={`rounded-2xl bg-slate-800/60 border border-slate-700/60 ring-1 ${
        resultRing[result]
      } overflow-hidden transition-all`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4"
      >
        {/* Row 1: date + team chip | stage + result */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs min-w-0">
            <Calendar size={13} className="shrink-0" />
            <span className="truncate">{formatDate(match.match_date)}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                match.stage === 0
                  ? 'bg-slate-600/40 text-slate-400'
                  : 'bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/30'
              }`}
            >
              {stageLabel(match.stage)}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${resultStyles[result]}`}
            >
              {resultLabel(result)}{pk && `（${pkScore} ${pk}）`}
            </span>
          </div>
        </div>

        {/* Row 2: our team | score | opponent */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 text-right">
            <span className="text-slate-100 text-base font-semibold truncate block">
              {teamName ?? '我方'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`text-2xl font-bold tabular-nums ${
                result === 'win' ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {match.our_score}
            </span>
            <span className="text-slate-500 text-sm px-0.5">:</span>
            <span
              className={`text-2xl font-bold tabular-nums ${
                result === 'loss' ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {match.opp_score}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-slate-200 text-base font-medium truncate block">
              {match.opponent}
            </span>
          </div>
        </div>

        {/* Row 2.5: team + tournament + location tags */}
        {(teamName || match.tournament || match.location || kitColor || match.weather) && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[10px]">
            {teamName && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400/90 ring-1 ring-sky-500/20 font-medium">
                <Shield size={10} className="shrink-0" />
                <span className="truncate max-w-[30vw]">{teamName}</span>
              </span>
            )}
            {kitColor && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-600/30 text-slate-300 ring-1 ring-slate-500/20 font-medium">
                <span className="w-2.5 h-2.5 rounded-full border border-slate-400/40" style={{ backgroundColor: kitColor }} />
                {match.kit === 'home' ? '主場' : '客場'}
              </span>
            )}
            {match.weather && (() => {
              const WIcon = weatherIcons[match.weather];
              return (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-600/30 text-slate-300 ring-1 ring-slate-500/20 font-medium">
                  <WIcon size={10} className="shrink-0" />
                  {WEATHER_LABELS[match.weather]}
                </span>
              );
            })()}
            {match.tournament && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/10 text-amber-400/90 ring-1 ring-amber-400/20 font-medium">
                <Trophy size={10} className="shrink-0" />
                <span className="truncate max-w-[40vw]">{match.tournament}</span>
              </span>
            )}
            {match.location && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-600/30 text-slate-400 ring-1 ring-slate-500/20 font-medium">
                <MapPin size={10} className="shrink-0" />
                <span className="truncate max-w-[40vw]">{match.location}</span>
              </span>
            )}
          </div>
        )}

        {/* Row 3: played count + expand hint */}
        <div className="mt-3 flex items-center justify-between text-slate-500 text-xs">
          <span className="flex items-center gap-1">
            <Footprints size={12} className="text-sky-400" /> 上場 {played.length} 人
          </span>
          <span className="flex items-center gap-1">
            {open ? '收合' : '展開'}
            <ChevronDown
              size={14}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </div>
      </button>

      {open && !compact && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-700/50">
          <div>
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold mb-2 mt-3">
              <Footprints size={13} className="text-sky-400" /> 上場球員
            </div>
            {played.length === 0 ? (
              <p className="text-slate-500 text-xs">尚無紀錄</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {played.map((p) => (
                  <span
                    key={p.id}
                    className="text-xs px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30"
                  >
                    <PlayerName player={p.player} variant="match-compact" />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold mb-2">
                <Target size={13} className="text-emerald-400" /> 進球者
              </div>
              {scorers.length === 0 ? (
                <p className="text-slate-500 text-xs">—</p>
              ) : (
                <ul className="space-y-1">
                  {scorers.map((p) => (
                    <li
                      key={p.id}
                      className="text-xs text-slate-200 flex items-center justify-between"
                    >
                      <span className="truncate">
                        <PlayerName
                          player={p.player}
                          variant="match"
                          accentClass="text-emerald-400"
                        />
                      </span>
                      <span className="text-emerald-400 font-bold tabular-nums shrink-0 ml-2">
                        {p.goals}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold mb-2">
                <Target size={13} className="text-sky-400" /> 助攻者
              </div>
              {assisters.length === 0 ? (
                <p className="text-slate-500 text-xs">—</p>
              ) : (
                <ul className="space-y-1">
                  {assisters.map((p) => (
                    <li
                      key={p.id}
                      className="text-xs text-slate-200 flex items-center justify-between"
                    >
                      <span className="truncate">
                        <PlayerName
                          player={p.player}
                          variant="match"
                          accentClass="text-sky-400"
                        />
                      </span>
                      <span className="text-sky-400 font-bold tabular-nums shrink-0 ml-2">
                        {p.assists}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex justify-end gap-2 pt-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(match)}
                  className="text-xs text-slate-400 font-medium px-2.5 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 active:scale-95 transition-transform flex items-center gap-1.5"
                >
                  <Pencil size={12} /> 編輯
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(match)}
                  className="text-xs text-rose-400/70 font-medium px-2.5 py-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 active:scale-95 transition-transform flex items-center gap-1.5"
                >
                  <Trash2 size={12} /> 刪除
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
