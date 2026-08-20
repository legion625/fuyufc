import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Player, PlayerMembership, Team } from '@/lib/types';
import { KIT_COLOR_PRESETS } from '@/lib/types';
import { PlayerName } from '@/components/PlayerName';

export function TeamsView({
  teams,
  players,
  onReloadTeams,
  onReloadPlayers,
  onAdminOpen,
}: {
  teams: Team[];
  players: Player[];
  onReloadTeams: () => void;
  onReloadPlayers: () => void;
  onAdminOpen: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamSlug, setTeamSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [memCounts, setMemCounts] = useState<Record<string, number>>({});
  const [renameTarget, setRenameTarget] = useState<Team | null>(null);

  useEffect(() => {
    async function loadCounts() {
      const { data } = await supabase
        .from('player_team_memberships')
        .select('team_id')
        .eq('active', true);
      const counts: Record<string, number> = {};
      for (const r of data ?? []) {
        counts[r.team_id] = (counts[r.team_id] ?? 0) + 1;
      }
      setMemCounts(counts);
    }
    loadCounts();
  }, [players, teams]);

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSaving(true);
    setErr(null);
    const slug =
      teamSlug.trim() ||
      teamName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      const { error } = await supabase
        .from('teams')
        .insert({ name: teamName.trim(), slug: slug || crypto.randomUUID().slice(0, 8) });
      if (error) throw error;
      setTeamName('');
      setTeamSlug('');
      setShowForm(false);
      onReloadTeams();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '建立失敗');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeam(team: Team) {
    if (
      !confirm(
        `確定刪除球隊「${team.name}」？此球隊的球員關聯會一併移除，但球員資料和比賽紀錄不受影響。`
      )
    )
      return;
    const { error } = await supabase.from('teams').delete().eq('id', team.id);
    if (error) {
      alert('刪除失敗：' + error.message);
      return;
    }
    onReloadTeams();
    onReloadPlayers();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-400 text-xs">共 {teams.length} 支球隊</div>
        <div className="flex gap-2">
          <button
            onClick={onAdminOpen}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 bg-slate-700/60 border border-slate-600/60 rounded-xl px-3 py-2 active:scale-95 transition-transform"
          >
            <Settings size={16} /> 管理設定
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 active:scale-95 transition-transform"
          >
            <Plus size={16} /> 新增球隊
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={createTeam}
          className="rounded-2xl bg-slate-800 border border-slate-700 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">新增球隊</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 text-xs"
            >
              取消
            </button>
          </div>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="球隊名稱（例如：富譽小將 U10）"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <input
            value={teamSlug}
            onChange={(e) => setTeamSlug(e.target.value)}
            placeholder="代碼（選填，例如：u10）"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500"
          />
          {err && <div className="text-rose-400 text-xs">{err}</div>}
          <button
            type="submit"
            disabled={saving || !teamName.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            建立球隊
          </button>
        </form>
      )}

      {teams.length === 0 && !showForm ? (
        <div className="text-center text-slate-500 text-sm py-16">
          <Shield size={32} className="mx-auto mb-3 text-slate-600" />
          尚無球隊
          <div className="mt-1 text-xs">點上方「新增球隊」開始建立</div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              playerCount={memCounts[team.id] ?? 0}
              players={players}
              expanded={expandedTeam === team.id}
              onToggle={() =>
                setExpandedTeam((prev) => (prev === team.id ? null : team.id))
              }
              onReloadPlayers={onReloadPlayers}
              onReloadTeams={onReloadTeams}
              onDelete={() => deleteTeam(team)}
              onRename={() => setRenameTarget(team)}
            />
          ))}
        </div>
      )}

      {renameTarget && (
        <RenameTeamModal
          team={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRenamed={() => {
            setRenameTarget(null);
            onReloadTeams();
          }}
        />
      )}
    </div>
  );
}

