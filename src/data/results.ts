// Ottelutulokset committoituna datana (EI per-selain-tilaa, EI tietokantaa).
//
// Näin lisäät / päivität tuloksen:
//   1. Etsi tai lisää ottelu alle (homeTeamId/awayTeamId = §8.1 FIFA-koodit).
//   2. Aseta result: { homeGoals, awayGoals }. null = pelaamatta ("kesken").
//   3. Committaa + pushaa -> Vercel auto-deplottaa -> taulukko elää.
//
// Appi laskee standingsin näistä otteluista + seed-valinnoista (data/picks.ts).
// TournamentOutcome (mestari/hopea/pronssi/paras pelaaja/maalikuningas) pidetään
// toistaiseksi kauttaaltaan null:ina -> mitali- ja palkintobonukset ovat 0
// kunnes kisat ratkeavat (täytetään myöhemmin samaan tyyliin).

import type { Match, TournamentOutcome } from '../domain/types.js';

export const matches: Match[] = [
  // Ensimmäinen veikattuja joukkueita sisältävä ottelu (New Jersey).
  // Täytä tulos kun peli on pelattu — korvaa null { homeGoals, awayGoals }:lla.
  {
    id: 'BRA-MAR',
    homeTeamId: 'BRA',
    awayTeamId: 'MAR',
    result: { homeGoals: 2, awayGoals: 0 }
  },
];

export const outcome: TournamentOutcome = {
  championTeamId: null,
  silverTeamId: null,
  bronzeTeamId: null,
  bestPlayerId: null,
  topScorerId: null,
};
