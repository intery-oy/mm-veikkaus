// Suoritettava spesifikaatio: invariantit (§6) + lasketut esimerkit (§7).
// Fixturet ovat synteettisiä (§7, §8.4) — määritellään testissä, ei oikeaa
// otteluohjelmaa. Seed-valinnat tulevat data/picks.ts:stä.

import { describe, expect, it } from 'vitest';
import { computeStandings } from './scoring.js';
import type { Match, ScoringInput, TournamentOutcome } from './types.js';
import { bettors, picks } from '../data/picks.js';
import { normalizePlayerId } from '../data/players.js';

const EMPTY_OUTCOME: TournamentOutcome = {
  championTeamId: null,
  silverTeamId: null,
  bronzeTeamId: null,
  bestPlayerId: null,
  topScorerId: null,
};

function match(id: string, home: string, away: string, hg?: number, ag?: number): Match {
  return {
    id,
    homeTeamId: home,
    awayTeamId: away,
    result: hg === undefined || ag === undefined ? null : { homeGoals: hg, awayGoals: ag },
  };
}

function baseInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    bettors,
    picks,
    matches: [],
    outcome: EMPTY_OUTCOME,
    ...overrides,
  };
}

function byBettor(input: ScoringInput): Map<string, ReturnType<typeof computeStandings>[number]> {
  return new Map(computeStandings(input).map((s) => [s.bettorId, s]));
}

// Pieni siemenpohjainen PRNG property-based-tarkistuksiin (deterministinen).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Kaikki seed-valinnoissa esiintyvät joukkueet (satunnaisotteluiden poolille).
const ALL_TEAM_IDS = Array.from(new Set(picks.flatMap((p) => p.teams.map((t) => t.teamId))));

function randomInput(rng: () => number): ScoringInput {
  const n = Math.floor(rng() * 8);
  const matches: Match[] = [];
  for (let i = 0; i < n; i++) {
    const home = ALL_TEAM_IDS[Math.floor(rng() * ALL_TEAM_IDS.length)]!;
    let away = ALL_TEAM_IDS[Math.floor(rng() * ALL_TEAM_IDS.length)]!;
    if (away === home) away = ALL_TEAM_IDS[(ALL_TEAM_IDS.indexOf(home) + 1) % ALL_TEAM_IDS.length]!;
    const played = rng() > 0.3;
    matches.push(
      played
        ? match(`r${i}`, home, away, Math.floor(rng() * 4), Math.floor(rng() * 4))
        : match(`r${i}`, home, away),
    );
  }
  return baseInput({ matches });
}

