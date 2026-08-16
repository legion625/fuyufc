const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/team-auth`;
const HEADERS = {
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

type Perf = {
  player_id: string;
  attended: boolean;
  played: boolean;
  goals: number;
  assists: number;
};

type TournamentAtt = {
  player_id: string;
  attended: boolean;
};

async function post(body: Record<string, unknown>) {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `請求失敗（${res.status}）`);
  }
  return data;
}

export async function deleteMatch(matchId: string, password: string) {
  return post({ action: 'delete-match', matchId, password });
}

export async function updateMatch(
  matchId: string,
  fields: {
    matchDate?: string;
    opponent?: string;
    ourScore?: number;
    oppScore?: number;
    pkOur?: number | null;
    pkOpp?: number | null;
    stage?: number;
    notes?: string;
    performances?: Perf[];
  }
) {
  return post({ action: 'update-match', matchId, ...fields });
}

export async function updateTournament(
  tournamentId: string,
  fields: {
    tournamentName?: string;
    startDate?: string | null;
    endDate?: string | null;
    location?: string | null;
    finalRank?: number | null;
  }
) {
  return post({ action: 'update-tournament', tournamentId, ...fields });
}

export async function setTournamentAttendance(
  tournamentId: string,
  attendances: TournamentAtt[]
) {
  return post({ action: 'set-tournament-attendance', tournamentId, attendances });
}

export async function setTournamentFrozen(
  tournamentId: string,
  frozen: boolean,
  adminPassword: string
) {
  return post({ action: 'set-tournament-frozen', tournamentId, frozen, adminPassword });
}

export async function deleteTournament(tournamentId: string, adminPassword: string) {
  return post({ action: 'delete-tournament', tournamentId, adminPassword });
}

export async function changeTournamentTeam(
  tournamentId: string,
  teamId: string,
  adminPassword: string
) {
  return post({ action: 'change-tournament-team', tournamentId, teamId, adminPassword });
}

export async function setTeamPassword(
  teamId: string,
  newPassword: string,
  adminPassword: string
) {
  return post({ action: 'set-team-password', teamId, newPassword, adminPassword });
}

export async function setAdminPassword(oldPassword: string, newPassword: string) {
  return post({ action: 'set-admin-password', oldPassword, newPassword });
}
