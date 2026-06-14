import { describe, expect, it } from 'vitest';
import { buildPortalData } from './viewmodel.js';
import { buildCommentary } from './commentary.js';

describe('buildCommentary', () => {
  it('palauttaa ei-tyhjän repliikin nykytilanteelle', () => {
    const text = buildCommentary(buildPortalData());
    expect(text.length).toBeGreaterThan(10);
  });

  it('on deterministinen samalle datalle', () => {
    const data = buildPortalData();
    expect(buildCommentary(data)).toBe(buildCommentary(data));
  });

  it('nollatilanteessa kertoo ettei kisa ole alkanut', () => {
    const empty = buildPortalData();
    empty.bettors = empty.bettors.map((b) => ({
      ...b,
      total: 0,
      matchPoints: 0,
      rank: 1,
    }));
    empty.playedMatches = 0;
    empty.results = [];
    expect(buildCommentary(empty)).toMatch(/⚽|🏟️|🔥/);
  });
});
