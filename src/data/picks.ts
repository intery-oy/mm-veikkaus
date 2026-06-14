// Veikkaukset (§8.3) — 12 perheenjäsentä. Auktoritatiivinen, kupongista.
//
// Joukkueet kirjoitetaan suomenkielisinä näyttöniminä ja mäpätään §8.1:n
// id:hin teamIdByName-avaimella. Pelaajat ovat §8.2:n kanonisia id:itä.
// normalizePlayerId() vahvistaa, että jokainen pelaaja-id on totuuslähteessä.

import type { Bettor, BettorPicks, PickRole, TeamPick } from '../domain/types.js';
import { teamIdByName } from './teams.js';
import { normalizePlayerId } from './players.js';

export const bettors: Bettor[] = [
  { id: 'kaarlo', name: 'Kaarlo' },
  { id: 'alvar', name: 'Alvar' },
  { id: 'aura', name: 'Aura' },
  { id: 'helga', name: 'Helga' },
  { id: 'harri', name: 'Harri' },
  { id: 'leena', name: 'Leena' },
  { id: 'juha', name: 'Juha' },
  { id: 'jossu', name: 'Jossu' },
  { id: 'mummo', name: 'Mummo' },
  { id: 'pappa', name: 'Pappa' },
  { id: 'ilpo', name: 'Ilpo' },
  { id: 'meeri', name: 'Meeri' },
];

// Raakavalinnat kupongin järjestyksessä: champion, silver, bronze, dark_horse,
// wild_card (joukkueet näyttöniminä), sekä bestPlayer/topScorer id:nä.
interface RawPick {
  bettorId: string;
  champion: string;
  silver: string;
  bronze: string;
  dark_horse: string;
  wild_card: string;
  bestPlayer: string;
  topScorer: string;
}

const rawPicks: RawPick[] = [
  { bettorId: 'kaarlo', champion: 'Brasilia',  silver: 'Kolumbia',   bronze: 'Espanja',    dark_horse: 'Marokko',   wild_card: 'Turkki',     bestPlayer: 'neymar',   topScorer: 'raphinha' },
  { bettorId: 'alvar',  champion: 'Saksa',     silver: 'Alankomaat', bronze: 'Portugali',  dark_horse: 'Ruotsi',    wild_card: 'Brasilia',   bestPlayer: 'musiala',  topScorer: 'ronaldo' },
  { bettorId: 'aura',   champion: 'Saksa',     silver: 'Ranska',     bronze: 'Argentiina', dark_horse: 'Portugali', wild_card: 'Espanja',    bestPlayer: 'yamal',    topScorer: 'kane' },
  { bettorId: 'helga',  champion: 'Espanja',   silver: 'Argentiina', bronze: 'Ranska',     dark_horse: 'Saksa',     wild_card: 'Englanti',   bestPlayer: 'messi',    topScorer: 'mbappe' },
  { bettorId: 'harri',  champion: 'Espanja',   silver: 'Argentiina', bronze: 'Saksa',      dark_horse: 'Ranska',    wild_card: 'Belgia',     bestPlayer: 'messi',    topScorer: 'lautaro' },
  { bettorId: 'leena',  champion: 'Saksa',     silver: 'Argentiina', bronze: 'Kolumbia',   dark_horse: 'Espanja',   wild_card: 'Ranska',     bestPlayer: 'wirtz',    topScorer: 'haaland' },
  { bettorId: 'juha',   champion: 'Ranska',    silver: 'Argentiina', bronze: 'Espanja',    dark_horse: 'Englanti',  wild_card: 'Portugali',  bestPlayer: 'mbappe',   topScorer: 'kane' },
  { bettorId: 'jossu',  champion: 'Brasilia',  silver: 'Argentiina', bronze: 'Uruguay',    dark_horse: 'Ranska',    wild_card: 'Saksa',      bestPlayer: 'vinicius', topScorer: 'lautaro' },
  { bettorId: 'mummo',  champion: 'Saksa',     silver: 'Brasilia',   bronze: 'Portugali',  dark_horse: 'Ranska',    wild_card: 'Argentiina', bestPlayer: 'rodri',    topScorer: 'alvarez' },
  { bettorId: 'pappa',  champion: 'Saksa',     silver: 'Ranska',     bronze: 'Espanja',    dark_horse: 'Marokko',   wild_card: 'Kroatia',    bestPlayer: 'musiala',  topScorer: 'kane' },
  { bettorId: 'ilpo',   champion: 'Ranska',    silver: 'Englanti',   bronze: 'Portugali',  dark_horse: 'Saksa',     wild_card: 'Brasilia',   bestPlayer: 'dembele',  topScorer: 'mbappe' },
  { bettorId: 'meeri',  champion: 'Espanja',   silver: 'Ranska',     bronze: 'Englanti',   dark_horse: 'Argentiina',wild_card: 'Brasilia',   bestPlayer: 'yamal',    topScorer: 'mbappe' },
];

function resolveTeamId(name: string, bettorId: string, role: PickRole): string {
  const id = teamIdByName.get(name);
  if (!id) {
    throw new Error(`Tuntematon joukkue "${name}" (veikkaaja ${bettorId}, rooli ${role})`);
  }
  return id;
}

function resolvePlayerId(raw: string, bettorId: string, slot: string): string {
  const id = normalizePlayerId(raw);
  if (!id) {
    throw new Error(`Tuntematon pelaaja "${raw}" (veikkaaja ${bettorId}, ${slot})`);
  }
  return id;
}

export const picks: BettorPicks[] = rawPicks.map((r) => {
  const teams: TeamPick[] = [
    { role: 'champion', teamId: resolveTeamId(r.champion, r.bettorId, 'champion') },
    { role: 'silver', teamId: resolveTeamId(r.silver, r.bettorId, 'silver') },
    { role: 'bronze', teamId: resolveTeamId(r.bronze, r.bettorId, 'bronze') },
    { role: 'dark_horse', teamId: resolveTeamId(r.dark_horse, r.bettorId, 'dark_horse') },
    { role: 'wild_card', teamId: resolveTeamId(r.wild_card, r.bettorId, 'wild_card') },
  ];
  return {
    bettorId: r.bettorId,
    teams,
    bestPlayerId: resolvePlayerId(r.bestPlayer, r.bettorId, 'bestPlayer'),
    topScorerId: resolvePlayerId(r.topScorer, r.bettorId, 'topScorer'),
  };
});
