// Savutesti view-modelille: varmistaa että committoitu seed + results.ts
// kääntyy UI:n odottamaksi muodoksi. Pistelaskenta itse on katettu
// domain/scoring.test.ts:ssä.

import { describe, expect, it } from 'vitest';
import { buildPortalData } from './viewmodel.js';

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

  it('kun outcome on auki, kaikki bonusruudut ovat "kesken" (points=null)', () => {
    expect(data.outcomePending).toBe(true);
    for (const b of data.bettors) {
      for (const slot of b.bonusSlots) {
        expect(slot.points).toBeNull();
      }
    }
  });

  it('joukkuenimet on resolvattu suomeksi (id ei vuoda näyttöön)', () => {
    const names = data.bettors.flatMap((b) => b.teams.map((t) => t.teamName));
    expect(names).toContain('Brasilia');
    expect(names).not.toContain('BRA');
  });

  it('lohkovaiheen ohjelma on 72 ottelua, ja Brasilia–Marokko on pelattu', () => {
    expect(data.totalMatches).toBe(72);
    // playedMatches kasvaa tulosten myötä; varmistetaan vain että BRA–MAR on mukana.
    expect(data.playedMatches).toBeGreaterThanOrEqual(1);
    expect(data.results.some((r) => r.id === 'C-BRA-MAR')).toBe(true);
  });

  it('jokaisen total = ottelupisteet + mitalibonus + palkintobonus (riippumaton tuloksista)', () => {
    for (const b of data.bettors) {
      expect(b.total).toBe(b.matchPoints + b.medalBonusTotal + b.prizeBonusTotal);
    }
  });
});
