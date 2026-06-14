// Puhdas pisteytysmoottori (§4, §5).
//
// computeStandings: ScoringInput -> BettorStanding[]
//
// Moottori ei lue kelloa eikä mitään ulkoista — pelkkä input -> output.
// Ei DB:tä, ei verkkoa, ei Date.now()-tyyppistä epädeterminismiä.

import type {
  BettorPicks,
  BettorStanding,
  Match,
  ScoringInput,
  TournamentOutcome,
} from './types.js';

// Pistearvot kupongista (§4). Yksi totuuslähde — invariantti 4 nojaa näihin.
const WIN_POINTS = 3;
const DRAW_POINTS = 1;
const LOSS_POINTS = 0;

const CHAMPION_BONUS = 15;
const SILVER_BONUS = 10;
const BRONZE_BONUS = 6;

const BEST_PLAYER_BONUS = 10;
const TOP_SCORER_BONUS = 10;

/**
 * Ottelupisteet yhdelle omistetulle joukkueelle yhdessä pelatussa ottelussa.
 * Rooli ei vaikuta — joukkue on joukkue (§4).
 */
function pointsForTeamInMatch(teamId: string, match: Match): number {
  // Kutsuja takaa, että match.result != null ja teamId on mukana ottelussa.
  const result = match.result!;
  const isHome = match.homeTeamId === teamId;
  const own = isHome ? result.homeGoals : result.awayGoals;
  const opp = isHome ? result.awayGoals : result.homeGoals;
  if (own > opp) return WIN_POINTS;
  if (own === opp) return DRAW_POINTS;
  return LOSS_POINTS;
}

/**
 * Ottelupisteet yhdelle veikkaajalle.
 *
 * Summa kaikista pelatuista otteluista, joissa jokin omistettu joukkue on
 * mukana. Jos veikkaaja omistaa molemmat ottelun joukkueet, molemmat puolet
 * lasketaan erikseen (§4: tasapeli 1+1=2, voitto/tappio 3+0=3).
 *
 * ownedTeamIds on Set -> sama joukkue kahdessa ruudussa ei tuplaa pisteitä
 * (invariantti 5).
 */
function matchPointsFor(ownedTeamIds: Set<string>, matches: Match[]): number {
  let total = 0;
  for (const match of matches) {
    if (match.result === null) continue;
    if (ownedTeamIds.has(match.homeTeamId)) {
      total += pointsForTeamInMatch(match.homeTeamId, match);
    }
    if (ownedTeamIds.has(match.awayTeamId)) {
      total += pointsForTeamInMatch(match.awayTeamId, match);
    }
  }
  return total;
}

/**
 * Mitalibonus: myönnetään vain jos joukkue on siinä roolissa, johon veikkaaja
 * sen laittoi, ja outcome-ruutu on asetettu (§4). Kukin osuma korkeintaan
 * kerran, kiinteällä arvolla (invariantti 4).
 */
function medalBonusFor(
  teamByRole: Map<string, string>,
  outcome: TournamentOutcome,
): BettorStanding['medalBonus'] {
  const champion =
    outcome.championTeamId !== null && teamByRole.get('champion') === outcome.championTeamId
      ? CHAMPION_BONUS
      : 0;
  const silver =
    outcome.silverTeamId !== null && teamByRole.get('silver') === outcome.silverTeamId
      ? SILVER_BONUS
      : 0;
  const bronze =
    outcome.bronzeTeamId !== null && teamByRole.get('bronze') === outcome.bronzeTeamId
      ? BRONZE_BONUS
      : 0;
  return { champion, silver, bronze, total: champion + silver + bronze };
}

/**
 * Palkintobonus: paras pelaaja / maalikuningas oikein (§4).
 * Vertailu id-tasolla; nimien normalisointi tehdään datan syötössä
 * (ks. data/players.ts).
 */
