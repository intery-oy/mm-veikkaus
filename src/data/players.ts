// Pelaajaehdokkaat (§8.2) — paras pelaaja / maalikuningas.
//
// `id` on kanoninen; `variants` ovat kupongilla esiintyneet kirjoitusasut,
// jotka mäppäytyvät samaan id:hen. Tämä on palkintobonusten täsmäytyksen
// totuuslähde (§9.4): pisteytysmoottori vertaa id-tasolla, ja kaikki
// kirjoitusasut normalisoidaan id:hin tässä ennen moottoriin syöttöä.

import type { Player } from '../domain/types.js';

interface PlayerSeed extends Player {
  variants: string[];
}

export const playerSeeds: PlayerSeed[] = [
  { id: 'neymar', name: 'Neymar Jr', variants: ['Neymar Jr'] },
  { id: 'musiala', name: 'Jamal Musiala', variants: ['J. Musiala', 'Musiala'] },
  { id: 'yamal', name: 'Lamine Yamal', variants: ['Yamal', 'L. Yamal'] },
  { id: 'messi', name: 'Lionel Messi', variants: ['L. Messi'] },
  { id: 'wirtz', name: 'Florian Wirtz', variants: ['Wirtz'] },
  { id: 'mbappe', name: 'Kylian Mbappé', variants: ['K. Mbappé'] },
  { id: 'vinicius', name: 'Vinícius Júnior', variants: ['V. Júnior'] },
  { id: 'rodri', name: 'Rodri', variants: ['Rodri'] },
  { id: 'dembele', name: 'Ousmane Dembélé', variants: ['O. Dembélé'] },
  { id: 'raphinha', name: 'Raphinha', variants: ['Raphinha'] },
  { id: 'ronaldo', name: 'Cristiano Ronaldo', variants: ['C. Ronaldo'] },
  { id: 'kane', name: 'Harry Kane', variants: ['Kane', 'H. Kane'] },
  { id: 'lautaro', name: 'Lautaro Martínez', variants: ['L. Martínez'] },
  { id: 'haaland', name: 'Erling Haaland', variants: ['Haaland'] },
  { id: 'alvarez', name: 'Julián Álvarez', variants: ['J. Álvarez'] },
];

export const players: Player[] = playerSeeds.map(({ id, name }) => ({ id, name }));

export const playerById: Map<string, Player> = new Map(players.map((p) => [p.id, p]));

// Normalisointiavaimet: kanoninen nimi + kaikki variantit -> id.
// Avaimet siivotaan (trim + lowercase + aksentit pois), jotta täsmäys on
// robusti kupongin pieniä eroja kohtaan ("Mbappe" ~ "Mbappé").
function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const playerIdByKey: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const seed of playerSeeds) {
    m.set(normalizeKey(seed.id), seed.id);
    m.set(normalizeKey(seed.name), seed.id);
    for (const v of seed.variants) m.set(normalizeKey(v), seed.id);
  }
  return m;
})();

/**
 * Mäppää kupongilla esiintyvän kirjoitusasun (tai kanonisen nimen/id:n)
 * pelaajan kanoniseksi id:ksi. Palauttaa null jos tuntematon.
 */
export function normalizePlayerId(raw: string): string | null {
  return playerIdByKey.get(normalizeKey(raw)) ?? null;
}
