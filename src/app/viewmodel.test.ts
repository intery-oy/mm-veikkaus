// Savutesti view-modelille: varmistaa että committoitu seed + results.ts
// kääntyy UI:n odottamaksi muodoksi. Pistelaskenta itse on katettu
// domain/scoring.test.ts:ssä.

import { describe, expect, it } from 'vitest';
import { matches, upcomingFixtures } from '../data/results.js';
import { buildPortalData } from './viewmodel.js';

const EXPECTED_REMAINING_BY_STAGE: Record<string, number> = {
  R32: 32,
  R16: 16,
  QF: 8,
  SF: 4,
  '3P': 2,
  F: 1,
  FINAL: 1,
};

describe('buildPortalData', () => {
  const data = buildPortalData();

  it('palauttaa kaikki 12 veikkaajaa rank-järjestyksessä', () => {
    expect(data.bettors).toHaveLength(12);
    for (let i = 1; i < data.bettors.length; i++) {
      expect(data.bettors[i - 1]!.total).toBeGreaterThanOrEqual(data.bettors[i]!.total);
    }
  });

  it('jokaisella on 5 joukkuetta rooleineen + paras pelaaja + maalikuningas', () => {
    for (const b of data.bettors) {
      expect(b.teams).toHaveLength(5);
      expect(b.bestPlayerName).not.toBe('—');
      expect(b.topScorerName).not.toBe('—');
    }
  });

  it('kun pronssi ja alustava maalikuningas on kirjattu, vain paras pelaaja on kesken', () => {
    expect(data.outcomePending).toBe(false);
    expect(data.bettors.find((b) => b.bettorId === 'meeri')?.total).toBe(103);
    expect(data.medalBonuses).toEqual([
      {
        role: 'champion',
        label: 'Mestari',
        points: 15,
        teamName: null,
        flag: null,
        awarded: false,
      },
      {
        role: 'silver',
        label: 'Hopea',
        points: 10,
        teamName: null,
        flag: null,
        awarded: false,
      },
      {
        role: 'bronze',
        label: 'Pronssi',
        points: 6,
        teamName: 'Englanti',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        awarded: true,
      },
    ]);
    for (const b of data.bettors) {
      const bestPlayer = b.bonusSlots.find((slot) => slot.label === 'Paras pelaaja');
      const topScorer = b.bonusSlots.find((slot) => slot.label === 'Maalikuningas');
      expect(bestPlayer?.points).toBeNull();
      expect(bestPlayer?.status).toBe('pending');
      expect(topScorer?.points).not.toBeNull();
      expect(topScorer?.status).toBe('provisional');
    }
    const meeri = data.bettors.find((b) => b.bettorId === 'meeri');
    expect(meeri?.bonusSlots.find((slot) => slot.label === 'Maalikuningas')?.points).toBe(10);
  });

  it('joukkuenimet on resolvattu suomeksi (id ei vuoda näyttöön)', () => {
    const names = data.bettors.flatMap((b) => b.teams.map((t) => t.teamName));
    expect(names).toContain('Brasilia');
    expect(names).not.toContain('BRA');
  });

  it('lohkovaiheen ohjelma on mukana, ja Brasilia–Marokko on pelattu', () => {
    expect(data.totalMatches).toBeGreaterThanOrEqual(72);
    // playedMatches kasvaa tulosten myötä; varmistetaan vain että BRA–MAR on mukana.
    expect(data.playedMatches).toBeGreaterThanOrEqual(1);
    expect(data.results.some((r) => r.id === 'C-BRA-MAR')).toBe(true);
  });

  it('näyttää turnausrakenteen mukaiset jäljellä olevat ottelut, ei raakafiidin total-played-lukua', () => {
    const activeKnockoutStage = upcomingFixtures
      .map((fixture) => fixture.id.split('-')[0]!)
      .find((stage) => stage in EXPECTED_REMAINING_BY_STAGE);
    const expected =
      activeKnockoutStage !== undefined
        ? EXPECTED_REMAINING_BY_STAGE[activeKnockoutStage]!
        : Math.max(0, matches.length + 32 - data.playedMatches);

    expect(data.remainingTournamentMatches).toBe(expected);
  });

  it('näyttää etusivulla vain 3 uusinta tulosta ja pitää vanhemmat erillään', () => {
    expect(data.latestResults).toHaveLength(Math.min(3, data.results.length));
    expect(data.matchLog).toHaveLength(Math.max(0, data.results.length - 3));
    expect(new Set([...data.latestResults, ...data.matchLog].map((r) => r.id)).size).toBe(
      data.results.length,
    );
    expect(data.latestResults.map((r) => r.id)).toEqual(
      [...data.results]
        .reverse()
        .slice(0, 3)
        .map((r) => r.id),
    );
  });

  it('jokaisen total = ottelupisteet + mitalibonus + palkintobonus (riippumaton tuloksista)', () => {
    for (const b of data.bettors) {
      expect(b.total).toBe(b.matchPoints + b.medalBonusTotal + b.prizeBonusTotal);
    }
  });

  it('näyttää finaalin top 3 -perusskenaariot ilman parhaan pelaajan bonusta', () => {
    expect(data.finalScenarios).toEqual([
      {
        winnerTeamId: 'ESP',
        winnerName: 'Espanja',
        winnerFlag: '🇪🇸',
        rows: [
          { rank: 1, name: 'Helga', avatar: '🐼', total: 121 },
          { rank: 1, name: 'Meeri', avatar: '🐝', total: 121 },
          { rank: 3, name: 'Harri', avatar: '🐵', total: 103 },
        ],
      },
      {
        winnerTeamId: 'ARG',
        winnerName: 'Argentiina',
        winnerFlag: '🇦🇷',
        rows: [
          { rank: 1, name: 'Meeri', avatar: '🐝', total: 106 },
          { rank: 2, name: 'Helga', avatar: '🐼', total: 96 },
          { rank: 3, name: 'Juha', avatar: '🐲', total: 88 },
        ],
      },
    ]);
  });

  it('laskee pelatut joukkuepelit niin että omien joukkueiden keskinäinen peli lasketaan molemmille', () => {
    for (const b of data.bettors) {
      expect(b.playedTeamGames).toBeGreaterThanOrEqual(0);
      expect(b.playedTeamGames).toBeLessThanOrEqual(data.playedMatches);
    }
    expect(data.bettors.some((b) => b.playedTeamGames > 0)).toBe(true);
    expect(data.bettors.find((b) => b.bettorId === 'kaarlo')?.playedTeamGames).toBeGreaterThan(0);
    expect(data.bettors.find((b) => b.bettorId === 'alvar')?.playedTeamGames).toBeGreaterThan(0);
  });

  it('rakentaa hauskat johdannaiset ilman erillistä backend-tilaa', () => {
    expect(data.insights.length).toBeGreaterThan(0);
    expect(data.changeStory?.match.id).toBeTruthy();
    expect(data.teamOwnership.length).toBeGreaterThan(0);
    expect(data.teamOwnership.every((t) => t.owners.length > 0)).toBe(true);
  });
});
