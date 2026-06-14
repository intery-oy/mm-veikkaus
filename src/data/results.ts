// Otteluohjelma + tulokset committoituna datana (EI tietokantaa, EI per-selain-
// tilaa). MM-2026:n lohkovaihe (72 ottelua) on generoitu virallisesta
// loppuarvonnasta (lohkot A–L, ks. data/teams.ts). Pudotuspeleja (R32→finaali,
// 32 ottelua) EI ole tässä: niiden joukkueet selviävät vasta lohkovaiheen
// jälkeen, eikä niitä saa arvata. Ne lisätään kun parit ovat tiedossa.
//
// === NÄIN LISÄÄT / PÄIVITÄT TULOKSEN ===
// Lisää rivi RESULTS-objektiin: ottelun id -> { homeGoals, awayGoals }.
// Ottelun id on muotoa `${lohko}-${kotiId}-${vierasId}`, esim. 'C-BRA-MAR'.
// Koti/vieras on nimellinen (virallista järjestystä ei seedattu) — syötä
// tulos ottelun id:n osoittamassa koti–vieras-suunnassa. Sitten:
//   git commit -am "Tulos: ..." && git push   -> Vercel auto-deplottaa.

import type { Match, MatchResult, TournamentOutcome } from '../domain/types.js';

// Lohkot A–L, joukkueet arvonnan mukaisessa järjestyksessä (id = FIFA-koodi).
const GROUPS: Record<string, [string, string, string, string]> = {
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

// Pelatut tulokset ottelun id:llä. Täytä tämä kisojen edetessä.
const RESULTS: Record<string, MatchResult> = {
  // Brasilia–Marokko (New Jersey), ensimmäinen veikattuja joukkueita sisältävä peli.
  'C-BRA-MAR': { homeGoals: 2, awayGoals: 0 },
};

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

// === PUDOTUSPELIT (R32 → finaali, 32 ottelua) ===
// Lisätään kun lohkovaihe on ratkennut (27.6.2026) ja parit ovat tiedossa.
// Täytä id:llä `${kierros}-${kotiId}-${vierasId}` (esim. 'R32-BRA-URU') ja
// aseta tulos RESULTS-objektiin samalla id:llä, kuten lohko-otteluissa.
// Kierroskoodit: R32, R16, QF, SF, BRONZE, FINAL.
const KNOCKOUT_MATCHES: Match[] = [
  // esim. { id: 'R32-BRA-...', homeTeamId: 'BRA', awayTeamId: '...', result: null },
];

export const matches: Match[] = [...groupMatches(), ...KNOCKOUT_MATCHES];

export const outcome: TournamentOutcome = {
  championTeamId: null,
  silverTeamId: null,
  bronzeTeamId: null,
  bestPlayerId: null,
  topScorerId: null,
};
