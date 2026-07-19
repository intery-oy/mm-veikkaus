// View-model: yhdistää seed-datan (data/*) + committoidut tulokset (results.ts)
// pisteytysmoottorin (domain/scoring.ts) läpi UI:lle valmiiksi muodoksi.
// Komponentit ovat "tyhmiä" — kaikki johdettu data lasketaan täällä.

import { computeStandings } from '../domain/scoring.js';
import type { PickRole } from '../domain/types.js';
import { bettors, picks } from '../data/picks.js';
import { fixtureDates, matches, outcome, preliminaryIds, upcomingFixtures } from '../data/results.js';
import { scorers } from '../data/scorers.js';
import { teamById } from '../data/teams.js';
import { playerById } from '../data/players.js';
import { bettorAvatar, flagEmoji } from './flags.js';

export const ROLE_LABEL: Record<PickRole, string> = {
  champion: 'Mestari',
  silver: 'Hopea',
  bronze: 'Pronssi',
  dark_horse: 'Tumma hevonen',
  wild_card: 'Villi kortti',
};

// Roolien vakaa näyttöjärjestys korteissa.
const ROLE_ORDER: PickRole[] = ['champion', 'silver', 'bronze', 'dark_horse', 'wild_card'];
const KNOCKOUT_MATCH_TOTAL = 32;
const KNOCKOUT_REMAINING_BY_STAGE: Record<string, number> = {
  R32: 32,
  R16: 16,
  QF: 8,
  SF: 4,
  '3P': 2,
  F: 1,
  FINAL: 1,
};

export interface TeamPickView {
  teamId: string;
  role: PickRole;
  roleLabel: string;
  teamName: string;
  flag: string;
}

export interface BonusSlot {
  label: string;
  /** Emoji-ikoni ruudulle (lippu joukkueelle, ⭐/👟 pelaajille). */
  icon: string;
  /** Pisteet jos ratkennut; null jos kisat vielä kesken kyseiseltä osalta. */
  points: number | null;
  /** Bonuksen tila UI:lle; maalikuningas voidaan näyttää alustavana ennen finaalia. */
  status: 'pending' | 'provisional' | 'final';
  /** Mihin veikattiin (joukkue tai pelaaja). */
  pick: string;
}

export interface BettorView {
  bettorId: string;
  name: string;
  avatar: string;
  rank: number;
  total: number;
  playedTeamGames: number;
  matchPoints: number;
  medalBonusTotal: number;
  prizeBonusTotal: number;
  teams: TeamPickView[];
  bestPlayerName: string;
  topScorerName: string;
  /** Pelaajabonukset kortteja varten; points=null => "kesken". */
  bonusSlots: BonusSlot[];
  /** Muutos viimeisimmän tuloksen jälkeen: positiivinen rankDelta = nousi. */
  movement: {
    rankDelta: number;
    pointsDelta: number;
  };
}

export interface PlayedResult {
  id: string;
  utcDate: string | null;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  homeGoals: number;
  awayGoals: number;
  /** Tulos vasta alustava (peli kesken). */
  preliminary: boolean;
  /** Veikkaajat, joilla on jokin ottelun joukkue valinnoissaan. */
  backers: UpcomingBacker[];
}

export interface UpcomingBacker {
  /** Veikatun joukkueen lippu (kertoo kumpaa puolta veikkasi). */
  flag: string;
  avatar: string;
  name: string;
}

export interface UpcomingMatch {
  id: string;
  utcDate: string;
  homeName: string;
  awayName: string;
  homeFlag: string;
  awayFlag: string;
  /** Veikkaajat, joilla on jokin ottelun joukkue valinnoissaan. */
  backers: UpcomingBacker[];
}

export interface ResultImpact {
  bettorId: string;
  name: string;
  avatar: string;
  pointsDelta: number;
  rankDelta: number;
  total: number;
}

export interface ChangeStory {
  match: PlayedResult;
  impact: ResultImpact[];
}

export interface InsightCard {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: string;
}

export interface TeamOwnerView {
  bettorId: string;
  name: string;
  avatar: string;
  role: PickRole;
  roleLabel: string;
  total: number;
}

export interface TeamOwnershipView {
  teamId: string;
  teamName: string;
  flag: string;
  owners: TeamOwnerView[];
}

