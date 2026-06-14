// View-model: yhdistää seed-datan (data/*) + committoidut tulokset (results.ts)
// pisteytysmoottorin (domain/scoring.ts) läpi UI:lle valmiiksi muodoksi.
// Komponentit ovat "tyhmiä" — kaikki johdettu data lasketaan täällä.

import { computeStandings } from '../domain/scoring.js';
import type { PickRole } from '../domain/types.js';
import { bettors, picks } from '../data/picks.js';
import { matches, outcome } from '../data/results.js';
import { teamById } from '../data/teams.js';
import { playerById } from '../data/players.js';

export const ROLE_LABEL: Record<PickRole, string> = {
  champion: 'Mestari',
  silver: 'Hopea',
  bronze: 'Pronssi',
  dark_horse: 'Tumma hevonen',
  wild_card: 'Villi kortti',
};

// Roolien vakaa näyttöjärjestys korteissa.
const ROLE_ORDER: PickRole[] = ['champion', 'silver', 'bronze', 'dark_horse', 'wild_card'];

export interface TeamPickView {
  role: PickRole;
  roleLabel: string;
  teamName: string;
}

export interface BonusSlot {
  label: string;
  /** Pisteet jos ratkennut; null jos kisat vielä kesken kyseiseltä osalta. */
  points: number | null;
  /** Mihin veikattiin (joukkue tai pelaaja). */
  pick: string;
}

export interface BettorView {
  bettorId: string;
  name: string;
  rank: number;
  total: number;
  matchPoints: number;
  medalBonusTotal: number;
  prizeBonusTotal: number;
  teams: TeamPickView[];
  bestPlayerName: string;
  topScorerName: string;
  /** Mitali- ja palkintoruudut kortteja varten; points=null => "kesken". */
  bonusSlots: BonusSlot[];
}

export interface PortalData {
  bettors: BettorView[];
  /** Montako ottelua on pelattu (tuloksellisia). */
  playedMatches: number;
  totalMatches: number;
  /** Onko koko outcome vielä auki. */
  outcomePending: boolean;
}

function teamName(id: string): string {
  return teamById.get(id)?.name ?? id;
}

function playerName(id: string): string {
  return playerById.get(id)?.name ?? id;
}

export function buildPortalData(): PortalData {
  const standings = computeStandings({ bettors, picks, matches, outcome });
  const nameById = new Map(bettors.map((b) => [b.id, b.name]));
  const picksById = new Map(picks.map((p) => [p.bettorId, p]));

  const bettorViews: BettorView[] = standings.map((s) => {
    const p = picksById.get(s.bettorId);
    const byRole = new Map((p?.teams ?? []).map((t) => [t.role, t.teamId]));

    const teams: TeamPickView[] = ROLE_ORDER.filter((r) => byRole.has(r)).map((role) => ({
      role,
      roleLabel: ROLE_LABEL[role],
      teamName: teamName(byRole.get(role)!),
    }));

    const bonusSlots: BonusSlot[] = [
      {
        label: 'Mestari',
        points: outcome.championTeamId === null ? null : s.medalBonus.champion,
        pick: byRole.has('champion') ? teamName(byRole.get('champion')!) : '—',
      },
      {
        label: 'Hopea',
        points: outcome.silverTeamId === null ? null : s.medalBonus.silver,
        pick: byRole.has('silver') ? teamName(byRole.get('silver')!) : '—',
      },
      {
        label: 'Pronssi',
        points: outcome.bronzeTeamId === null ? null : s.medalBonus.bronze,
        pick: byRole.has('bronze') ? teamName(byRole.get('bronze')!) : '—',
      },
      {
        label: 'Paras pelaaja',
        points: outcome.bestPlayerId === null ? null : s.prizeBonus.bestPlayer,
        pick: p ? playerName(p.bestPlayerId) : '—',
      },
      {
        label: 'Maalikuningas',
        points: outcome.topScorerId === null ? null : s.prizeBonus.topScorer,
        pick: p ? playerName(p.topScorerId) : '—',
      },
    ];

    return {
      bettorId: s.bettorId,
      name: nameById.get(s.bettorId) ?? s.bettorId,
      rank: s.rank,
      total: s.total,
      matchPoints: s.matchPoints,
      medalBonusTotal: s.medalBonus.total,
      prizeBonusTotal: s.prizeBonus.total,
      teams,
      bestPlayerName: p ? playerName(p.bestPlayerId) : '—',
      topScorerName: p ? playerName(p.topScorerId) : '—',
      bonusSlots,
    };
  });

  const playedMatches = matches.filter((m) => m.result !== null).length;
  const outcomePending =
    outcome.championTeamId === null &&
    outcome.silverTeamId === null &&
    outcome.bronzeTeamId === null &&
    outcome.bestPlayerId === null &&
    outcome.topScorerId === null;

  return {
    bettors: bettorViews,
    playedMatches,
    totalMatches: matches.length,
    outcomePending,
  };
}
