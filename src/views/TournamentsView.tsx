import { useEffect, useState } from 'react';
import { CalendarPlus, CalendarRange, Handshake, Loader2, Lock, MapPin, Medal, Pencil, Plus, Share2, Trophy, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Tournament, Team, CompetitionType } from '@/lib/types';
import { rankLabel, COMPETITION_TYPE_LABELS } from '@/lib/types';

const TYPE_ICONS: Record<CompetitionType, typeof Trophy> = {
  cup: Trophy,
  league: CalendarRange,
  friendly: Handshake,
};

export function TournamentsView({
  tournaments,
  teams,
  loading,
  teamId,
  onEdit,
  onShare,
  onCreate,
}: {
  tournaments: Tournament[];
  teams: Team[];
  loading: boolean;
  teamId: string | null;
  onEdit: (t: Tournament) => void;
  onShare: (t: Tournament) => void;
  onCreate: () => void;
}) {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CompetitionType>('cup');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formTeamId, setFormTeamId] = useState<string | null>(teamId);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [attCounts, setAttCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (tournaments.length === 0) {
      setAttCounts({});
      return;
    }
    const ids = tournaments.map((t) => t.id);
    supabase
      .from('tournament_attendances')
      .select('tournament_id')
      .in('tournament_id', ids)
      .eq('attended', true)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const r of data ?? []) {
          counts[r.tournament_id] = (counts[r.tournament_id] ?? 0) + 1;
        }
        setAttCounts(counts);
      });
  }, [tournaments]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !formTeamId) return;
    setSaving(true);
    setErr(null);
    try {
      const { error } = await supabase.from('tournaments').insert({
        name: name.trim(),
        type,
        team_id: formTeamId,
        start_date: startDate || null,
        end_date: endDate || null,
        location: location.trim() || null,
      });
      if (error) throw error;
      setName('');
      setType('cup');
      setLocation('');
      setStartDate('');
      setEndDate('');
      setFormTeamId(teamId);
      setShowForm(false);
      onCreate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '建立失敗');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <form
          onSubmit={submit}
          className="rounded-2xl bg-slate-800 border border-slate-700 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">新增賽事</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 text-xs"
            >
              取消
            </button>
          </div>
          {teams.length > 1 && (
            <div>
              <label className="block text-slate-400 text-xs mb-1.5 font-medium">
                所屬球隊
              </label>
              <select
                value={formTeamId ?? ''}
                onChange={(e) => setFormTeamId(e.target.value || null)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {teams.length === 1 && (
            <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
              <Users size={13} /> 將新增至：{teams[0].name}
            </div>
          )}
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">
              類型
            </label>
            <div className="flex gap-2">
              {(['cup', 'league', 'friendly'] as CompetitionType[]).map((ty) => {
                const TIcon = TYPE_ICONS[ty];
                return (
                  <button
                    key={ty}
                    type="button"
                    onClick={() => setType(ty)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors flex-1 justify-center ${
                      type === ty
                        ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    <TIcon size={15} />
                    {COMPETITION_TYPE_LABELS[ty]}
                  </button>
                );
              })}
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="賽事名稱"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="地點（例如：百齡橋下球場）"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          {err && <div className="text-rose-400 text-xs">{err}</div>}
          <button
            type="submit"
            disabled={saving || !name.trim() || !formTeamId}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            建立賽事
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-700 text-slate-400 text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <CalendarPlus size={18} /> 新增賽事
        </button>
      )}

      {tournaments.length === 0 && !showForm && (
        <div className="text-center text-slate-500 text-sm py-16">
          <Trophy size={32} className="mx-auto mb-3 text-slate-600" />
          尚無賽事紀錄
          <div className="mt-1 text-xs">按上方按鈕新增第一個賽事</div>
        </div>
      )}

      {tournaments.map((t) => {
        const TIcon = TYPE_ICONS[t.type] ?? Trophy;
        return (
          <div
            key={t.id}
            className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/40 border border-slate-700/60 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <TIcon size={18} className="text-amber-400 shrink-0" />
                    <h3 className="text-white font-bold text-base truncate">{t.name}</h3>
                    {teamMap.get(t.team_id) && (
                      <span className="text-sky-400 text-sm font-semibold shrink-0">
                        · {teamMap.get(t.team_id)!.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs flex-wrap mt-1.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-700/40 text-slate-300 font-medium">
                      {COMPETITION_TYPE_LABELS[t.type]}
                    </span>
                    {t.start_date && (
                      <span>
                        {t.start_date.slice(5)}
                        {t.end_date && t.end_date !== t.start_date
                          ? ` – ${t.end_date.slice(5)}`
                          : ''}
                      </span>
                    )}
                    {t.start_date && t.location && <span>·</span>}
                    {t.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {t.location}
                      </span>
                    )}
                    {t.frozen && (
                      <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                        <Lock size={10} /> 鎖定
                      </span>
                    )}
                    {t.final_rank != null && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Medal size={12} /> {rankLabel(t.final_rank)}
                      </span>
                    )}
                    {t.type !== 'friendly' && (
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {attCounts[t.id] ?? 0} 人
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!t.frozen && (
                    <button
                      onClick={() => onEdit(t)}
                      className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-200 active:scale-90 transition-transform px-2 py-1.5 rounded-lg hover:bg-slate-700/50"
                      aria-label="編輯賽事"
                    >
                      <Pencil size={16} />
                      <span className="text-[10px] font-medium leading-none">編輯</span>
                    </button>
                  )}
                  <button
                    onClick={() => onShare(t)}
                    className="flex flex-col items-center gap-0.5 text-sky-400 hover:text-sky-300 active:scale-90 transition-transform px-2 py-1.5 rounded-lg hover:bg-sky-500/10"
                    aria-label="分享出席回報連結"
                  >
                    <Share2 size={16} />
                    <span className="text-[10px] font-medium leading-none">分享</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
}
