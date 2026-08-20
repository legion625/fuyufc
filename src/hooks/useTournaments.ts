import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tournament } from '@/lib/types';

export function useTournaments(teamIds: string[]) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const key = teamIds.join(',');

  const load = useCallback(async () => {
    if (teamIds.length === 0) {
      setTournaments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('tournaments')
      .select('id, name, team_id, type, start_date, end_date, location, final_rank, frozen, created_at')
      .in('team_id', teamIds)
      .order('start_date', { ascending: false, nullsFirst: false });
    setTournaments((data ?? []) as Tournament[]);
    setLoading(false);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { tournaments, loading, reload: load };
}