function TeamCard({
  team,
  playerCount,
  players,
  expanded,
  onToggle,
  onReloadPlayers,
  onReloadTeams,
  onDelete,
  onRename,
}: {
  team: Team;
  playerCount: number;
  players: Player[];
  expanded: boolean;
  onToggle: () => void;
  onReloadPlayers: () => void;
  onReloadTeams: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const [mems, setMems] = useState<PlayerMembership[]>([]);
  const [loadingMems, setLoadingMems] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setLoadingMems(true);
    supabase
      .from('player_team_memberships')
      .select('id, player_id, team_id, active')
      .eq('team_id', team.id)
      .then(({ data }) => {
        setMems((data ?? []) as PlayerMembership[]);
        setLoadingMems(false);
      });
  }, [expanded, team.id]);

  const memberIds = new Set(mems.filter((m) => m.active).map((m) => m.player_id));
  const inactiveMems = mems.filter((m) => !m.active);
  const inactiveIds = new Set(inactiveMems.map((m) => m.player_id));

  async function toggleMembership(player: Player) {
    const existing = mems.find((m) => m.player_id === player.id);
    if (!existing) {
      const { data, error } = await supabase
        .from('player_team_memberships')
        .insert({ player_id: player.id, team_id: team.id, active: true })
        .select('id, player_id, team_id, active')
        .single();
      if (error) {
        alert('加入失敗：' + error.message);
        return;
      }
      setMems((prev) => [...prev, data as PlayerMembership]);
    } else if (existing.active) {
      const { error } = await supabase
        .from('player_team_memberships')
        .update({ active: false })
        .eq('id', existing.id);
      if (error) {
        alert('更新失敗：' + error.message);
        return;
      }
      setMems((prev) =>
        prev.map((m) => (m.id === existing.id ? { ...m, active: false } : m))
      );
    } else {
      const { error } = await supabase
        .from('player_team_memberships')
        .delete()
        .eq('id', existing.id);
      if (error) {
        alert('移除失敗：' + error.message);
        return;
      }
      setMems((prev) => prev.filter((m) => m.id !== existing.id));
    }
    onReloadPlayers();
  }

  return (
    <>
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden">
      <div className="flex items-stretch">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 min-w-0 p-4 text-left"
        >
          <span className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <Shield size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm truncate">{team.name}</span>
              <span className="flex items-center gap-1 shrink-0">
                <span
                  className="w-3 h-3 rounded-full border border-slate-500/40"
                  style={{ backgroundColor: team.home_kit_color }}
                  title="主場球衣"
                />
                <span
                  className="w-3 h-3 rounded-full border border-slate-500/40"
                  style={{ backgroundColor: team.away_kit_color }}
                  title="客場球衣"
                />
              </span>
            </div>
            <div className="text-slate-500 text-xs">
              {team.slug && <span className="text-sky-500/70 font-mono mr-1">{team.slug}</span>}
              {playerCount} 位球員
              {inactiveMems.length > 0 && ` · ${inactiveMems.length} 位已離隊`}
            </div>
          </div>
        </button>
        <button
          onClick={onRename}
          className="flex items-center justify-center px-2.5 text-slate-400 shrink-0 active:scale-90 transition-transform"
          aria-label="改名"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onToggle}
          className="flex items-center justify-center px-3 text-slate-500 shrink-0 active:scale-90 transition-transform"
        >
          <ChevronDown
            size={18}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {loadingMems ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-slate-500" size={18} />
            </div>
          ) : (
            <>
              <div className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                <Users size={13} /> 球員名單
              </div>
              <div className="space-y-1.5">
                {players.map((p) => {
                  const isMember = memberIds.has(p.id);
                  const isInactive = inactiveIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleMembership(p)}
                      className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        isMember
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : isInactive
                            ? 'bg-slate-700/30 border-slate-600/40'
                            : 'bg-slate-900/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <PlayerName
                          player={p}
                          variant="admin"
                          className={`${
                            isMember
                              ? 'text-white'
                              : isInactive
                                ? 'text-slate-500 line-through'
                                : 'text-slate-300'
                          }`}
                        />
                      </div>
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
              <div className="flex justify-end pt-1">
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-xs text-rose-400/70 px-2 py-1.5 active:scale-95 transition-transform"
                >
                  <Trash2 size={13} /> 刪除球隊
                </button>
              </div>
            </>
          )}
        </div>
      )}

    </div>

    </>
  );
}

function KitColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <label className="block text-slate-400 text-xs mb-1.5 font-medium">{label}</label>
      <div className="flex items-center gap-2 flex-wrap">
        {KIT_COLOR_PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${
              value.toLowerCase() === c.toLowerCase()
                ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                : 'border-slate-600'
            }`}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-full border-2 border-slate-600 bg-transparent cursor-pointer p-0"
          aria-label="自訂顏色"
        />
      </div>
    </div>
  );
}

function RenameTeamModal({
  team,
  onClose,
  onRenamed,
}: {
  team: Team;
  onClose: () => void;
  onRenamed: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [slug, setSlug] = useState(team.slug ?? '');
  const [homeColor, setHomeColor] = useState(team.home_kit_color ?? '#1e40af');
  const [awayColor, setAwayColor] = useState(team.away_kit_color ?? '#ffffff');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    setErr(null);
    const updates: { name: string; slug?: string; home_kit_color?: string; away_kit_color?: string } = { name: name.trim() };
    const trimmedSlug = slug.trim().replace(/\s+/g, '-');
    if (trimmedSlug) updates.slug = trimmedSlug;
    updates.home_kit_color = homeColor;
    updates.away_kit_color = awayColor;
    const { error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', team.id);
    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }
    onRenamed();
  }

  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-slate-800 sm:rounded-2xl sm:border sm:border-slate-700 rounded-t-2xl border-t border-slate-700 p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-semibold text-base">編輯球隊</h3>
          <button onClick={onClose} className="text-slate-400 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">球隊名稱</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：富譽小將 U10"
            className={inputCls}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">代碼</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="例如：u10"
            className={inputCls}
          />
        </div>
        <KitColorPicker label="主場球衣" value={homeColor} onChange={setHomeColor} />
        <KitColorPicker label="客場球衣" value={awayColor} onChange={setAwayColor} />
        {err && <div className="text-rose-400 text-xs">{err}</div>}
        <button
          onClick={submit}
          disabled={saving || !name.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          儲存
        </button>
      </div>
    </div>
  );
}
