import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Loader2, MapPin, Trophy, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Player, Tournament } from '@/lib/types';
import { playerHasJerseyName } from '@/components/PlayerName';

export function AttendancePage({ tournamentId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('tournaments')
        .select('id, name, team_id, start_date, end_date, location, final_rank, frozen, created_at')
        .eq('id', tournamentId)
        .maybeSingle();
      if (!t) {
        setErr('找不到此盃賽');
        setLoading(false);
        return;
      }
      setTournament(t as Tournament);

      // Load ALL attendance records (not just attended=true) so we know
      // which players already have a record for this tournament
      const { data: atts } = await supabase
        .from('tournament_attendances')
        .select('player_id, attended')
        .eq('tournament_id', tournamentId);
      const attMap = new Map(
        (atts ?? []).map((a) => [a.player_id as string, a.attended as boolean])
      );
      setAttendedIds(
        new Set(
          [...attMap.entries()]
            .filter(([, v]) => v)
            .map(([k]) => k)
        )
      );

      const { data: mems } = await supabase
        .from('player_team_memberships')
        .select('player_id')
        .eq('team_id', (t as Tournament).team_id)
        .eq('active', true);
      const teamPlayerIds = new Set((mems ?? []).map((m) => m.player_id));

      // Players who have an attendance record but may no longer be on the team
      const attPlayerIds = new Set(attMap.keys());

      // Display set: current team players ∪ players with existing attendance records
      const visibleIds = new Set([...teamPlayerIds, ...attPlayerIds]);

      const { data: pRows } = await supabase
        .from('players')
        .select('id, name, jersey_number, jersey_name, created_at')
        .order('jersey_number', { ascending: true, nullsFirst: false });
      setPlayers(
        ((pRows ?? []) as Player[]).filter((p) => visibleIds.has(p.id))
      );
      setLoading(false);
    }
    load();
  }, [tournamentId]);

  function toggle(id: string) {
    setAttendedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    setSaving(true);
    setErr(null);
    try {
      // Read current attendances to know which ones to keep/remove
      const { data: existing } = await supabase
        .from('tournament_attendances')
        .select('player_id, attended')
        .eq('tournament_id', tournamentId);

      const existingMap = new Map(
        (existing ?? []).map((r) => [r.player_id, r.attended])
      );

      // For each player, determine desired state
      // We only ADD new attendances; we never remove ones set by the coach
      // Parents can only mark "yes" — they cannot un-mark a player the coach already set
      const toInsert: { tournament_id: string; player_id: string; attended: boolean }[] = [];
      for (const p of players) {
        const isAttending = attendedIds.has(p.id);
        const wasAttending = existingMap.get(p.id) ?? false;
        if (isAttending && !wasAttending) {
          toInsert.push({
            tournament_id: tournamentId,
            player_id: p.id,
            attended: true,
          });
        }
        // If parent un-toggled a player that was already marked, we leave it
        // (the coach set that, parent shouldn't be able to remove it)
      }

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('tournament_attendances')
          .upsert(toInsert, { onConflict: 'tournament_id,player_id' });
        if (error) throw error;
      }

      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '回報失敗');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center">
          <X size={32} className="mx-auto mb-3 text-rose-400" />
          <p className="text-slate-300 text-sm">{err}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
          <h2 className="text-white font-bold text-lg mb-2">回報完成！</h2>
          <p className="text-slate-400 text-sm">
            感謝您的回報，教練已收到出席資訊。
          </p>
        </div>
      </div>
    );
  }

  const t = tournament!;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto px-4 pt-8 pb-12">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/40 border border-slate-700/60 p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={18} className="text-amber-400" />
            <h1 className="text-white font-bold text-lg">{t.name}</h1>
          </div>
          {(t.start_date || t.location) && (
            <div className="flex items-center gap-2 text-slate-400 text-xs flex-wrap">
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
            </div>
          )}
        </div>

        <p className="text-slate-300 text-sm font-semibold mb-1">
          請勾選會出席的球員
        </p>
        <p className="text-slate-500 text-xs mb-4">
          勾選完畢後按下方「送出回報」即可。教練已勾選的球員無法取消。
        </p>

        <div className="space-y-2 mb-6">
          {players.map((p) => {
            const on = attendedIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors active:scale-[0.98] ${
                  on
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-900/50 border-slate-700/50'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    on ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  {on && <Check size={15} className="text-slate-900" />}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-sm font-bold block leading-tight ${
                      on ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {p.name}
                  </span>
                  {(p.jersey_number != null || playerHasJerseyName(p)) && (
                    <span className="text-slate-500 text-xs">
                      {p.jersey_number != null && `#${p.jersey_number}`}
                      {p.jersey_number != null && playerHasJerseyName(p) && ' '}
                      {playerHasJerseyName(p) && `(${p.jersey_name?.trim()})`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm mb-3 bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <X size={16} /> {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-900 font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" /> 送出中…
            </>
          ) : (
            '送出回報'
          )}
        </button>
      </div>
    </div>
  );
}
