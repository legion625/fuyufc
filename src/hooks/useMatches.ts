import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MatchWithPerformances, MatchPerformance, Player } from '@/lib/types';

type RawRow = {
  id: string;
  match_date: string;
  tournament: string;
  tournament_id: string | null;
  stage: number;
  location: string;
  opponent: string;
  our_score: number;
  opp_score: number;
  team_id: string;
  pk_our: number | null;
  pk_opp: number | null;
  notes: string;
  created_at?: string;
  match_performances: (MatchPerformance & { player: Player })[];
};

export function useMatches(teamIds: string[]) {
  const [matches, setMatches] = useState<MatchWithPerformances[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = teamIds.join(',');

  async function load() {
    if (teamIds.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('matches')
      .select(
        'id, match_date, tournament, tournament_id, stage, location, opponent, our_score, opp_score, team_id, pk_our, pk_opp, notes, created_at, match_performances(id, match_id, player_id, attended, played, goals, assists, player:players(id, name, jersey_name, jersey_number))'
      )
      .in('team_id', teamIds)
      .order('match_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as RawRow[];
    const mapped: MatchWithPerformances[] = rows.map((r) => ({
      id: r.id,
      match_date: r.match_date,
      tournament: r.tournament,
      tournament_id: r.tournament_id,
      stage: r.stage,
      location: r.location,
      opponent: r.opponent,
      our_score: r.our_score,
      opp_score: r.opp_score,
      team_id: r.team_id,
      pk_our: r.pk_our,
      pk_opp: r.pk_opp,
      notes: r.notes,
      created_at: r.created_at,
      performances: (r.match_performances ?? []).map((p) => ({
        id: p.id,
        match_id: p.match_id,
        player_id: p.player_id,
        attended: p.attended,
        played: p.played,
        goals: p.goals,
        assists: p.assists,
        player: p.player,
      })),
    }));

    setMatches(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { matches, loading, error, reload: load };
}
