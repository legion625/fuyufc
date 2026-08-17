import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Pencil, Plus, Shield, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Player, Team } from '@/lib/types';

export function PlayerManagement({
  players,
  loading,
  error,
  onReload,
  teams,
}: {
  players: Player[];
  loading: boolean;
  error: string | null;
  onReload: () => void;
  teams: Team[];
}) {
  const [editing, setEditing] = useState<Player | null>(null);
  const [adding, setAdding] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  const filteredPlayers = useMemo(() => {
    if (selectedTeams.size === 0) return players;
    return players.filter(
      (p) =>
        p.memberships?.some(
          (m) => m.active && selectedTeams.has(m.team_id)
        )
    );
  }, [players, selectedTeams]);

  const filterLabel =
    selectedTeams.size === 0
      ? '全部球隊'
      : selectedTeams.size === 1
        ? teams.find((t) => selectedTeams.has(t.id))?.name ?? '1 支球隊'
        : `${selectedTeams.size} 支球隊`;

  function toggleFilterTeam(id: string) {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="relative flex-1">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-white text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            <span className="truncate flex items-center gap-1.5">
              <Shield size={14} className="text-sky-400" />
              {filterLabel}
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {filterOpen && teams.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden z-20">
              <button
                onClick={() => {
                  setSelectedTeams(new Set());
                  setFilterOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-sm active:bg-slate-700 transition-colors ${
                  selectedTeams.size === 0 ? 'text-emerald-400 font-semibold' : 'text-slate-200'
                }`}
              >
                全部球隊
              </button>
              {teams.map((t) => {
                const on = selectedTeams.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleFilterTeam(t.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm active:bg-slate-700 transition-colors ${
                      on ? 'text-emerald-400 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    {t.name}
                    {on && <Check size={15} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5 active:scale-95 transition-transform shrink-0"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      <div className="text-slate-400 text-xs mb-3">
        共 {filteredPlayers.length} 位球員
      </div>

      {filteredPlayers.length === 0 ? (
        <div className="text-center text-slate-500 text-sm py-16">
          {players.length === 0 ? '尚無球員名單' : '沒有符合篩選條件的球員'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPlayers.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                {p.jersey_number != null ? (
                  <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0">
                    {p.jersey_number}
                  </span>
                ) : (
                  <span className="w-9 h-9 rounded-xl bg-slate-700 text-slate-500 font-bold text-sm flex items-center justify-center shrink-0">
                    —
                  </span>
                )}
                <div className="min-w-0">
                  <span className="text-white font-bold text-sm truncate block">
                    {p.name}
                  </span>
                  {(p.jersey_number != null || (p.jersey_name?.trim() && p.jersey_name.trim() !== p.name)) && (
                    <span className="text-slate-500 text-xs">
                      {p.jersey_number != null && `#${p.jersey_number}`}
                      {p.jersey_number != null && p.jersey_name?.trim() && p.jersey_name.trim() !== p.name && ' '}
                      {p.jersey_name?.trim() && p.jersey_name.trim() !== p.name && `(${p.jersey_name.trim()})`}
                    </span>
                  )}
                  {p.memberships && p.memberships.filter((m) => m.active).length > 0 && (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {p.memberships
                        .filter((m) => m.active)
                        .map((m) => {
                          const team = teams.find((t) => t.id === m.team_id);
                          return team ? (
                            <span
                              key={m.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 font-medium font-mono"
                            >
                              {team.slug || team.name}
                            </span>
                          ) : null;
                        })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setEditing(p)}
                  className="text-slate-400 active:scale-90 transition-transform p-2"
                  aria-label="編輯"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(p, onReload)}
                  className="text-rose-400/60 active:scale-90 transition-transform p-2"
                  aria-label="刪除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <PlayerEditModal
          player={null}
          teams={teams}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            onReload();
          }}
        />
      )}
      {editing && (
        <PlayerEditModal
          player={editing}
          teams={teams}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onReload();
          }}
        />
      )}
    </div>
  );
}

async function handleDelete(p: Player, onReload: () => void) {
  if (!confirm(`確定刪除球員「${p.name}」？相關的比賽表現紀錄也會一併刪除。`)) return;
  const { error } = await supabase.from('players').delete().eq('id', p.id);
  if (error) {
    alert('刪除失敗：' + error.message);
    return;
  }
  onReload();
}

