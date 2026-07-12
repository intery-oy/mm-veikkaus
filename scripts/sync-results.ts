// Hakee MM-2026:n tulokset football-data.orgista ja kirjoittaa ne tiedostoon
// src/data/auto-results.generated.json (malli A). GitHub Action ajaa tämän.
//
// Periaatteet:
//  - Tulokset rajataan otteluihin, joissa on perheen veikkaama joukkue.
//  - Tulevat ottelut tuodaan laajemmin, jotta Seuraavaksi-osio näyttää myös
//    pelit, joissa ei ole veikkaajia.
//  - Tulos orientoidaan meidän ottelun id:n koti–vieras-suuntaan.
//  - Ei koskaan ylikirjoita tiedostoa virhetilanteessa (säilyttää viimeisen hyvän).
//  - Tuntemattomat joukkueet/ottelut vain varoituksena, ei kaadu.
//
// Aja: FOOTBALL_DATA_TOKEN=xxx npx tsx scripts/sync-results.ts

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { MatchResult } from '../src/domain/types.js';
import { matches } from '../src/data/results.js';
import { picks } from '../src/data/picks.js';
import { normalizePlayerId } from '../src/data/players.js';
import { teams } from '../src/data/teams.js';

const OUT_PATH = fileURLToPath(new URL('../src/data/auto-results.generated.json', import.meta.url));
const SCORERS_OUT_PATH = fileURLToPath(
  new URL('../src/data/auto-scorers.generated.json', import.meta.url),
);
const MATCHES_API_URL = 'https://api.football-data.org/v4/competitions/WC/matches';
const SCORERS_API_URL = 'https://api.football-data.org/v4/competitions/WC/scorers?limit=50';

// --- Joukkueiden tunnistus: football-data (name/tla) -> meidän FIFA-id ---
const OUR_IDS = new Set(teams.map((t) => t.id));

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Englanninkieliset nimet (ja yleiset variantit) -> meidän id.
const NAME_TO_ID: Record<string, string> = {};
const addName = (id: string, ...names: string[]) => {
  for (const n of names) NAME_TO_ID[norm(n)] = id;
};
addName('MEX', 'Mexico');
addName('RSA', 'South Africa');
addName('KOR', 'South Korea', 'Korea Republic');
addName('CZE', 'Czechia', 'Czech Republic');
addName('CAN', 'Canada');
addName('BIH', 'Bosnia and Herzegovina', 'Bosnia & Herzegovina', 'Bosnia-Herzegovina');
addName('QAT', 'Qatar');
addName('SUI', 'Switzerland');
addName('BRA', 'Brazil');
addName('MAR', 'Morocco');
addName('HAI', 'Haiti');
addName('SCO', 'Scotland');
addName('USA', 'United States', 'USA', 'United States of America');
addName('PAR', 'Paraguay');
addName('AUS', 'Australia');
addName('TUR', 'Turkey', 'Türkiye', 'Turkiye');
addName('GER', 'Germany');
addName('CUW', 'Curacao', 'Curaçao');
addName('CIV', 'Ivory Coast', "Côte d'Ivoire", 'Cote d Ivoire');
addName('ECU', 'Ecuador');
addName('NED', 'Netherlands', 'Holland');
addName('JPN', 'Japan');
addName('SWE', 'Sweden');
addName('TUN', 'Tunisia');
addName('BEL', 'Belgium');
addName('EGY', 'Egypt');
addName('IRN', 'Iran', 'IR Iran');
addName('NZL', 'New Zealand');
addName('ESP', 'Spain');
addName('CPV', 'Cape Verde', 'Cabo Verde');
addName('KSA', 'Saudi Arabia');
addName('URU', 'Uruguay');
addName('FRA', 'France');
addName('SEN', 'Senegal');
addName('IRQ', 'Iraq');
addName('NOR', 'Norway');
addName('ARG', 'Argentina');
addName('ALG', 'Algeria');
addName('AUT', 'Austria');
addName('JOR', 'Jordan');
addName('POR', 'Portugal');
addName('COD', 'DR Congo', 'Congo DR', 'Democratic Republic of the Congo', 'DR Congo (Kinshasa)');
addName('UZB', 'Uzbekistan');
addName('COL', 'Colombia');
addName('ENG', 'England');
addName('CRO', 'Croatia');
addName('GHA', 'Ghana');
addName('PAN', 'Panama');

interface ApiTeam {
  name?: string;
  shortName?: string;
  tla?: string;
}

function resolveId(team: ApiTeam): string | null {
  if (team.tla && OUR_IDS.has(team.tla)) return team.tla;
  for (const cand of [team.name, team.shortName]) {
    if (cand && NAME_TO_ID[norm(cand)]) return NAME_TO_ID[norm(cand)]!;
  }
  return null;
}