describe('invariantit (§6)', () => {
  it('1. determinismi — sama input kahdesti -> syvästi yhtäläinen output', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 50; i++) {
      const input = randomInput(rng);
      expect(computeStandings(input)).toEqual(computeStandings(input));
    }
  });

  it('2. säilyvyys — total ja osasummat täsmäävät', () => {
    const rng = mulberry32(999);
    for (let i = 0; i < 50; i++) {
      const input = randomInput(rng);
      // satunnainen outcome mukaan, jotta bonukset elävät
      input.outcome = {
        championTeamId: rng() > 0.5 ? 'ESP' : null,
        silverTeamId: rng() > 0.5 ? 'ARG' : null,
        bronzeTeamId: rng() > 0.5 ? 'FRA' : null,
        bestPlayerId: rng() > 0.5 ? 'yamal' : null,
        topScorerId: rng() > 0.5 ? 'mbappe' : null,
      };
      for (const s of computeStandings(input)) {
        expect(s.medalBonus.total).toBe(
          s.medalBonus.champion + s.medalBonus.silver + s.medalBonus.bronze,
        );
        expect(s.prizeBonus.total).toBe(s.prizeBonus.bestPlayer + s.prizeBonus.topScorer);
        expect(s.total).toBe(s.matchPoints + s.medalBonus.total + s.prizeBonus.total);
      }
    }
  });

  it('3. ottelupisteiden monotonisuus — tuloksen lisäys ei laske kenenkään matchPointsia', () => {
    const rng = mulberry32(424242);
    for (let i = 0; i < 30; i++) {
      const input = randomInput(rng);
      // varmista että on vähintään yksi pelaamaton ottelu, joka saa tuloksen
      const matches = [...input.matches, match('extra', 'BRA', 'MAR')];
      const before = byBettor(baseInput({ matches }));

      const matchesAfter = matches.map((m) =>
        m.id === 'extra' ? match('extra', 'BRA', 'MAR', 2, 0) : m,
      );
      const after = byBettor(baseInput({ matches: matchesAfter }));

      for (const bettor of bettors) {
        expect(after.get(bettor.id)!.matchPoints).toBeGreaterThanOrEqual(
          before.get(bettor.id)!.matchPoints,
        );
      }
    }
  });

  it('4. bonuksen idempotenssi — champion-osuma on täsmälleen +15 vaikka joukkue pelaa monta ottelua', () => {
    const matches: Match[] = [
      match('m1', 'ESP', 'GER', 1, 0),
      match('m2', 'ESP', 'FRA', 2, 2),
      match('m3', 'ARG', 'ESP', 0, 3),
    ];
    const outcome: TournamentOutcome = { ...EMPTY_OUTCOME, championTeamId: 'ESP' };
    const standings = byBettor(baseInput({ matches, outcome }));
    // Helga, Harri, Meeri laittoivat Espanjan champion-ruutuun.
    for (const id of ['helga', 'harri', 'meeri']) {
      expect(standings.get(id)!.medalBonus.champion).toBe(15);
    }
  });

  it('5. distinct-joukkue per ottelu — sama joukkue kahdessa ruudussa ei tuplaa ottelupisteitä', () => {
    const dupBettors = [{ id: 'dup', name: 'Dup' }];
    const dupPicks = [
      {
        bettorId: 'dup',
        teams: [
          { role: 'champion' as const, teamId: 'BRA' },
          { role: 'silver' as const, teamId: 'BRA' },
          { role: 'bronze' as const, teamId: 'GER' },
          { role: 'dark_horse' as const, teamId: 'FRA' },
          { role: 'wild_card' as const, teamId: 'ESP' },
        ],
        bestPlayerId: 'neymar',
        topScorerId: 'kane',
      },
    ];
    const matches = [match('m1', 'BRA', 'MAR', 2, 0)];
    const standings = byBettor({
      bettors: dupBettors,
      picks: dupPicks,
      matches,
      outcome: EMPTY_OUTCOME,
    });
    // BRA voitti: 3 (ei 6, vaikka kahdessa ruudussa).
    expect(standings.get('dup')!.matchPoints).toBe(3);
  });

  it('6. tyhjä outcome — kaikki bonukset 0 ja total === matchPoints', () => {
    const rng = mulberry32(777);
    for (let i = 0; i < 30; i++) {
      const input = randomInput(rng); // outcome on EMPTY_OUTCOME
      for (const s of computeStandings(input)) {
        expect(s.medalBonus.total).toBe(0);
        expect(s.prizeBonus.total).toBe(0);
        expect(s.total).toBe(s.matchPoints);
      }
    }
  });

  it('7. ei pelattuja otteluita -> kaikilla 0 kaikkialla', () => {
    const unplayed = [match('m1', 'BRA', 'MAR'), match('m2', 'ESP', 'GER')];
    for (const s of computeStandings(baseInput({ matches: unplayed }))) {
      expect(s.matchPoints).toBe(0);
      expect(s.total).toBe(0);
    }
  });
});

describe('esimerkki A — Brasilia 2–0 Marokko, outcome tyhjä (§7)', () => {
  const standings = byBettor(baseInput({ matches: [match('m1', 'BRA', 'MAR', 2, 0)] }));
  const expected: Record<string, number> = {
    kaarlo: 3,
    alvar: 3,
    jossu: 3,
    mummo: 3,
    ilpo: 3,
    meeri: 3,
    pappa: 0,
    aura: 0,
    helga: 0,
    harri: 0,
    leena: 0,
    juha: 0,
  };
  for (const [id, pts] of Object.entries(expected)) {
    it(`${id} -> ${pts}`, () => {
      expect(standings.get(id)!.matchPoints).toBe(pts);
      expect(standings.get(id)!.total).toBe(pts);
    });
  }
});

