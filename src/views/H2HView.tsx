import { Loader2 } from 'lucide-react';
import type { MatchWithPerformances, Tournament, Team } from '@/lib/types';
import { HeadToHead } from '@/components/HeadToHead';

export function H2HView({
  matches,
  tournaments,
  teams,
  loading,
  error,
}: {
  matches: MatchWithPerformances[];
  tournaments: Tournament[];
  teams: Team[];
  loading: boolean;
  error: string | null;
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
  return <HeadToHead matches={matches} tournaments={tournaments} teams={teams} />;
}