// --- Kanoniset ottelut: pari (lajiteltu) -> meidän { id, home, away } ---
const fixtureByPair = new Map<string, { id: string; home: string; away: string }>();
for (const m of matches) {
  const key = [m.homeTeamId, m.awayTeamId].sort().join('|');
  fixtureByPair.set(key, { id: m.id, home: m.homeTeamId, away: m.awayTeamId });
}

// Veikatut joukkueet (tulokset rajataan näihin; tulevat näytetään laajemmin).
const BETTED = new Set(picks.flatMap((p) => p.teams.map((t) => t.teamId)));

interface ApiMatch {
  id?: number;
  stage?: string;
  status: string;
  utcDate?: string;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score?: { fullTime?: { home: number | null; away: number | null } };
}

interface UpcomingFixture {
  id: string;
  utcDate: string;
  homeId: string;
  awayId: string;
}

interface GeneratedResults {
  results?: Record<string, MatchResult>;
  preliminaryIds?: string[];
  upcoming?: UpcomingFixture[];
  knockoutFixtures?: UpcomingFixture[];
  fixtureDates?: Record<string, string>;
}

interface ApiScorer {
  player?: { name?: string };
  team?: ApiTeam;
  playedMatches?: number;
  goals?: number;
  assists?: number | null;
  penalties?: number | null;
}

interface GeneratedScorer {
  playerId: string | null;
  playerName: string;
  teamId: string | null;
  teamName: string;
  goals: number;
  assists: number | null;
  penalties: number | null;
  playedMatches: number;
}

function readPreviousGenerated(): GeneratedResults {
  try {
    return JSON.parse(readFileSync(OUT_PATH, 'utf8')) as GeneratedResults;
  } catch {
    return {};
  }
}

function knockoutStageCode(stage: string | undefined): string {
  switch (stage) {
    case 'LAST_32':
      return 'R32';
    case 'LAST_16':
      return 'R16';
    case 'QUARTER_FINALS':
      return 'QF';
    case 'SEMI_FINALS':
      return 'SF';
    case 'THIRD_PLACE':
      return 'BRONZE';
    case 'FINAL':
      return 'FINAL';
    default:
      return 'KO';
  }
}

function dynamicFixtureFor(
  m: ApiMatch,
  homeId: string,
  awayId: string,
): { id: string; home: string; away: string } {
  const code = knockoutStageCode(m.stage);
  return {
    id: `${code}-${homeId}-${awayId}`,
    home: homeId,
    away: awayId,
  };
}

