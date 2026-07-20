// Otteluohjelma + tulokset committoituna datana (EI tietokantaa, EI per-selain-
// tilaa). MM-2026:n lohkovaihe (72 ottelua) on generoitu virallisesta
// loppuarvonnasta (lohkot A–L, ks. data/teams.ts).
//
// === TULOSTEN LÄHTEET (kaksi, automaatti + käsin) ===
// 1. AUTOMAATTI: scripts/sync-results.ts hakee football-data.orgista ja
//    kirjoittaa src/data/auto-results.generated.json. GitHub Action ajaa sen
//    ottelupäivinä ja commitoi -> Vercel auto-deplottaa. Älä muokkaa generated-
//    tiedostoa käsin (automaatti ylikirjoittaa sen).
// 2. KÄSIN: lisää korjaus/ohitus OVERRIDES-objektiin alla. Käsin VOITTAA aina
//    automaatin (hyvä korjauksille tai jos API on väärässä/jäljessä).
//
// Ottelun id on muotoa `${lohko}-${kotiId}-${vierasId}`, esim. 'C-BRA-MAR'.

import type { Match, MatchResult, TournamentOutcome } from '../domain/types.js';
import autoData from './auto-results.generated.json';

// Lohkot A–L, joukkueet arvonnan mukaisessa järjestyksessä (id = FIFA-koodi).
export const GROUPS: Record<string, [string, string, string, string]> = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'KSA', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
};

export interface UpcomingFixture {
  id: string;
  utcDate: string; // ISO, esim. "2026-06-15T22:00:00Z"
  homeId: string;
  awayId: string;
}

interface AutoResults {
  results: Record<string, MatchResult>;
  preliminaryIds: string[];
  upcoming?: UpcomingFixture[];
  knockoutFixtures?: UpcomingFixture[];
  fixtureDates?: Record<string, string>;
}
const auto = autoData as AutoResults;

// Tulevat ottelut (automaatin hakemat, aikajärjestyksessä).
export const upcomingFixtures: UpcomingFixture[] = auto.upcoming ?? [];
export const fixtureDates: Record<string, string> = auto.fixtureDates ?? {};

// Käsin tehdyt korjaukset/ohitukset. Voittavat automaatin samalla id:llä.
// Esim. 'C-BRA-MAR': { homeGoals: 1, awayGoals: 1 },
const OVERRIDES: Record<string, MatchResult> = {};

// Lopulliset tulokset = automaatti + käsin (käsin viimeisenä -> voittaa).
const RESULTS: Record<string, MatchResult> = { ...auto.results, ...OVERRIDES };

// Alustavat (kesken) = automaatin merkitsemät, paitsi jos käsin ohitettu
// (manuaalinen ohitus tulkitaan lopulliseksi).
export const preliminaryIds: string[] = auto.preliminaryIds.filter(
  (id) => !(id in OVERRIDES),
);

// Generoi lohkon round-robin (jokainen pari kerran) -> 6 ottelua / lohko.
function groupMatches(): Match[] {
  const out: Match[] = [];
  for (const [group, teamIds] of Object.entries(GROUPS)) {
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const home = teamIds[i]!;
        const away = teamIds[j]!;
        const id = `${group}-${home}-${away}`;
        out.push({
          id,
          homeTeamId: home,
          awayTeamId: away,
          result: RESULTS[id] ?? null,
        });
      }
    }
  }
  return out;
}

// === PUDOTUSPELIT (R32 → finaali) ===
// Automaatti tuo ratkaistut pudotuspeliparit football-data.orgista sitä mukaa
// kun joukkueet ovat tiedossa. TBD-parit jätetään pois, kunnes API palauttaa
// oikeat joukkueet.
const KNOCKOUT_MATCHES: Match[] = (auto.knockoutFixtures ?? []).map((fixture) => ({
  id: fixture.id,
  homeTeamId: fixture.homeId,
  awayTeamId: fixture.awayId,
  result: RESULTS[fixture.id] ?? null,
}));

export const matches: Match[] = [...groupMatches(), ...KNOCKOUT_MATCHES];

export const outcome: TournamentOutcome = {
  championTeamId: 'ESP',
  silverTeamId: 'ARG',
  bronzeTeamId: 'ENG',
  bestPlayerId: 'rodri',
  topScorerId: 'mbappe',
};
