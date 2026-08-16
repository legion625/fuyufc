import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Player, PlayerMembership } from '@/lib/types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('jersey_number', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
    if (error) {
      setError(error.message);
      setPlayers([]);
      setLoading(false);
      return;
    }

    const playerRows = (data ?? []) as Player[];
    if (playerRows.length === 0) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    const { data: mems } = await supabase
      .from('player_team_memberships')
      .select('id, player_id, team_id, active');

    const memMap = new Map<string, PlayerMembership[]>();
    for (const m of (mems ?? []) as PlayerMembership[]) {
      const arr = memMap.get(m.player_id) ?? [];
      arr.push(m);
      memMap.set(m.player_id, arr);
    }

    setPlayers(
      playerRows.map((p) => ({
        ...p,
        memberships: memMap.get(p.id) ?? [],
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return { players, loading, error, reload: load };
}
