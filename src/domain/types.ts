// Domain-tyypit MM-veikkauksen pisteytysmoottorille (Phase 0, §3).
//
// Nimeämisestä: erotetaan **Bettor** (veikkaava perheenjäsen) ja **Player**
// (jalkapalloilija, paras pelaaja / maalikuningas -ehdokas). "Player" ei
// koskaan tarkoita molempia.

// Roolit. Mitalibonus on sidottu kolmeen ensimmäiseen.
// dark_horse ja wild_card: EI bonusta — antavat vain lisää joukkueita
// ottelupisteisiin.
export type PickRole = 'champion' | 'silver' | 'bronze' | 'dark_horse' | 'wild_card';

export interface Team {
  id: string; // vakaa avain, esim. 'BRA'
  name: string; // suomenkielinen näyttönimi, esim. 'Brasilia'
  fifaCode?: string; // valinnainen, APIa varten myöhemmin
}

export interface Player {
  // jalkapalloilijaehdokas
  id: string; // esim. 'yamal'
  name: string; // kanoninen näyttönimi, esim. 'Lamine Yamal'
}

export interface Bettor {
  // perheenjäsen
  id: string; // esim. 'kaarlo'
  name: string;
}

export interface TeamPick {
  role: PickRole;
  teamId: string;
}

export interface BettorPicks {
  bettorId: string;
  teams: TeamPick[]; // tasan 5, roolit uniikkeja
  bestPlayerId: string; // viittaa Player.id
  topScorerId: string; // viittaa Player.id
}

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  result: MatchResult | null; // null = pelaamatta
}

export interface TournamentOutcome {
  // kaikki nullable kunnes tiedossa
  championTeamId: string | null;
  silverTeamId: string | null;
  bronzeTeamId: string | null;
  bestPlayerId: string | null;
  topScorerId: string | null;
}

export interface ScoringInput {
  bettors: Bettor[];
  picks: BettorPicks[];
  matches: Match[];
  outcome: TournamentOutcome;
}

export interface BettorStanding {
  bettorId: string;
  matchPoints: number;
  medalBonus: { champion: number; silver: number; bronze: number; total: number };
  prizeBonus: { bestPlayer: number; topScorer: number; total: number };
  total: number;
  rank: number;
}
