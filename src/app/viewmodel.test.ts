// Savutesti view-modelille: varmistaa että committoitu seed + results.ts
// kääntyy UI:n odottamaksi muodoksi. Pistelaskenta itse on katettu
// domain/scoring.test.ts:ssä.

import { describe, expect, it } from 'vitest';
import { upcomingFixtures } from '../data/results.js';
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

  it('kun kaikki tulokset ja palkinnot on kirjattu, kaikki pisteet on jaettu', () => {
    expect(data.outcomePending).toBe(false);
    expect(data.bettors.find((b) => b.bettorId === 'meeri')?.total).toBe(121);
    expect(data.medalBonuses).toEqual([
      {
        role: 'champion',
        label: 'Mestari',
        points: 15,
        teamName: 'Espanja',
        flag: '🇪🇸',
        awarded: true,
      },
      {
        role: 'silver',
        label: 'Hopea',
        points: 10,
        teamName: 'Argentiina',
        flag: '🇦🇷',
        awarded: true,
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
      expect(bestPlayer?.points).not.toBeNull();
      expect(bestPlayer?.status).toBe('final');
      expect(topScorer?.points).not.toBeNull();
      expect(topScorer?.status).toBe('final');
    }
    const meeri = data.bettors.find((b) => b.bettorId === 'meeri');
    expect(meeri?.bonusSlots.find((slot) => slot.label === 'Maalikuningas')?.points).toBe(10);
    const mummo = data.bettors.find((b) => b.bettorId === 'mummo');
    expect(mummo?.bonusSlots.find((slot) => slot.label === 'Paras pelaaja')?.points).toBe(10);
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

  it('näyttää finaalin jälkeen nolla jäljellä olevaa ottelua', () => {
    const activeKnockoutStage = upcomingFixtures
      .map((fixture) => fixture.id.split('-')[0]!)
      .find((stage) => stage in EXPECTED_REMAINING_BY_STAGE);

    expect(activeKnockoutStage).toBeUndefined();
    expect(data.remainingTournamentMatches).toBe(0);
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

  it('rakentaa Helgan ja Meerin tarkistuslaskelman lähteineen', () => {
    expect(data.finalAudit.map((audit) => audit.bettorId)).toEqual(['helga', 'meeri']);
    for (const audit of data.finalAudit) {
      const matchPoints = audit.teams.reduce((sum, team) => sum + team.points, 0);
      const medalPoints = audit.medals.reduce((sum, bonus) => sum + bonus.points, 0);
      const prizePoints = audit.prizes.reduce((sum, bonus) => sum + bonus.points, 0);
      expect(matchPoints).toBe(audit.matchPoints);
      expect(medalPoints).toBe(audit.medalBonusTotal);
      expect(prizePoints).toBe(audit.prizeBonusTotal);
      expect(matchPoints + medalPoints + prizePoints).toBe(audit.total);
      expect(audit.teams.flatMap((team) => team.matches).every((source) => source.source.includes('-'))).toBe(true);
      expect(
        audit.teams
          .flatMap((team) => team.matches)
          .every(
            (source) =>
              source.sourceWithPoints.includes(source.source) &&
              source.sourceWithPoints.includes(source.resultLabel) &&
              source.sourceWithPoints.endsWith(source.points > 0 ? `+${source.points} p` : '0 p'),
          ),
      ).toBe(true);
      expect(audit.medals.every((bonus) => bonus.source.startsWith('Lopputulos:'))).toBe(true);
      expect(audit.prizes.every((bonus) => bonus.source.startsWith('Lopputulos:'))).toBe(true);
    }
  });

  it('ei näytä finaaliskenaarioita, kun finaali on jo ratkaistu', () => {
    expect(data.finalScenarios).toEqual([]);
    expect(data.bettors.slice(0, 3).map((b) => ({ rank: b.rank, name: b.name, total: b.total })))
      .toEqual([
        { rank: 1, name: 'Helga', total: 121 },
        { rank: 1, name: 'Meeri', total: 121 },
        { rank: 3, name: 'Harri', total: 103 },
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
