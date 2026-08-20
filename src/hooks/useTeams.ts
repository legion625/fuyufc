import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Team } from '@/lib/types';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, slug, home_kit_color, away_kit_color')
      .order('name', { ascending: true });
    if (error) setError(error.message);
    else setTeams(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { teams, loading, error, reload: load };
}