async function main() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    console.error('VIRHE: FOOTBALL_DATA_TOKEN puuttuu.');
    process.exit(1);
  }

  const [matchesRes, scorersRes] = await Promise.all([
    fetch(MATCHES_API_URL, { headers: { 'X-Auth-Token': token } }),
    fetch(SCORERS_API_URL, { headers: { 'X-Auth-Token': token } }),
  ]);
  if (!matchesRes.ok) {
    console.error(`VIRHE: football-data matches API ${matchesRes.status} ${matchesRes.statusText}`);
    process.exit(1);
  }
  if (!scorersRes.ok) {
    console.error(`VIRHE: football-data scorers API ${scorersRes.status} ${scorersRes.statusText}`);
    process.exit(1);
  }
  const data = (await matchesRes.json()) as { matches?: ApiMatch[] };
  const scorersData = (await scorersRes.json()) as { scorers?: ApiScorer[] };
  const apiMatches = data.matches ?? [];
  if (apiMatches.length === 0) {
    console.error('VIRHE: API palautti 0 ottelua — ei kirjoiteta (säilytetään vanha).');
    process.exit(1);
  }

  const results: Record<string, MatchResult> = {};
  const preliminary: string[] = [];
  const previous = readPreviousGenerated();
  const fixtureDates: Record<string, string> = { ...(previous.fixtureDates ?? {}) };
  const previousResults = previous.results ?? {};
  const knockoutById = new Map<string, UpcomingFixture>();
  for (const fixture of previous.knockoutFixtures ?? []) {
    knockoutById.set(fixture.id, fixture);
  }
  let upcoming: UpcomingFixture[] = [];
  let mappedResults = 0;
  const warnings: string[] = [];

  for (const m of apiMatches) {
    const live = m.status === 'LIVE' || m.status === 'IN_PLAY' || m.status === 'PAUSED';
    const finished = m.status === 'FINISHED';
    const scheduled = m.status === 'SCHEDULED' || m.status === 'TIMED';
    if (!live && !finished && !scheduled) continue; // POSTPONED/CANCELLED yms.

    const homeId = resolveId(m.homeTeam);
    const awayId = resolveId(m.awayTeam);
    if (!homeId || !awayId) {
      // Pudotuspelien TBD-joukkueet eivät resolvaudu — varoita vain pelatuista.
      if (live || finished) {
        warnings.push(`Tuntematon joukkue: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
      }
      continue;
    }
    let fx = fixtureByPair.get([homeId, awayId].sort().join('|'));
    if (!fx) {
      if (!m.stage || m.stage === 'GROUP_STAGE') {
        warnings.push(`Ei kanonista ottelua parille: ${homeId} vs ${awayId}`);
        continue;
      }
      fx = dynamicFixtureFor(m, homeId, awayId);
      if (m.utcDate) {
        knockoutById.set(fx.id, { id: fx.id, utcDate: m.utcDate, homeId, awayId });
      }
    }
    if (m.utcDate) fixtureDates[fx.id] = m.utcDate;

    if (finished || live) {
      if (!BETTED.has(homeId) && !BETTED.has(awayId)) continue; // ei vaikuta pisteisiin
      const ft = m.score?.fullTime;
      if (!ft || ft.home == null || ft.away == null) continue;
      // Orientoi tulos meidän ottelun koti–vieras-suuntaan.
      results[fx.id] =
        fx.home === homeId
          ? { homeGoals: ft.home, awayGoals: ft.away }
          : { homeGoals: ft.away, awayGoals: ft.home };
      if (live) preliminary.push(fx.id);
      mappedResults++;
    } else if (scheduled && m.utcDate) {
      // football-data can briefly regress a finished match back to scheduled.
      // Never let that erase already observed points.
      if (previousResults[fx.id]) continue;
      // Tuleva ottelu: säilytä todellinen koti/vieras näyttöä varten.
      upcoming.push({ id: fx.id, utcDate: m.utcDate, homeId, awayId });
    }
  }

  for (const [id, result] of Object.entries(previousResults)) {
    if (!(id in results)) results[id] = result;
  }

  if (warnings.length) console.warn('Varoitukset:\n  ' + warnings.join('\n  '));

  if (mappedResults === 0 && upcoming.length === 0) {
    console.error('VIRHE: 0 veikattua ottelua tunnistettu — ei kirjoiteta.');
    process.exit(1);
  }

  // Tulevat: aikajärjestykseen, talteen seuraavat 12 (UI näyttää muutaman).
  upcoming = upcoming.sort((a, b) => a.utcDate.localeCompare(b.utcDate)).slice(0, 12);

  // Vakaa, lajiteltu ulostulo -> siistit diffit.
  const sortedResults: Record<string, MatchResult> = {};
  for (const id of Object.keys(results).sort()) sortedResults[id] = results[id]!;
  const sortedFixtureDates: Record<string, string> = {};
  for (const id of Object.keys(fixtureDates).sort()) sortedFixtureDates[id] = fixtureDates[id]!;
  const knockoutFixtures = [...knockoutById.values()].sort((a, b) =>
    a.utcDate.localeCompare(b.utcDate),
  );
  const payload = {
    results: sortedResults,
    preliminaryIds: preliminary.sort(),
    upcoming,
    knockoutFixtures,
    fixtureDates: sortedFixtureDates,
  };
  const json = JSON.stringify(payload, null, 2) + '\n';
  const scorers: GeneratedScorer[] = (scorersData.scorers ?? [])
    .filter((s) => s.player?.name && typeof s.goals === 'number')
    .map((s) => {
      const teamId = s.team ? resolveId(s.team) : null;
      return {
        playerId: normalizePlayerId(s.player!.name!) ?? null,
        playerName: s.player!.name!,
        teamId,
        teamName: s.team?.name ?? teamId ?? 'Tuntematon',
        goals: s.goals!,
        assists: s.assists ?? null,
        penalties: s.penalties ?? null,
        playedMatches: s.playedMatches ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if ((b.assists ?? -1) !== (a.assists ?? -1)) return (b.assists ?? -1) - (a.assists ?? -1);
      return a.playerName.localeCompare(b.playerName);
    });
  const scorersJson = JSON.stringify({ scorers }, null, 2) + '\n';

  const prev = (() => {
    try {
      return readFileSync(OUT_PATH, 'utf8');
    } catch {
      return '';
    }
  })();
  const prevScorers = (() => {
    try {
      return readFileSync(SCORERS_OUT_PATH, 'utf8');
    } catch {
      return '';
    }
  })();

  if (prev === json && prevScorers === scorersJson) {
    console.log(
      `Ei muutoksia (${mappedResults} tulosta, ${upcoming.length} tulevaa, ${scorers.length} maalintekijää).`,
    );
    return;
  }
  if (prev !== json) writeFileSync(OUT_PATH, json);
  if (prevScorers !== scorersJson) writeFileSync(SCORERS_OUT_PATH, scorersJson);
  console.log(
    `Päivitetty: ${mappedResults} tulosta (${preliminary.length} alustavaa), ${upcoming.length} tulevaa, ${scorers.length} maalintekijää.`,
  );
}

main().catch((err) => {
  console.error('VIRHE:', err);
  process.exit(1);
});