export interface ScorerView {
  playerId: string | null;
  playerName: string;
  teamName: string;
  teamFlag: string;
  goals: number;
  assists: number | null;
  penalties: number | null;
  playedMatches: number;
  pickedBy: Array<{ name: string; avatar: string }>;
}

export interface MedalBonusView {
  role: 'champion' | 'silver' | 'bronze';
  label: string;
  points: number;
  teamName: string | null;
  flag: string | null;
  awarded: boolean;
}

export interface ScenarioStandingView {
  rank: number;
  name: string;
  avatar: string;
  total: number;
}

export interface FinalScenarioView {
  winnerTeamId: string;
  winnerName: string;
  winnerFlag: string;
  rows: ScenarioStandingView[];
}

export interface PortalData {
  bettors: BettorView[];
  /** Montako ottelua on pelattu (tuloksellisia). */
  playedMatches: number;
  totalMatches: number;
  /** Turnausrakenteen mukainen jäljellä olevien otteluiden määrä. */
  remainingTournamentMatches: number;
  /** Onko koko outcome vielä auki. */
  outcomePending: boolean;
  /** Pelatut ottelut tuloksineen (tulosfiidiä varten). */
  results: PlayedResult[];
  /** Etusivun tiivis tulosfiidi: aina vain 3 uusinta ottelua. */
  latestResults: PlayedResult[];
  /** Vanhemmat ottelut erillistä ottelulokia varten. */
  matchLog: PlayedResult[];
  /** Onko mukana vähintään yksi alustava (kesken oleva) tulos. */
  hasPreliminary: boolean;
  /** Tulevat ottelut aikajärjestyksessä (App suodattaa "nyt"-hetken). */
  upcoming: UpcomingMatch[];
  /** Viimeisimmän pelatun tuloksen vaikutus. */
  changeStory: ChangeStory | null;
  /** Pienet nostot leaderboardin ympärille. */
  insights: InsightCard[];
  /** Joukkuekohtainen omistusnäkymä. */
  teamOwnership: TeamOwnershipView[];
  /** Live-maalipörssi, ei vaikuta bonuksiin ennen lopullista outcomea. */
  topScorers: ScorerView[];
  /** Mitalibonusten julkinen tila: mikä on jo jaettu ja mikä vielä auki. */
  medalBonuses: MedalBonusView[];
  /** Top 3 -perusskenaariot finaalin voittajan mukaan, paras pelaaja vielä auki. */
  finalScenarios: FinalScenarioView[];
}

function teamName(id: string): string {
  return teamById.get(id)?.name ?? id;
}

function playerName(id: string): string {
  return playerById.get(id)?.name ?? id;
}

function resultToView(
  match: (typeof matches)[number],
  prelim: Set<string>,
  ownersByTeam: Map<string, Array<{ name: string; avatar: string }>>,
): PlayedResult {
  const homeFlag = flagEmoji(match.homeTeamId);
  const awayFlag = flagEmoji(match.awayTeamId);
  return {
    id: match.id,
    utcDate: fixtureDates[match.id] ?? null,
    homeName: teamName(match.homeTeamId),
    awayName: teamName(match.awayTeamId),
    homeFlag,
    awayFlag,
    homeGoals: match.result!.homeGoals,
    awayGoals: match.result!.awayGoals,
    preliminary: prelim.has(match.id),
    backers: [
      ...(ownersByTeam.get(match.homeTeamId) ?? []).map((o) => ({ ...o, flag: homeFlag })),
      ...(ownersByTeam.get(match.awayTeamId) ?? []).map((o) => ({ ...o, flag: awayFlag })),
    ],
  };
}

