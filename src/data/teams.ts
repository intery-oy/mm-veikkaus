// Joukkueet (§8.1) — kaikki 48 MM-2026:n joukkuetta. id = FIFA-koodi,
// name = suomenkielinen näyttönimi.
//
// Lähde: 2.12.2025 loppuarvonta + maaliskuun 2026 playoffit. UEFA-playoffien
// voittajat: Bosnia ja Hertsegovina, Ruotsi, Turkki, Tšekki. Interkontinentaalit:
// Kongon dem. tasavalta, Irak. (Wikipedia: 2026 FIFA World Cup qualification.)
//
// Joukkueet on järjestetty lohkoittain (A–L). Veikatut 15 joukkuetta (§8.3)
// sisältyvät tähän samoilla id:illä kuin Phase 0:ssa.

import type { Team } from '../domain/types.js';

export const teams: Team[] = [
  // Lohko A
  { id: 'MEX', name: 'Meksiko', fifaCode: 'MEX' },
  { id: 'RSA', name: 'Etelä-Afrikka', fifaCode: 'RSA' },
  { id: 'KOR', name: 'Etelä-Korea', fifaCode: 'KOR' },
  { id: 'CZE', name: 'Tšekki', fifaCode: 'CZE' },
  // Lohko B
  { id: 'CAN', name: 'Kanada', fifaCode: 'CAN' },
  { id: 'BIH', name: 'Bosnia ja Hertsegovina', fifaCode: 'BIH' },
  { id: 'QAT', name: 'Qatar', fifaCode: 'QAT' },
  { id: 'SUI', name: 'Sveitsi', fifaCode: 'SUI' },
  // Lohko C
  { id: 'BRA', name: 'Brasilia', fifaCode: 'BRA' },
  { id: 'MAR', name: 'Marokko', fifaCode: 'MAR' },
  { id: 'HAI', name: 'Haiti', fifaCode: 'HAI' },
  { id: 'SCO', name: 'Skotlanti', fifaCode: 'SCO' },
  // Lohko D
  { id: 'USA', name: 'Yhdysvallat', fifaCode: 'USA' },
  { id: 'PAR', name: 'Paraguay', fifaCode: 'PAR' },
  { id: 'AUS', name: 'Australia', fifaCode: 'AUS' },
  { id: 'TUR', name: 'Turkki', fifaCode: 'TUR' },
  // Lohko E
  { id: 'GER', name: 'Saksa', fifaCode: 'GER' },
  { id: 'CUW', name: 'Curaçao', fifaCode: 'CUW' },
  { id: 'CIV', name: 'Norsunluurannikko', fifaCode: 'CIV' },
  { id: 'ECU', name: 'Ecuador', fifaCode: 'ECU' },
  // Lohko F
  { id: 'NED', name: 'Alankomaat', fifaCode: 'NED' },
  { id: 'JPN', name: 'Japani', fifaCode: 'JPN' },
  { id: 'SWE', name: 'Ruotsi', fifaCode: 'SWE' },
  { id: 'TUN', name: 'Tunisia', fifaCode: 'TUN' },
  // Lohko G
  { id: 'BEL', name: 'Belgia', fifaCode: 'BEL' },
  { id: 'EGY', name: 'Egypti', fifaCode: 'EGY' },
  { id: 'IRN', name: 'Iran', fifaCode: 'IRN' },
  { id: 'NZL', name: 'Uusi-Seelanti', fifaCode: 'NZL' },
  // Lohko H
  { id: 'ESP', name: 'Espanja', fifaCode: 'ESP' },
  { id: 'CPV', name: 'Kap Verde', fifaCode: 'CPV' },
  { id: 'KSA', name: 'Saudi-Arabia', fifaCode: 'KSA' },
  { id: 'URU', name: 'Uruguay', fifaCode: 'URU' },
  // Lohko I
  { id: 'FRA', name: 'Ranska', fifaCode: 'FRA' },
  { id: 'SEN', name: 'Senegal', fifaCode: 'SEN' },
  { id: 'IRQ', name: 'Irak', fifaCode: 'IRQ' },
  { id: 'NOR', name: 'Norja', fifaCode: 'NOR' },
  // Lohko J
  { id: 'ARG', name: 'Argentiina', fifaCode: 'ARG' },
  { id: 'ALG', name: 'Algeria', fifaCode: 'ALG' },
  { id: 'AUT', name: 'Itävalta', fifaCode: 'AUT' },
  { id: 'JOR', name: 'Jordania', fifaCode: 'JOR' },
  // Lohko K
  { id: 'POR', name: 'Portugali', fifaCode: 'POR' },
  { id: 'COD', name: 'Kongon demokraattinen tasavalta', fifaCode: 'COD' },
  { id: 'UZB', name: 'Uzbekistan', fifaCode: 'UZB' },
  { id: 'COL', name: 'Kolumbia', fifaCode: 'COL' },
  // Lohko L
  { id: 'ENG', name: 'Englanti', fifaCode: 'ENG' },
  { id: 'CRO', name: 'Kroatia', fifaCode: 'CRO' },
  { id: 'GHA', name: 'Ghana', fifaCode: 'GHA' },
  { id: 'PAN', name: 'Panama', fifaCode: 'PAN' },
];

export const teamById: Map<string, Team> = new Map(teams.map((t) => [t.id, t]));

// Apuri seed-datalle: suomenkielinen nimi -> id. Käytetään picks.ts:ssä, jotta
// valinnat voidaan kirjoittaa näyttöniminä kupongin mukaisesti.
export const teamIdByName: Map<string, string> = new Map(teams.map((t) => [t.name, t.id]));
