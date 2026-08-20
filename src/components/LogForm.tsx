import { useState } from 'react';
import { Check, Loader2, Minus, Plus, X, Footprints, Sun, Cloud, CloudRain, CloudDrizzle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Player, Tournament, Team, KitChoice, WeatherChoice } from '@/lib/types';
import { STAGES as STAGE_LIST, stageLabel, KIT_LABELS, WEATHER_LABELS } from '@/lib/types';
import { PlayerName } from '@/components/PlayerName';

type Perf = {
  playerId: string;
  played: boolean;
  goals: number;
  assists: number;
};

export function LogForm({
  players,
  teamId,
  teams,
  tournaments,
  onSaved,
}: {
  players: Player[];
  teamId: string | null;
  teams: Team[];
  tournaments: Tournament[];
  onSaved: () => void;
}) {
  const team = teams.find((t) => t.id === teamId);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [tournamentId, setTournamentId] = useState('');
  const [newTournamentName, setNewTournamentName] = useState('');
  const [newTournamentLocation, setNewTournamentLocation] = useState('');
  const [stage, setStage] = useState<number>(0);
  const [opponent, setOpponent] = useState('');
  const [ourScore, setOurScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [pkOur, setPkOur] = useState<number | null>(null);
  const [pkOpp, setPkOpp] = useState<number | null>(null);
  const [kit, setKit] = useState<KitChoice>('home');
  const [weather, setWeather] = useState<WeatherChoice | null>(null);
  const [perfs, setPerfs] = useState<Record<string, Perf>>(() => {
    const init: Record<string, Perf> = {};
    for (const p of players)
      init[p.id] = { playerId: p.id, played: false, goals: 0, assists: 0 };
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedTournament = tournaments.find((t) => t.id === tournamentId) ?? null;

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
    if (!teamId) {
      setMsg({ ok: false, text: '尚未選擇球隊' });
      return;
    }
    setSaving(true);

    let tId = tournamentId || null;
    let tName = '';
    let tLocation = '';

    if (newTournamentName.trim()) {
      const { data: tRow, error: tErr } = await supabase
        .from('tournaments')
        .insert({
          name: newTournamentName.trim(),
          team_id: teamId,
          start_date: date,
          location: newTournamentLocation.trim() || null,
        })
        .select()
        .single();
      if (tErr || !tRow) {
        setSaving(false);
        setMsg({ ok: false, text: '建立盃賽失敗：' + (tErr?.message ?? '未知錯誤') });
        return;
      }
      tId = tRow.id;
      tName = tRow.name;
      tLocation = tRow.location ?? '';
    } else if (tId) {
      const t = tournaments.find((t) => t.id === tId);
      tName = t?.name ?? '';
      tLocation = t?.location ?? '';
    }

    if (!tName) {
      setSaving(false);
      setMsg({ ok: false, text: '請選擇或建立盃賽' });
      return;
    }

    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        match_date: date,
        tournament: tName,
        tournament_id: tId,
        stage,
        location: tLocation,
        opponent: opponent.trim(),
        our_score: ourScore,
        opp_score: oppScore,
        pk_our: ourScore === oppScore ? pkOur : null,
        pk_opp: ourScore === oppScore ? pkOpp : null,
        kit,
        weather,
        team_id: teamId,
      })
      .select()
      .single();

    if (error || !match) {
      setSaving(false);
      setMsg({ ok: false, text: '儲存失敗：' + (error?.message ?? '未知錯誤') });
      return;
    }

    const playedPlayers = players.filter((p) => perfs[p.id]?.played);
    if (playedPlayers.length > 0) {
      const perfRows = playedPlayers.map((p) => {
        const pf = perfs[p.id];
        return {
          match_id: match.id,
          player_id: p.id,
          attended: true,
          played: true,
          goals: pf.goals,
          assists: pf.assists,
        };
      });
      const { error: pErr } = await supabase
        .from('match_performances')
        .insert(perfRows);
      if (pErr) {
        setSaving(false);
        setMsg({ ok: false, text: '球員表現儲存失敗：' + pErr.message });
        return;
      }
    }

    if (tId) {
      const playedIds = playedPlayers.map((p) => p.id);
      if (playedIds.length > 0) {
        await supabase
          .from('tournament_attendances')
          .upsert(
            playedIds.map((pid) => ({
              tournament_id: tId,
              player_id: pid,
              attended: true,
            })),
            { onConflict: 'tournament_id,player_id' }
          );
      }
    }

    setSaving(false);
    setMsg({ ok: true, text: '比賽結果已登錄！' });
    setOpponent('');
    setOurScore(0);
    setOppScore(0);
    setPkOur(null);
    setPkOpp(null);
    setKit('home');
    setWeather(null);
    setStage(0);
    const reset: Record<string, Perf> = {};
    for (const p of players)
      reset[p.id] = { playerId: p.id, played: false, goals: 0, assists: 0 };
    setPerfs(reset);
    onSaved();
  }

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30';

  return (
    <div className="space-y-5">
      <div className="space-y-3">
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
            盃賽
          </label>
          {tournaments.length > 0 && (
            <select
              value={tournamentId}
              onChange={(e) => {
                setTournamentId(e.target.value);
                setNewTournamentName('');
              }}
              className={inputCls}
            >
              <option value="">— 選擇現有盃賽 —</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <input
            value={newTournamentName}
            onChange={(e) => {
              setNewTournamentName(e.target.value);
              if (e.target.value) setTournamentId('');
            }}
            placeholder={tournaments.length ? '或輸入新盃賽名稱' : '輸入盃賽名稱'}
            className={tournaments.length ? `${inputCls} mt-2` : inputCls}
          />
          {newTournamentName.trim() && (
            <input
              value={newTournamentLocation}
              onChange={(e) => setNewTournamentLocation(e.target.value)}
              placeholder="盃賽地點（例如：百齡橋下球場）"
              className={`${inputCls} mt-2`}
            />
          )}
          {selectedTournament?.location && (
            <div className="text-slate-500 text-xs mt-1.5">
              地點：{selectedTournament.location}
            </div>
          )}
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
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {stageLabel(s)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">球衣</label>
          <div className="flex gap-2">
            {(['home', 'away'] as KitChoice[]).map((k) => (
              <button
                key={k}
                onClick={() => setKit(k)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  kit === k
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-slate-500/40"
                  style={{ backgroundColor: k === 'home' ? team?.home_kit_color : team?.away_kit_color }}
                />
                {KIT_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">天氣</label>
          <div className="flex gap-2">
            {(['sunny', 'cloudy', 'overcast', 'rainy'] as WeatherChoice[]).map((w) => {
              const icons: Record<WeatherChoice, typeof Sun> = { sunny: Sun, cloudy: Cloud, overcast: CloudDrizzle, rainy: CloudRain };
              const Icon = icons[w];
              return (
                <button
                  key={w}
                  onClick={() => setWeather(weather === w ? null : w)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    weather === w
                      ? 'bg-sky-500/15 border-sky-500/40 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Icon size={14} />
                  {WEATHER_LABELS[w]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">
            對手
          </label>
          <input
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="例如：LS紅虎"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">
            比分
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-slate-800 border border-slate-700 p-2">
              <div className="text-emerald-400 text-[11px] text-center mb-1">
                富譽小將
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setOurScore((v) => Math.max(0, v - 1))}
                  className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-bold text-white w-8 text-center tabular-nums">
                  {ourScore}
                </span>
                <button
                  onClick={() => setOurScore((v) => v + 1)}
                  className="w-9 h-9 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <span className="text-slate-500 font-bold">:</span>
            <div className="flex-1 rounded-xl bg-slate-800 border border-slate-700 p-2">
              <div className="text-slate-400 text-[11px] text-center mb-1">
                對手
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setOppScore((v) => Math.max(0, v - 1))}
                  className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-bold text-slate-300 w-8 text-center tabular-nums">
                  {oppScore}
                </span>
                <button
                  onClick={() => setOppScore((v) => v + 1)}
                  className="w-9 h-9 rounded-lg bg-slate-600 text-white flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          {ourScore === oppScore && (
            <div>
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

      <div>
        <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-1">
          <Footprints size={16} className="text-sky-400" /> 上場球員
        </div>
        <div className="text-slate-500 text-xs mb-3">
          勾選該場比賽有實際上場的球員，並記錄進球與助攻
        </div>
        {players.length === 0 ? (
          <p className="text-slate-500 text-xs">
            尚無球員名單，請到「球員管理」新增球員。
          </p>
        ) : (
          <div className="space-y-2">
            {players.map((p) => {
              const pf = perfs[p.id];
              const played = pf?.played;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    played
                      ? 'bg-sky-500/10 border-sky-500/40'
                      : 'bg-slate-800/50 border-slate-700/50'
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
            })}
          </div>
        )}
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm ${
            msg.ok
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
          }`}
        >
          {msg.ok ? <Check size={16} /> : <X size={16} />}
          {msg.text}
        </div>
      )}

      <button
        onClick={submit}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" /> 儲存中…
          </>
        ) : (
          '登錄比賽結果'
        )}
      </button>
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