describe('esimerkki B — Brasilia 1–1 Marokko (§7)', () => {
  const standings = byBettor(baseInput({ matches: [match('m1', 'BRA', 'MAR', 1, 1)] }));
  const expected: Record<string, number> = {
    kaarlo: 2, // omistaa BRA + MAR -> 1 + 1
    alvar: 1,
    jossu: 1,
    mummo: 1,
    ilpo: 1,
    meeri: 1,
    pappa: 1, // omistaa MAR
    aura: 0,
    helga: 0,
    harri: 0,
    leena: 0,
    juha: 0,
  };
  for (const [id, pts] of Object.entries(expected)) {
    it(`${id} -> ${pts}`, () => {
      expect(standings.get(id)!.matchPoints).toBe(pts);
      expect(standings.get(id)!.total).toBe(pts);
    });
  }
});

describe('esimerkki C — pelkkä outcome, ei otteluita (§7)', () => {
  const outcome: TournamentOutcome = {
    championTeamId: 'ESP',
    silverTeamId: 'ARG',
    bronzeTeamId: 'FRA',
    bestPlayerId: 'yamal',
    topScorerId: 'mbappe',
  };
  const standings = byBettor(baseInput({ outcome }));

  const expected: Record<
    string,
    { champion: number; silver: number; bronze: number; bestPlayer: number; topScorer: number; total: number }
  > = {
    helga: { champion: 15, silver: 10, bronze: 6, bestPlayer: 0, topScorer: 10, total: 41 },
    meeri: { champion: 15, silver: 0, bronze: 0, bestPlayer: 10, topScorer: 10, total: 35 },
    harri: { champion: 15, silver: 10, bronze: 0, bestPlayer: 0, topScorer: 0, total: 25 },
    leena: { champion: 0, silver: 10, bronze: 0, bestPlayer: 0, topScorer: 0, total: 10 },
    juha: { champion: 0, silver: 10, bronze: 0, bestPlayer: 0, topScorer: 0, total: 10 },
    jossu: { champion: 0, silver: 10, bronze: 0, bestPlayer: 0, topScorer: 0, total: 10 },
    aura: { champion: 0, silver: 0, bronze: 0, bestPlayer: 10, topScorer: 0, total: 10 },
    ilpo: { champion: 0, silver: 0, bronze: 0, bestPlayer: 0, topScorer: 10, total: 10 },
    kaarlo: { champion: 0, silver: 0, bronze: 0, bestPlayer: 0, topScorer: 0, total: 0 },
    alvar: { champion: 0, silver: 0, bronze: 0, bestPlayer: 0, topScorer: 0, total: 0 },
    mummo: { champion: 0, silver: 0, bronze: 0, bestPlayer: 0, topScorer: 0, total: 0 },
    pappa: { champion: 0, silver: 0, bronze: 0, bestPlayer: 0, topScorer: 0, total: 0 },
  };

  for (const [id, e] of Object.entries(expected)) {
    it(`${id} -> total ${e.total}`, () => {
      const s = standings.get(id)!;
      expect(s.matchPoints).toBe(0);
      expect(s.medalBonus.champion).toBe(e.champion);
      expect(s.medalBonus.silver).toBe(e.silver);
      expect(s.medalBonus.bronze).toBe(e.bronze);
      expect(s.prizeBonus.bestPlayer).toBe(e.bestPlayer);
      expect(s.prizeBonus.topScorer).toBe(e.topScorer);
      expect(s.total).toBe(e.total);
    });
  }

  it('tarkistuspiste: Mummon Argentiina on wild_card -> ei hopeabonusta', () => {
    expect(standings.get('mummo')!.medalBonus.silver).toBe(0);
  });

  it('tarkistuspiste: Kaarlon/Juhan/Papan Espanja on muussa kuin champion-ruudussa -> ei mestaribonusta', () => {
    expect(standings.get('kaarlo')!.medalBonus.champion).toBe(0);
    expect(standings.get('juha')!.medalBonus.champion).toBe(0);
    expect(standings.get('pappa')!.medalBonus.champion).toBe(0);
  });

  it('tarkistuspiste: Aura ja Meeri saavat molemmat parhaan pelaajan bonuksen', () => {
    expect(standings.get('aura')!.prizeBonus.bestPlayer).toBe(10);
    expect(standings.get('meeri')!.prizeBonus.bestPlayer).toBe(10);
  });
});