function matchOrderIndex(id: string): number {
  const idx = matches.findIndex((m) => m.id === id);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

function compareMatchAsc(a: (typeof matches)[number], b: (typeof matches)[number]): number {
  const aDate = fixtureDates[a.id];
  const bDate = fixtureDates[b.id];
  if (aDate && bDate && aDate !== bDate) return aDate.localeCompare(bDate);
  if (aDate && !bDate) return 1;
  if (!aDate && bDate) return -1;
  return matchOrderIndex(a.id) - matchOrderIndex(b.id);
}

function comparePlayedAsc(a: PlayedResult, b: PlayedResult): number {
  if (a.utcDate && b.utcDate && a.utcDate !== b.utcDate) return a.utcDate.localeCompare(b.utcDate);
  if (a.utcDate && !b.utcDate) return 1;
  if (!a.utcDate && b.utcDate) return -1;
  return matchOrderIndex(a.id) - matchOrderIndex(b.id);
}

function formatRankDelta(delta: number): string {
  if (delta > 0) return `+${delta} sijaa`;
  if (delta < 0) return `${delta} sijaa`;
  return 'ei sijamuutosta';
}

export function buildPortalData(): PortalData {
  const standings = computeStandings({ bettors, picks, matches, outcome });
  const latestPlayedMatch =
    [...matches]
      .filter((m) => m.result !== null)
      .sort(compareMatchAsc)
      .at(-1) ?? null;
  const previousMatches = latestPlayedMatch
    ? matches.map((m) => (m.id === latestPlayedMatch.id ? { ...m, result: null } : m))
    : matches;
  const previousStandings = computeStandings({
    bettors,
    picks,
    matches: previousMatches,
    outcome,
  });
  const previousById = new Map(previousStandings.map((s) => [s.bettorId, s]));
  const nameById = new Map(bettors.map((b) => [b.id, b.name]));
  const picksById = new Map(picks.map((p) => [p.bettorId, p]));

  // teamId -> veikkaajat (nimi + avatar), joilla joukkue on valinnoissaan.
  const ownerIdsByTeam = new Map<string, Set<string>>();
  for (const p of picks) {
    for (const t of p.teams) {
      if (!ownerIdsByTeam.has(t.teamId)) ownerIdsByTeam.set(t.teamId, new Set());
      ownerIdsByTeam.get(t.teamId)!.add(p.bettorId);
    }
  }
  const ownersByTeam = new Map<string, Array<{ name: string; avatar: string }>>();
  for (const [teamId, ids] of ownerIdsByTeam) {
    const refs = [...ids]
      .map((id) => ({ name: nameById.get(id) ?? id, avatar: bettorAvatar(id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    ownersByTeam.set(teamId, refs);
  }

  const bettorViews: BettorView[] = standings.map((s) => {
    const p = picksById.get(s.bettorId);
    const byRole = new Map((p?.teams ?? []).map((t) => [t.role, t.teamId]));
    const pickedTeamIds = new Set(p?.teams.map((t) => t.teamId) ?? []);
    const playedTeamGames = [...pickedTeamIds].reduce(
      (total, teamId) =>
        total +
        matches.filter(
          (m) => m.result !== null && (m.homeTeamId === teamId || m.awayTeamId === teamId),
        ).length,
      0,
    );

    const teams: TeamPickView[] = ROLE_ORDER.filter((r) => byRole.has(r)).map((role) => ({
      teamId: byRole.get(role)!,
      role,
      roleLabel: ROLE_LABEL[role],
      teamName: teamName(byRole.get(role)!),
      flag: flagEmoji(byRole.get(role)!),
    }));

    const bonusSlots: BonusSlot[] = [
      {
        label: 'Paras pelaaja',
        icon: '⭐',
        points: outcome.bestPlayerId === null ? null : s.prizeBonus.bestPlayer,
        status: outcome.bestPlayerId === null ? 'pending' : 'final',
        pick: p ? playerName(p.bestPlayerId) : '—',
      },
      {
        label: 'Maalikuningas',
        icon: '👟',
        points: outcome.topScorerId === null ? null : s.prizeBonus.topScorer,
        status: outcome.topScorerId === null ? 'pending' : 'provisional',
        pick: p ? playerName(p.topScorerId) : '—',
      },
    ];

    return {
      bettorId: s.bettorId,
      name: nameById.get(s.bettorId) ?? s.bettorId,
      avatar: bettorAvatar(s.bettorId),
      rank: s.rank,
      total: s.total,
      playedTeamGames,
      matchPoints: s.matchPoints,
      medalBonusTotal: s.medalBonus.total,
      prizeBonusTotal: s.prizeBonus.total,
      teams,
      bestPlayerName: p ? playerName(p.bestPlayerId) : '—',
      topScorerName: p ? playerName(p.topScorerId) : '—',
      bonusSlots,
      movement: {
        rankDelta: (previousById.get(s.bettorId)?.rank ?? s.rank) - s.rank,
        pointsDelta: s.total - (previousById.get(s.bettorId)?.total ?? s.total),
      },
    };
  });

  const prelim = new Set(preliminaryIds);
  const results: PlayedResult[] = matches
    .filter((m) => m.result !== null)
    .map((m) => resultToView(m, prelim, ownersByTeam))
    .sort(comparePlayedAsc);
  const latestResults = [...results].reverse().slice(0, 3);
  const matchLog = [...results].reverse().slice(3);

  const playedMatches = results.length;
  const activeKnockoutStage = upcomingFixtures
    .map((fixture) => fixture.id.split('-')[0]!)
    .find((stage) => stage in KNOCKOUT_REMAINING_BY_STAGE);
  const remainingTournamentMatches =
    activeKnockoutStage !== undefined
      ? KNOCKOUT_REMAINING_BY_STAGE[activeKnockoutStage]!
      : Math.max(0, matches.length + KNOCKOUT_MATCH_TOTAL - playedMatches);
  const outcomePending =
    outcome.championTeamId === null &&
    outcome.silverTeamId === null &&
    outcome.bronzeTeamId === null &&
    outcome.bestPlayerId === null &&
    outcome.topScorerId === null;

  const impact: ResultImpact[] = bettorViews
    .map((b) => ({
      bettorId: b.bettorId,
      name: b.name,
      avatar: b.avatar,
      pointsDelta: b.movement.pointsDelta,
      rankDelta: b.movement.rankDelta,
      total: b.total,
    }))
    .filter((i) => i.pointsDelta !== 0 || i.rankDelta !== 0)
    .sort((a, b) => {
      if (b.pointsDelta !== a.pointsDelta) return b.pointsDelta - a.pointsDelta;
      if (b.rankDelta !== a.rankDelta) return b.rankDelta - a.rankDelta;
      return a.name.localeCompare(b.name);
    });

  const changeStory =
    latestPlayedMatch && latestPlayedMatch.result
      ? { match: resultToView(latestPlayedMatch, prelim, ownersByTeam), impact }
      : null;

  const biggestRiser = [...bettorViews]
    .filter((b) => b.movement.rankDelta > 0)
    .sort((a, b) => b.movement.rankDelta - a.movement.rankDelta || a.name.localeCompare(b.name))[0];
  const bestLatestPoints = [...bettorViews]
    .filter((b) => b.movement.pointsDelta > 0)
    .sort((a, b) => b.movement.pointsDelta - a.movement.pointsDelta || a.name.localeCompare(b.name))[0];
  const leader = bettorViews[0];
  const chaser = bettorViews.find((b) => b.rank !== leader?.rank);

  const insights: InsightCard[] = [
    leader
      ? {
          id: 'leader',
          label: 'Kärjessä',
          value: `${leader.avatar} ${leader.name}`,
          detail: `${leader.total} pistettä`,
          icon: '👑',
        }
      : null,
    chaser && leader
      ? {
          id: 'chase',
          label: 'Lähin uhka',
          value: `${chaser.avatar} ${chaser.name}`,
          detail: `${leader.total - chaser.total} pistettä kärjestä`,
          icon: '🎯',
        }
      : null,
    biggestRiser
      ? {
          id: 'riser',
          label: 'Nousija',
          value: `${biggestRiser.avatar} ${biggestRiser.name}`,
          detail: formatRankDelta(biggestRiser.movement.rankDelta),
          icon: '🚀',
        }
      : null,
    bestLatestPoints
      ? {
          id: 'latest-points',
          label: 'Viime tuloksen voittaja',
          value: `${bestLatestPoints.avatar} ${bestLatestPoints.name}`,
          detail: `+${bestLatestPoints.movement.pointsDelta} pistettä`,
          icon: '⚡',
        }
      : null,
  ].filter((card): card is InsightCard => card !== null);

  const standingById = new Map(bettorViews.map((b) => [b.bettorId, b]));
  const scorerPickersByPlayer = new Map<string, Array<{ name: string; avatar: string }>>();
  for (const p of picks) {
    const picker = { name: nameById.get(p.bettorId) ?? p.bettorId, avatar: bettorAvatar(p.bettorId) };
    const existing = scorerPickersByPlayer.get(p.topScorerId) ?? [];
    existing.push(picker);
    scorerPickersByPlayer.set(p.topScorerId, existing);
  }
  for (const pickers of scorerPickersByPlayer.values()) {
    pickers.sort((a, b) => a.name.localeCompare(b.name));
  }
  const teamOwnership: TeamOwnershipView[] = [...ownerIdsByTeam.keys()]
    .map((teamId) => {
      const owners = picks
        .flatMap((p) =>
          p.teams
            .filter((t) => t.teamId === teamId)
            .map((t) => ({
              bettorId: p.bettorId,
              name: nameById.get(p.bettorId) ?? p.bettorId,
              avatar: bettorAvatar(p.bettorId),
              role: t.role,
              roleLabel: ROLE_LABEL[t.role],
              total: standingById.get(p.bettorId)?.total ?? 0,
            })),
        )
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
      return {
        teamId,
        teamName: teamName(teamId),
        flag: flagEmoji(teamId),
        owners,
      };
    })
    .sort((a, b) => b.owners.length - a.owners.length || a.teamName.localeCompare(b.teamName));
  const topScorers: ScorerView[] = scorers.slice(0, 10).map((s) => ({
    playerId: s.playerId,
    playerName: s.playerName,
    teamName: s.teamName,
    teamFlag: s.teamId ? flagEmoji(s.teamId) : '⚽',
    goals: s.goals,
    assists: s.assists,
    penalties: s.penalties,
    playedMatches: s.playedMatches,
    pickedBy: s.playerId ? (scorerPickersByPlayer.get(s.playerId) ?? []) : [],
  }));
  const medalBonuses: MedalBonusView[] = [
    {
      role: 'champion',
      label: 'Mestari',
      points: 15,
      teamName: outcome.championTeamId ? teamName(outcome.championTeamId) : null,
      flag: outcome.championTeamId ? flagEmoji(outcome.championTeamId) : null,
      awarded: outcome.championTeamId !== null,
    },
    {
      role: 'silver',
      label: 'Hopea',
      points: 10,
      teamName: outcome.silverTeamId ? teamName(outcome.silverTeamId) : null,
      flag: outcome.silverTeamId ? flagEmoji(outcome.silverTeamId) : null,
      awarded: outcome.silverTeamId !== null,
    },
    {
      role: 'bronze',
      label: 'Pronssi',
      points: 6,
      teamName: outcome.bronzeTeamId ? teamName(outcome.bronzeTeamId) : null,
      flag: outcome.bronzeTeamId ? flagEmoji(outcome.bronzeTeamId) : null,
      awarded: outcome.bronzeTeamId !== null,
    },
  ];
  const finalScenarios: FinalScenarioView[] = (['ESP', 'ARG'] as const).map((winnerTeamId) => {
    const finalMatch = {
      id: 'FINAL-ESP-ARG',
      homeTeamId: 'ESP',
      awayTeamId: 'ARG',
      result:
        winnerTeamId === 'ESP'
          ? { homeGoals: 1, awayGoals: 0 }
          : { homeGoals: 0, awayGoals: 1 },
    };
    const scenarioOutcome = {
      ...outcome,
      championTeamId: winnerTeamId,
      silverTeamId: winnerTeamId === 'ESP' ? 'ARG' : 'ESP',
      bestPlayerId: null,
    };
    const scenarioStandings = computeStandings({
      bettors,
      picks,
      matches: [...matches, finalMatch],
      outcome: scenarioOutcome,
    });

    return {
      winnerTeamId,
      winnerName: teamName(winnerTeamId),
      winnerFlag: flagEmoji(winnerTeamId),
      rows: scenarioStandings.slice(0, 3).map((s) => ({
        rank: s.rank,
        name: nameById.get(s.bettorId) ?? s.bettorId,
        avatar: bettorAvatar(s.bettorId),
        total: s.total,
      })),
    };
  });

  return {
    bettors: bettorViews,
    playedMatches,
    totalMatches: matches.length,
    remainingTournamentMatches,
    outcomePending,
    results,
    latestResults,
    matchLog,
    hasPreliminary: results.some((r) => r.preliminary),
    upcoming: upcomingFixtures
      .map((u) => {
        const homeFlag = flagEmoji(u.homeId);
        const awayFlag = flagEmoji(u.awayId);
        const backers: UpcomingBacker[] = [
          ...(ownersByTeam.get(u.homeId) ?? []).map((o) => ({ ...o, flag: homeFlag })),
          ...(ownersByTeam.get(u.awayId) ?? []).map((o) => ({ ...o, flag: awayFlag })),
        ];
        return {
          id: u.id,
          utcDate: u.utcDate,
          homeName: teamName(u.homeId),
          awayName: teamName(u.awayId),
          homeFlag,
          awayFlag,
          backers,
        };
      })
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate)),
    changeStory,
    insights,
    teamOwnership,
    topScorers,
    medalBonuses,
    finalScenarios,
  };
}
