import { Loader2 } from 'lucide-react';
import type { MatchWithPerformances } from '@/lib/types';
import { StatsBoard } from '@/components/StatsBoard';

export function StatsView({
  matches,
  loading,
  error,
}: {
  matches: MatchWithPerformances[];
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
  return <StatsBoard matches={matches} />;
}
