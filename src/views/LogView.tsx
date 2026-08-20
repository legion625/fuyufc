import { Loader2 } from 'lucide-react';
import type { Player, Tournament, Team } from '@/lib/types';
import { LogForm } from '@/components/LogForm';

export function LogView({
  players,
  loading,
  error,
  teamId,
  teams,
  tournaments,
  onSaved,
}: {
  players: Player[];
  loading: boolean;
  error: string | null;
  teamId: string | null;
  teams: Team[];
  tournaments: Tournament[];
  onSaved: () => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center text-rose-400 text-sm py-20">{error}</div>
    );
  }
  return (
    <LogForm
      players={players}
      teamId={teamId}
      teams={teams}
      tournaments={tournaments}
      onSaved={onSaved}
    />
  );
}