function prizeBonusFor(
  picks: BettorPicks,
  outcome: TournamentOutcome,
): BettorStanding['prizeBonus'] {
  const bestPlayer =
    outcome.bestPlayerId !== null && picks.bestPlayerId === outcome.bestPlayerId
      ? BEST_PLAYER_BONUS
      : 0;
  const topScorer =
    outcome.topScorerId !== null && picks.topScorerId === outcome.topScorerId
      ? TOP_SCORER_BONUS
      : 0;
  return { bestPlayer, topScorer, total: bestPlayer + topScorer };
}

/**
 * Järjestysavain rankille (§5, §9 tasapelin ratkaisu — toteutettu ehdotus):
 *   total laskevasti
 *   -> bonus-summa laskevasti
 *   -> matchPoints laskevasti
 *   -> nimi nousevasti
 *
 * Sama avain (kaikki neljä komponenttia) -> sama rank (competition ranking,
 * "1224"-tyyli: jaetut sijat aiheuttavat hypyn seuraavaan). Koska nimet ovat
 * uniikkeja, käytännössä jokainen saa oman sijan 1..N.
 */
/**
 * Näyttöjärjestys (§3 kohta 3): total laskevasti, ja saman totalin sisällä
 * nimi nousevasti pelkkänä vakaana sekundäärilajitteluna. Nimi EI erottele
 * sijanumeroa — se ratkaisee vain rivien näyttöjärjestyksen.
 */
function compareDisplay(
  a: { standing: BettorStanding; name: string },
  b: { standing: BettorStanding; name: string },
): number {
  if (b.standing.total !== a.standing.total) return b.standing.total - a.standing.total;
  return a.name.localeCompare(b.name);
}

export function computeStandings(input: ScoringInput): BettorStanding[] {
  const { bettors, picks, matches, outcome } = input;

  const picksByBettor = new Map<string, BettorPicks>();
  for (const p of picks) picksByBettor.set(p.bettorId, p);

  // Laske raakapisteet jokaiselle veikkaajalle.
  const computed: Array<{ standing: BettorStanding; name: string }> = bettors.map((bettor) => {
    const bettorPicks = picksByBettor.get(bettor.id);

    let matchPoints = 0;
    let medalBonus: BettorStanding['medalBonus'] = { champion: 0, silver: 0, bronze: 0, total: 0 };
    let prizeBonus: BettorStanding['prizeBonus'] = { bestPlayer: 0, topScorer: 0, total: 0 };

    if (bettorPicks) {
      const ownedTeamIds = new Set(bettorPicks.teams.map((t) => t.teamId));
      const teamByRole = new Map<string, string>();
      for (const t of bettorPicks.teams) teamByRole.set(t.role, t.teamId);

      matchPoints = matchPointsFor(ownedTeamIds, matches);
      medalBonus = medalBonusFor(teamByRole, outcome);
      prizeBonus = prizeBonusFor(bettorPicks, outcome);
    }

    const total = matchPoints + medalBonus.total + prizeBonus.total;

    return {
      name: bettor.name,
      standing: {
        bettorId: bettor.id,
        matchPoints,
        medalBonus,
        prizeBonus,
        total,
        rank: 0, // täytetään järjestyksen jälkeen
      },
    };
  });

  // Järjestä näyttöä varten, ja anna rank pelkän totalin perusteella
  // (competition ranking / "jaettu sija"): sama total -> sama sija, ja seuraava
  // eri total hyppää listan paikkaan (kuusi ykköstä -> seuraava on 7.).
  computed.sort(compareDisplay);

  computed.forEach((entry, index) => {
    const prev = index > 0 ? computed[index - 1] : undefined;
    if (prev && prev.standing.total === entry.standing.total) {
      entry.standing.rank = prev.standing.rank; // jaettu sija
    } else {
      entry.standing.rank = index + 1; // hyppy edellisten lukumäärän verran
    }
  });

  return computed.map((entry) => entry.standing);
}