function PlayerEditModal({
  player,
  teams,
  onClose,
  onSaved,
}: {
  player: Player | null;
  teams: Team[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(player?.name ?? '');
  const [jerseyName, setJerseyName] = useState<string>(player?.jersey_name ?? '');
  const [jersey, setJersey] = useState<string>(
    player?.jersey_number != null ? String(player.jersey_number) : ''
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mems, setMems] = useState<Record<string, boolean>>({});
  const [memsLoaded, setMemsLoaded] = useState(!player);

  useEffect(() => {
    if (!player) return;
    supabase
      .from('player_team_memberships')
      .select('team_id, active, status')
      .eq('player_id', player.id)
      .then(({ data }) => {
        const m: Record<string, boolean> = {};
        for (const r of (data ?? []) as { team_id: string; active: boolean; status?: string }[]) {
          m[r.team_id] = r.active;
        }
        setMems(m);
        setMemsLoaded(true);
      });
  }, [player]);

  function toggleTeam(teamId: string) {
    setMems((prev) => {
      const cur = prev[teamId];
      if (cur === undefined) return { ...prev, [teamId]: true };
      if (cur === true) return { ...prev, [teamId]: false };
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
  }

  async function saveMemberships(playerId: string) {
    const { data: existing } = await supabase
      .from('player_team_memberships')
      .select('id, team_id')
      .eq('player_id', playerId);
    const existingMap = new Map((existing ?? []).map((r) => [r.team_id, r.id]));

    const toInsert: { player_id: string; team_id: string; active: boolean }[] = [];
    const updates: { id: string; active: boolean }[] = [];
    const deletes: string[] = [];

    for (const [teamId, active] of Object.entries(mems)) {
      const exId = existingMap.get(teamId);
      if (!exId) {
        toInsert.push({ player_id: playerId, team_id: teamId, active });
      } else {
        updates.push({ id: exId, active });
      }
    }
    for (const [teamId, exId] of existingMap) {
      if (!(teamId in mems)) deletes.push(exId);
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('player_team_memberships').insert(toInsert);
      if (error) throw error;
    }
    for (const u of updates) {
      const { error } = await supabase
        .from('player_team_memberships')
        .update({ active: u.active })
        .eq('id', u.id);
      if (error) throw error;
    }
    if (deletes.length > 0) {
      const { error } = await supabase
        .from('player_team_memberships')
        .delete()
        .in('id', deletes);
      if (error) throw error;
    }
  }

  async function submit() {
    setMsg(null);
    if (!name.trim()) {
      setMsg({ ok: false, text: '請填寫球員姓名' });
      return;
    }
    setSaving(true);
    const jerseyNum = jersey.trim() ? parseInt(jersey, 10) : null;
    if (jersey.trim() && (isNaN(jerseyNum!) || jerseyNum! < 0)) {
      setMsg({ ok: false, text: '背號需為正整數' });
      setSaving(false);
      return;
    }

    try {
      let playerId = player?.id;
      const jn = jerseyName.trim() || null;
      if (player) {
        const { error } = await supabase
          .from('players')
          .update({ name: name.trim(), jersey_number: jerseyNum, jersey_name: jn })
          .eq('id', player.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('players')
          .insert({ name: name.trim(), jersey_number: jerseyNum, jersey_name: jn })
          .select('id')
          .single();
        if (error) throw error;
        playerId = data.id;
      }
      if (playerId) await saveMemberships(playerId);
      onSaved();
    } catch (e) {
      setMsg({
        ok: false,
        text: e instanceof Error ? e.message : '儲存失敗',
      });
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
          <div className="text-white font-semibold text-base">
            {player ? '編輯球員' : '新增球員'}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">
              球員姓名
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：陳小明"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">
              球衣名字（選填）
            </label>
            <input
              value={jerseyName}
              onChange={(e) => setJerseyName(e.target.value)}
              placeholder="例如：Ming"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">
              背號（選填）
            </label>
            <input
              type="number"
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              placeholder="例如：10"
              className={inputCls}
            />
          </div>

          {player && (
            <div>
              <div className="flex items-center gap-1.5 text-slate-300 text-sm font-semibold mb-1">
                <Shield size={14} className="text-sky-400" /> 所屬球隊
              </div>
              <div className="text-slate-500 text-xs mb-2">
                點按切換：在隊 → 離隊（保留紀錄）→ 移除
              </div>
              {!memsLoaded ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="animate-spin text-slate-500" size={16} />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {teams.map((t) => {
                    const state = mems[t.id];
                    const isMember = state === true;
                    const isInactive = state === false;
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTeam(t.id)}
                        className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                          isMember
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : isInactive
                              ? 'bg-slate-700/30 border-slate-600/40'
                              : 'bg-slate-900/50 border-slate-700/50'
                        }`}
                      >
                        <span
                          className={`text-sm truncate ${
                            isMember
                              ? 'text-white'
                              : isInactive
                                ? 'text-slate-500 line-through'
                                : 'text-slate-300'
                          }`}
                        >
                          {t.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                            isMember
                              ? 'bg-emerald-500 text-slate-900'
                              : isInactive
                                ? 'bg-slate-600 text-slate-400'
                                : 'bg-slate-700 text-slate-500'
                          }`}
                        >
                          {isMember ? '在隊' : isInactive ? '離隊' : '未加入'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
        </div>

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
              '儲存'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