describe('rank-järjestys: jaettu sija pelkästä totalista (§3 kohta 3)', () => {
  const outcome: TournamentOutcome = {
    championTeamId: 'ESP',
    silverTeamId: 'ARG',
    bronzeTeamId: 'FRA',
    bestPlayerId: 'yamal',
    topScorerId: 'mbappe',
  };
  const standings = computeStandings(baseInput({ outcome }));
  const rankById = new Map(standings.map((s) => [s.bettorId, s.rank]));

  it('järjestetty total laskevasti', () => {
    for (let i = 1; i < standings.length; i++) {
      expect(standings[i - 1]!.total).toBeGreaterThanOrEqual(standings[i]!.total);
    }
  });

  it('kärki on Helga (41), sitten Meeri (35), sitten Harri (25)', () => {
    expect(standings[0]!.bettorId).toBe('helga');
    expect(standings[0]!.rank).toBe(1);
    expect(standings[1]!.bettorId).toBe('meeri');
    expect(standings[1]!.rank).toBe(2);
    expect(standings[2]!.bettorId).toBe('harri');
    expect(standings[2]!.rank).toBe(3);
  });

  it('näyttöjärjestys saman totalin sisällä on nimi nousevasti', () => {
    // total 10 -ryhmä esiintyy nimijärjestyksessä
    const tens = standings.filter((s) => s.total === 10).map((s) => s.bettorId);
    expect(tens).toEqual(['aura', 'ilpo', 'jossu', 'juha', 'leena']);
  });

  it('sama total -> sama sija (jaettu), eri total hyppää competition rankingina', () => {
    // total 10 -ryhmä jakaa sijan 4 (1,2,3 ovat helga,meeri,harri)
    for (const id of ['aura', 'ilpo', 'jossu', 'juha', 'leena']) {
      expect(rankById.get(id)).toBe(4);
    }
    // total 0 -ryhmä hyppää sijaan 9 (4 + viisi kymppiläistä)
    for (const id of ['alvar', 'kaarlo', 'mummo', 'pappa']) {
      expect(rankById.get(id)).toBe(9);
    }
  });

  it('nimi ei erottele sijanumeroa: eri nimet samalla totalilla jakavat sijan', () => {
    const tie: ScoringInput = {
      bettors: [
        { id: 'a', name: 'Aatu' },
        { id: 'b', name: 'Beata' },
        { id: 'c', name: 'Cecil' },
      ],
      picks: [
        { bettorId: 'a', teams: [], bestPlayerId: 'x', topScorerId: 'y' },
        { bettorId: 'b', teams: [], bestPlayerId: 'x', topScorerId: 'y' },
        { bettorId: 'c', teams: [], bestPlayerId: 'x', topScorerId: 'y' },
      ],
      matches: [],
      outcome: EMPTY_OUTCOME,
    };
    // kaikilla total 0 -> kaikki jakavat sijan 1
    for (const s of computeStandings(tie)) expect(s.rank).toBe(1);
  });
});

describe('seed-datan eheys (§8)', () => {
  it('12 veikkaajaa, jokaisella tasan 5 joukkuetta uniikein roolein', () => {
    expect(bettors).toHaveLength(12);
    expect(picks).toHaveLength(12);
    for (const p of picks) {
      expect(p.teams).toHaveLength(5);
      expect(new Set(p.teams.map((t) => t.role)).size).toBe(5);
    }
  });

  it('jokainen pisteytetty veikkaaja on bettors-listalla', () => {
    const ids = new Set(bettors.map((b) => b.id));
    for (const p of picks) expect(ids.has(p.bettorId)).toBe(true);
  });

  it('pelaajanimien normalisointi (§8.2): variantit mäppäytyvät kanoniseen id:hen', () => {
    expect(normalizePlayerId('L. Yamal')).toBe('yamal');
    expect(normalizePlayerId('Yamal')).toBe('yamal');
    expect(normalizePlayerId('K. Mbappé')).toBe('mbappe');
    expect(normalizePlayerId('K. Mbappe')).toBe('mbappe'); // aksetiton variantti
    expect(normalizePlayerId('H. Kane')).toBe('kane');
    expect(normalizePlayerId('Tuntematon')).toBe(null);
  });
});
