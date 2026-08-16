import { useEffect, useState } from 'react';
import { Check, Loader2, Minus, Plus, X, Footprints } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { updateMatch } from '@/lib/teamAuth';
import type { MatchWithPerformances, Player, Tournament } from '@/lib/types';
import { STAGES as STAGE_LIST, stageLabel } from '@/lib/types';

type Perf = {
  playerId: string;
  attended: boolean;
  played: boolean;
  goals: number;
  assists: number;
};

export function EditMatchModal({
  match,
  players,
  tournament,
  onClose,
  onSaved,
}: {
  match: MatchWithPerformances;
  players: Player[];
  tournament: Tournament | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(match.match_date);
  const [stage, setStage] = useState<number>(match.stage ?? 0);
  const [opponent, setOpponent] = useState(match.opponent);
  const [ourScore, setOurScore] = useState(match.our_score);
  const [oppScore, setOppScore] = useState(match.opp_score);
  const [pkOur, setPkOur] = useState<number | null>(match.pk_our);
  const [pkOpp, setPkOpp] = useState<number | null>(match.pk_opp);
  const [notes, setNotes] = useState(match.notes ?? '');
  const [perfs, setPerfs] = useState<Record<string, Perf>>(() => {
    const init: Record<string, Perf> = {};
    const map = new Map(match.performances.map((p) => [p.player_id, p]));
    for (const p of players) {
      const ex = map.get(p.id);
      init[p.id] = {
        playerId: p.id,
        attended: ex?.attended ?? false,
        played: ex?.played ?? false,
        goals: ex?.goals ?? 0,
        assists: ex?.assists ?? 0,
      };
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [attendedIds, setAttendedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    async function loadAtt() {
      if (!tournament) {
        setAttendedIds(null);
        return;
      }
      const { data } = await supabase
        .from('tournament_attendances')
        .select('player_id')
        .eq('tournament_id', tournament.id)
        .eq('attended', true);
      setAttendedIds(new Set((data ?? []).map((r) => r.player_id)));
    }
    loadAtt();
  }, [tournament]);

  const eligiblePlayers =
    attendedIds == null
      ? players
      : players.filter((p) => attendedIds.has(p.id));

  function togglePlayed(id: string) {
    setPerfs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        played: !prev[id].played,
        goals: !prev[id].played ? prev[id].goals : 0,
        assists: !prev[id].played ? prev[id].assists : 0,
      },
    }));
  }

  function bump(id: string, field: 'goals' | 'assists', delta: number) {
    setPerfs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: Math.max(0, prev[id][field] + delta) },
    }));
  }

  async function submit() {
    setMsg(null);
    if (!opponent.trim()) {
      setMsg({ ok: false, text: '請填寫對手' });
      return;
    }
    setSaving(true);
    const perfRows = eligiblePlayers
      .map((p) => perfs[p.id])
      .filter((pf): pf is Perf => pf != null)
      .map((pf) => ({
        player_id: pf.playerId,
        attended: pf.attended || pf.played,
        played: pf.played,
        goals: pf.goals,
        assists: pf.assists,
      }));

    try {
      await updateMatch(match.id, {
        matchDate: date,
        opponent: opponent.trim(),
        ourScore,
        oppScore,
        pkOur: ourScore === oppScore ? pkOur : null,
        pkOpp: ourScore === oppScore ? pkOpp : null,
        stage,
        notes: notes.trim(),
        performances: perfRows,
      });
      setMsg({ ok: true, text: '比賽已更新！' });
      onSaved();
      onClose();
    } catch (e) {
      setMsg({
        ok: false,
        text: e instanceof Error ? e.message : '更新失敗',
      });
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30';

  return (
    /* Full-screen on mobile, centred modal on sm+ */
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col sm:items-center sm:justify-center sm:bg-black/60 sm:backdrop-blur-sm">
      <div className="flex flex-col w-full h-full bg-slate-800 sm:h-auto sm:max-h-[90dvh] sm:max-w-sm sm:rounded-2xl sm:border sm:border-slate-700 sm:shadow-2xl">

        {/* Fixed header */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-700/50">
          <div className="text-white font-semibold text-base">編輯比賽</div>
          <button
            onClick={onClose}
            className="text-slate-400 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body — ALL form fields + player list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-4 pb-3 space-y-4">
            {tournament && (
              <div className="text-emerald-400 text-xs font-semibold">
                {tournament.name}
                {tournament.location ? ` · ${tournament.location}` : ''}
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                比賽日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                階段
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {STAGE_LIST.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStage(s)}
                    className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                      stage === s
                        ? 'bg-sky-500 text-slate-900 border-sky-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {stageLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                對手
              </label>
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                比分
              </label>
              <div className="flex items-center gap-3">
                <ScoreBox
                  label="富譽小將"
                  value={ourScore}
                  onDec={() => setOurScore((v) => Math.max(0, v - 1))}
                  onInc={() => setOurScore((v) => v + 1)}
                  accent="emerald"
                />
                <span className="text-slate-500 font-bold">:</span>
                <ScoreBox
                  label="對手"
                  value={oppScore}
                  onDec={() => setOppScore((v) => Math.max(0, v - 1))}
                  onInc={() => setOppScore((v) => v + 1)}
                  accent="slate"
                />
              </div>
              {ourScore === oppScore && (
                <div className="mt-3">
                  <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                    PK大戰比數
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-xl bg-slate-900 border border-slate-700 p-2">
                      <div className="text-[11px] text-center mb-1 text-emerald-400">我方</div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPkOur((v) => Math.max(0, (v ?? 0) - 1))}
                          className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center active:scale-90 transition-transform"
                        >−</button>
                        <span className="text-xl font-bold w-6 text-center tabular-nums text-white">{pkOur ?? 0}</span>
                        <button
                          onClick={() => setPkOur((v) => (v ?? 0) + 1)}
                          className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center active:scale-90 transition-transform"
                        >+</button>
                      </div>
                    </div>
                    <span className="text-slate-500 text-sm font-bold">vs</span>
                    <div className="flex-1 rounded-xl bg-slate-900 border border-slate-700 p-2">
                      <div className="text-[11px] text-center mb-1 text-slate-400">對手</div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPkOpp((v) => Math.max(0, (v ?? 0) - 1))}
                          className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center active:scale-90 transition-transform"
                        >−</button>
                        <span className="text-xl font-bold w-6 text-center tabular-nums text-slate-300">{pkOpp ?? 0}</span>
                        <button
                          onClick={() => setPkOpp((v) => (v ?? 0) + 1)}
                          className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center active:scale-90 transition-transform"
                        >+</button>
                      </div>
                    </div>
                  </div>
                  {pkOur != null && pkOpp != null && pkOur === pkOpp && (
                    <p className="text-amber-400/70 text-[11px] mt-1.5 text-center">PK 比數相同請重新輸入，PK 必須分出勝負</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-0.5">
              <Footprints size={16} className="text-sky-400" /> 上場球員
            </div>
            <div className="text-slate-500 text-xs">
              {tournament
                ? '僅列出此盃賽有出席的球員'
                : '勾選該場比賽有實際上場的球員'}
            </div>
          </div>

          <div className="px-5 pb-4 space-y-2">
            {attendedIds != null && eligiblePlayers.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">
                此盃賽尚無出席球員，請到盃賽編輯器勾選出席球員。
              </p>
            ) : (
              eligiblePlayers.map((p) => {
                const pf = perfs[p.id];
                const played = pf?.played;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      played
                        ? 'bg-sky-500/10 border-sky-500/40'
                        : 'bg-slate-900/50 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {p.jersey_number != null && (
                          <span
                            className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              played
                                ? 'bg-sky-500 text-slate-900'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            #{p.jersey_number}
                          </span>
                        )}
                        <span
                          className={`text-sm font-medium truncate ${
                            played ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {p.jersey_name?.trim() ?? p.name}
                        </span>
                        {p.jersey_name?.trim() && p.jersey_name.trim() !== p.name && (
                          <span className="text-slate-500 text-xs truncate">
                            ({p.name})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => togglePlayed(p.id)}
                        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                          played ? 'bg-sky-500' : 'bg-slate-600'
                        }`}
                        aria-label="切換上場"
                      >
                        <span
                          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                            played ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    {played && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Counter
                          label="進球"
                          value={pf.goals}
                          onDec={() => bump(p.id, 'goals', -1)}
                          onInc={() => bump(p.id, 'goals', 1)}
                          accent="emerald"
                        />
                        <Counter
                          label="助攻"
                          value={pf.assists}
                          onDec={() => bump(p.id, 'assists', -1)}
                          onInc={() => bump(p.id, 'assists', 1)}
                          accent="sky"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-5 pb-5 pt-1">
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">
              備註
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="可填寫比賽相關備註，例如天氣、裁判、特殊事件等"
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>
        </div>

        {/* Fixed footer */}
        {msg && (
          <div
            className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm mx-5 mb-2 ${
              msg.ok
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {msg.ok ? <Check size={16} /> : <X size={16} />}
            {msg.text}
          </div>
        )}
        <div className="shrink-0 flex gap-2 px-5 py-4 border-t border-slate-700/50">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3.5 rounded-2xl bg-slate-700 text-slate-200 font-medium text-sm active:scale-95 transition-transform"
          >
            取消
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 儲存中…
              </>
            ) : (
              '儲存變更'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  onDec,
  onInc,
  accent,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  accent: 'emerald' | 'slate';
}) {
  return (
    <div className="flex-1 rounded-xl bg-slate-900 border border-slate-700 p-2">
      <div
        className={`text-[11px] text-center mb-1 ${
          accent === 'emerald' ? 'text-emerald-400' : 'text-slate-400'
        }`}
      >
        {label}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onDec}
          className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <Minus size={16} />
        </button>
        <span
          className={`text-2xl font-bold w-8 text-center tabular-nums ${
            accent === 'emerald' ? 'text-white' : 'text-slate-300'
          }`}
        >
          {value}
        </span>
        <button
          onClick={onInc}
          className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-90 transition-transform ${
            accent === 'emerald'
              ? 'bg-emerald-500 text-slate-900'
              : 'bg-slate-600 text-white'
          }`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function Counter({
  label,
  value,
  onDec,
  onInc,
  accent,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  accent: 'emerald' | 'sky';
}) {
  const incCls =
    accent === 'emerald'
      ? 'bg-emerald-500/20 text-emerald-400 active:bg-emerald-500/30'
      : 'bg-sky-500/20 text-sky-400 active:bg-sky-500/30';
  return (
    <div className="rounded-lg bg-slate-900/40 px-2 py-1.5">
      <div className="text-slate-400 text-[10px] mb-1 text-center">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onDec}
          className="w-7 h-7 rounded-md bg-slate-700 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <Minus size={14} />
        </button>
        <span className="text-base font-bold text-white w-5 text-center tabular-nums">
          {value}
        </span>
        <button
          onClick={onInc}
          className={`w-7 h-7 rounded-md flex items-center justify-center active:scale-90 transition-transform ${incCls}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
