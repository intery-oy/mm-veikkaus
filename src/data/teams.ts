// Joukkueet (§8.1). id = FIFA-koodi, name = suomenkielinen näyttönimi.
//
// Tämä on Phase 0:n auktoritatiivinen lista: tasan ne 15 joukkuetta, joita
// perheenjäsenet veikkasivat (§8.3). MM-2026:n täysi 48 joukkueen lista
// (§9.2) seedataan Phase 1:ssä virallisesta lähteestä — Phase 0:n testit
// eivät sitä vaadi, eikä koodissa pidä keksiä koodeja/nimiä arvaamalla.

import type { Team } from '../domain/types.js';

export const teams: Team[] = [
  { id: 'BRA', name: 'Brasilia', fifaCode: 'BRA' },
  { id: 'GER', name: 'Saksa', fifaCode: 'GER' },
  { id: 'ESP', name: 'Espanja', fifaCode: 'ESP' },
  { id: 'FRA', name: 'Ranska', fifaCode: 'FRA' },
  { id: 'ARG', name: 'Argentiina', fifaCode: 'ARG' },
  { id: 'NED', name: 'Alankomaat', fifaCode: 'NED' },
  { id: 'POR', name: 'Portugali', fifaCode: 'POR' },
  { id: 'ENG', name: 'Englanti', fifaCode: 'ENG' },
  { id: 'MAR', name: 'Marokko', fifaCode: 'MAR' },
  { id: 'TUR', name: 'Turkki', fifaCode: 'TUR' },
  { id: 'SWE', name: 'Ruotsi', fifaCode: 'SWE' },
  { id: 'BEL', name: 'Belgia', fifaCode: 'BEL' },
  { id: 'CRO', name: 'Kroatia', fifaCode: 'CRO' },
  { id: 'COL', name: 'Kolumbia', fifaCode: 'COL' },
  { id: 'URU', name: 'Uruguay', fifaCode: 'URU' },
];

export const teamById: Map<string, Team> = new Map(teams.map((t) => [t.id, t]));

// Apuri seed-datalle: suomenkielinen nimi -> id. Käytetään picks.ts:ssä, jotta
// valinnat voidaan kirjoittaa näyttöniminä kupongin mukaisesti.
export const teamIdByName: Map<string, string> = new Map(teams.map((t) => [t.name, t.id]));
