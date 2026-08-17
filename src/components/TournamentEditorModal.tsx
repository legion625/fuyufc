import { useEffect, useState } from 'react';
import { Check, Loader2, Lock, Unlock, Trash2, X, Share2, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  updateTournament,
  setTournamentAttendance,
  setTournamentFrozen,
  deleteTournament,
  changeTournamentTeam,
} from '@/lib/teamAuth';
import type { Player, Team, Tournament } from '@/lib/types';
import { rankLabel, RANK_OPTIONS, RANK_LABELS } from '@/lib/types';
import { PlayerName } from '@/components/PlayerName';

type Att = { playerId: string; attended: boolean };

export function TournamentEditorModal({
  tournament,
  players,
  teams,
  onClose,
  onSaved,
}: {
  tournament: Tournament;
  players: Player[];
  teams: Team[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tournament.name);
  const [startDate, setStartDate] = useState(tournament.start_date ?? '');
  const [endDate, setEndDate] = useState(tournament.end_date ?? '');
  const [location, setLocation] = useState(tournament.location ?? '');
  const [rank, setRank] = useState<number | null>(tournament.final_rank);
  const teamPlayers = players.filter(
    (p) => p.memberships?.some((m) => m.team_id === tournament.team_id && m.active) ?? false
  );
  const teamPlayerIds = new Set(teamPlayers.map((p) => p.id));
  // Players who have existing attendance records but may no longer be on the team
  const [extraPlayerIds, setExtraPlayerIds] = useState<Set<string>>(new Set());
  // Display list: current team players + players with existing attendance records
  const displayPlayers = players.filter(
    (p) => teamPlayerIds.has(p.id) || extraPlayerIds.has(p.id)
  );
  const [atts, setAtts] = useState<Record<string, Att>>(() => {
    const init: Record<string, Att> = {};
    for (const p of teamPlayers) {
      init[p.id] = { playerId: p.id, attended: false };
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [newTeamId, setNewTeamId] = useState(tournament.team_id);
  const [changingTeam, setChangingTeam] = useState(false);

  useEffect(() => {
    async function loadAtts() {
      const { data } = await supabase
        .from('tournament_attendances')
        .select('player_id, attended')
        .eq('tournament_id', tournament.id);
      if (data) {
        // Find players with attendance records who are NOT current team members
        const extraIds = new Set<string>();
        for (const row of data) {
          if (!teamPlayerIds.has(row.player_id)) {
            extraIds.add(row.player_id);
          }
        }
        setExtraPlayerIds(extraIds);
        setAtts((prev) => {
          const next = { ...prev };
          for (const row of data) {
            next[row.player_id] = { playerId: row.player_id, attended: row.attended };
          }
          return next;
        });
      }
    }
    loadAtts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament.id]);

  function toggleAtt(id: string) {
    setAtts((prev) => ({
      ...prev,
      [id]: { ...prev[id], attended: !prev[id].attended },
    }));
  }

  function setAllAtt(value: boolean) {
    setAtts((prev) => {
      const next: Record<string, Att> = {};
      for (const p of displayPlayers) {
        next[p.id] = { playerId: p.id, attended: value };
      }
      return next;
    });
  }

  async function save() {
    setMsg(null);
    if (!name.trim()) {
      setMsg({ ok: false, text: '請填寫盃賽名稱' });
      return;
    }
    setSaving(true);
    try {
      await updateTournament(tournament.id, {
        tournamentName: name.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        location: location.trim() || null,
        finalRank: rank,
      });
      const attRows = displayPlayers
        .map((p) => atts[p.id])
        .filter((a): a is Att => a != null)
        .map((a) => ({ player_id: a.playerId, attended: a.attended }));
      await setTournamentAttendance(tournament.id, attRows);
      setMsg({ ok: true, text: '盃賽已更新！' });
      onSaved();
      onClose();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : '更新失敗' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleFrozen() {
    setMsg(null);
    if (!adminPwd) {
      setMsg({ ok: false, text: '請輸入總管密碼' });
      return;
    }
    setSaving(true);
    try {
      await setTournamentFrozen(tournament.id, !tournament.frozen, adminPwd);
      setMsg({
        ok: true,
        text: tournament.frozen ? '已解鎖！' : '已鎖定！',
      });
      onSaved();
      onClose();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : '操作失敗' });
    } finally {
      setSaving(false);
    }
  }

  async function changeTeam() {
    setMsg(null);
    if (!adminPwd) {
      setMsg({ ok: false, text: '請輸入總管密碼' });
      return;
    }
    if (newTeamId === tournament.team_id) {
      setMsg({ ok: false, text: '請選擇不同的球隊' });
      return;
    }
    setChangingTeam(true);
    setSaving(true);
    try {
      await changeTournamentTeam(tournament.id, newTeamId, adminPwd);
      setMsg({ ok: true, text: '球隊已變更！' });
      onSaved();
      onClose();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : '變更失敗' });
    } finally {
      setChangingTeam(false);
      setSaving(false);
    }
  }

  async function del() {
    setMsg(null);
    if (!adminPwd) {
      setMsg({ ok: false, text: '請輸入總管密碼' });
      return;
    }
    if (!confirm(`確定刪除「${tournament.name}」？所有此盃賽的比賽紀錄也會一併刪除。`)) return;
    setSaving(true);
    try {
      await deleteTournament(tournament.id, adminPwd);
      onSaved();
      onClose();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : '刪除失敗' });
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col sm:items-center sm:justify-center sm:bg-black/60 sm:backdrop-blur-sm">
      <div className="flex flex-col w-full h-full bg-slate-800 sm:h-auto sm:max-h-[90dvh] sm:max-w-sm sm:rounded-2xl sm:border sm:border-slate-700 sm:shadow-2xl">
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-700/50">
          <div className="text-white font-semibold text-base">編輯盃賽</div>
          <button
            onClick={onClose}
            className="text-slate-400 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">

        {tournament.frozen && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-400/10 border border-amber-400/30 px-3.5 py-2.5 text-amber-300 text-xs mb-3">
            <Lock size={14} /> 此盃賽已鎖定，比賽內容無法編輯
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">
              盃賽名稱
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              disabled={tournament.frozen}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                開始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
                disabled={tournament.frozen}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                結束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
                disabled={tournament.frozen}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">
              地點
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例如：百齡橋下球場"
              className={inputCls}
              disabled={tournament.frozen}
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">
              最終名次
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {RANK_OPTIONS.map((r) => (
                <button
                  key={r ?? 'none'}
                  onClick={() => setRank(r)}
                  disabled={tournament.frozen}
                  className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                    rank === r
                      ? 'bg-amber-400 text-slate-900 border-amber-400'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  } ${tournament.frozen ? 'opacity-50' : ''}`}
                >
                  {r == null ? '未定' : RANK_LABELS[r] ?? rankLabel(r)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-300 text-sm font-semibold">出席球員</div>
            {!tournament.frozen && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setAllAtt(true)}
                  className="text-[11px] text-emerald-400 font-medium px-2 py-1 rounded-md bg-emerald-500/10"
                >
                  全選
                </button>
                <button
                  onClick={() => setAllAtt(false)}
                  className="text-[11px] text-slate-400 font-medium px-2 py-1 rounded-md bg-slate-700/40"
                >
                  全清
                </button>
              </div>
            )}
          </div>
          <div className="text-slate-500 text-xs mb-2">
            勾選有出席此盃賽的球員
          </div>
          <div className="space-y-2">
            {displayPlayers.map((p) => {
              const isFormer = !teamPlayerIds.has(p.id);
              const hasMembershipWithTeam = p.memberships?.some(
                (m) => m.team_id === tournament.team_id
              ) ?? false;
              const formerLabel = hasMembershipWithTeam ? '已離隊' : '未加入';
              const a = atts[p.id];
              const on = a?.attended;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    on
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-900/50 border-slate-700/50'
                  } ${tournament.frozen ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <PlayerName
                        player={p}
                        variant="admin"
                        className={`${on ? 'text-white' : 'text-slate-300'} ${tournament.frozen ? 'opacity-80' : ''}`}
                      />
                      {isFormer && (
                        <span className="text-[10px] text-amber-400/80 font-medium shrink-0">
                          {formerLabel}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => !tournament.frozen && toggleAtt(p.id)}
                      disabled={tournament.frozen}
                      className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                        on ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                      aria-label="切換出席"
                    >
                      <span
                        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                          on ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!tournament.frozen && (
          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}#/attendance/${tournament.id}`;
              if (navigator.share) {
                navigator.share({ title: `${tournament.name} — 出席回報`, url }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(url);
                alert(`連結已複製：\n${url}`);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-medium active:scale-95 transition-transform mb-3"
          >
            <Share2 size={14} /> 複製出席回報連結給家長
          </button>
        )}
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-slate-700/50">
        {msg && (
          <div
            className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm mb-3 ${
              msg.ok
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {msg.ok ? <Check size={16} /> : <X size={16} />}
            {msg.text}
          </div>
        )}

        {!tournament.frozen && (
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 儲存中…
              </>
            ) : (
              '儲存盃賽資料'
            )}
          </button>
        )}

        <div className="border-t border-slate-700/50 pt-3">
          <button
            onClick={() => setAdminOpen((v) => !v)}
            className="text-slate-500 text-xs flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Lock size={12} /> 管理者功能（鎖定/解鎖/更換球隊/刪除）
          </button>

          {adminOpen && (
            <div className="mt-2.5 space-y-2">
              <input
                type="password"
                value={adminPwd}
                onChange={(e) => setAdminPwd(e.target.value)}
                placeholder="總管密碼"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-amber-400"
              />
              <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-3 space-y-2">
                <label className="block text-slate-400 text-xs font-medium">
                  所屬球隊
                </label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  disabled={tournament.frozen}
                  className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400 ${tournament.frozen ? 'opacity-50' : ''}`}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={changeTeam}
                  disabled={saving || tournament.frozen || newTeamId === tournament.team_id}
                  className="w-full py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
                >
                  {changingTeam ? (
                    <><Loader2 size={14} className="animate-spin" /> 變更中…</>
                  ) : (
                    <><ArrowRightLeft size={14} /> 更換球隊</>
                  )}
                </button>
                {newTeamId !== tournament.team_id && !tournament.frozen && (
                  <p className="text-[11px] text-amber-400/80">
                    盃賽及其所有比賽紀錄將移轉至所選球隊。未出席且不屬於新球隊的球員，其出席紀錄將被清除。
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleFrozen}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
                >
                  {tournament.frozen ? (
                    <>
                      <Unlock size={14} /> 解鎖
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> 鎖定
                    </>
                  )}
                </button>
                <button
                  onClick={del}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
                >
                  <Trash2 size={14} /> 刪除盃賽
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
