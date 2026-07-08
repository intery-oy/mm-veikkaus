import autoData from './auto-scorers.generated.json';

export interface ScorerStanding {
  playerId: string | null;
  playerName: string;
  teamId: string | null;
  teamName: string;
  goals: number;
  assists: number | null;
  penalties: number | null;
  playedMatches: number;
}

interface AutoScorers {
  scorers?: ScorerStanding[];
}

const auto = autoData as AutoScorers;

export const scorers: ScorerStanding[] = auto.scorers ?? [];
