export type Team = {
  id: string;
  name: string;
  slug: string;
  home_kit_color: string;
  away_kit_color: string;
};

export type KitChoice = 'home' | 'away';

export type WeatherChoice = 'sunny' | 'cloudy' | 'rainy' | 'overcast';

export const WEATHER_LABELS: Record<WeatherChoice, string> = {
  sunny: '晴天',
  cloudy: '陰天',
  rainy: '雨天',
  overcast: '陰雨',
};

export const KIT_LABELS: Record<KitChoice, string> = {
  home: '主場',
  away: '客場',
};

export const KIT_COLOR_PRESETS: string[] = [
  '#1e40af',
  '#ffffff',
  '#dc2626',
  '#f59e0b',
  '#10b981',
  '#6366f1',
  '#ec4899',
  '#0f172a',
];

export type PlayerMembership = {
  id: string;
  player_id: string;
  team_id: string;
  active: boolean;
};

export type Player = {
  id: string;
  name: string;
  jersey_number: number | null;
  jersey_name: string | null;
  created_at?: string;
  memberships?: PlayerMembership[];
};

export type Tournament = {
  id: string;
  name: string;
  team_id: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  final_rank: number | null;
  frozen: boolean;
  created_at?: string;
};

export type TournamentAttendance = {
  id: string;
  tournament_id: string;
  player_id: string;
  attended: boolean;
};

export type MatchStage = number;

export const STAGES: number[] = [0, 16, 8, 4, 2, 3];

export const STAGE_LABELS: Record<number, string> = {
  0: '小組賽',
  16: '16強',
  8: '8強',
  4: '4強',
  2: '決賽',
  3: '季軍賽',
};

export function stageLabel(stage: number): string {
  return STAGE_LABELS[stage] ?? `第 ${stage} 輪`;
}

export const RANK_OPTIONS: (number | null)[] = [null, 1, 2, 3, 4, 8, 16, 0];

export const RANK_LABELS: Record<number, string> = {
  0: '小組賽出局',
  16: '16強出局',
  8: '8強出局',
  4: '4強出局',
  3: '季軍',
  2: '亞軍',
  1: '冠軍',
};

export type Match = {
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
  kit: KitChoice | null;
  weather: WeatherChoice | null;
  created_at?: string;
};

export type MatchPerformance = {
  id: string;
  match_id: string;
  player_id: string;
  attended: boolean;
  played: boolean;
  goals: number;
  assists: number;
};

export type MatchWithPerformances = Match & {
  performances: (MatchPerformance & { player: Player })[];
};

export type MatchResult = 'win' | 'loss' | 'draw';

export function getResult(
  our: number,
  opp: number,
  pkOur: number | null = null,
  pkOpp: number | null = null
): MatchResult {
  if (our > opp) return 'win';
  if (our < opp) return 'loss';
  // Draw in regulation — check PK result
  if (pkOur != null && pkOpp != null) {
    if (pkOur > pkOpp) return 'win';
    if (pkOur < pkOpp) return 'loss';
  }
  return 'draw';
}

export function resultLabel(r: MatchResult): string {
  return r === 'win' ? '勝' : r === 'loss' ? '負' : '和';
}

export function hasPK(our: number, opp: number, pkOur: number | null, pkOpp: number | null): boolean {
  return our === opp && pkOur != null && pkOpp != null;
}

export function pkLabel(our: number, opp: number, pkOur: number | null, pkOpp: number | null): string {
  if (!hasPK(our, opp, pkOur, pkOpp)) return '';
  return pkOur! > pkOpp! ? 'PK勝' : 'PK負';
}

export function pkScoreLabel(pkOur: number | null, pkOpp: number | null): string {
  if (pkOur == null || pkOpp == null) return '';
  return `PK ${pkOur}-${pkOpp}`;
}

export function rankLabel(rank: number | null): string {
  if (rank == null) return '未定';
  return RANK_LABELS[rank] ?? `第 ${rank} 名`;
}
