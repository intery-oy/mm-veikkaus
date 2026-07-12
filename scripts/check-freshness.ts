// Semantic freshness gate for generated match data.
//
// This catches the failure mode where sync/deploy are alive, but a picked-team
// fixture that has started is missing from every user-visible bucket.

import { matches } from '../src/data/results.js';
import { picks } from '../src/data/picks.js';
import { fixtureDates, upcomingFixtures, preliminaryIds } from '../src/data/results.js';

const GRACE_MS = Number(process.env.MM_VEIKKAUS_FRESHNESS_GRACE_MS ?? 15 * 60 * 1000);
const now = Date.now();

const pickedTeams = new Set(picks.flatMap((pick) => pick.teams.map((team) => team.teamId)));
const visibleUpcomingIds = new Set(upcomingFixtures.map((fixture) => fixture.id));
const preliminary = new Set(preliminaryIds);

function isPickedMatch(match: (typeof matches)[number]): boolean {
  return pickedTeams.has(match.homeTeamId) || pickedTeams.has(match.awayTeamId);
}

function groupId(matchId: string): string {
  return matchId.split('-', 1)[0] ?? '';
}

const startedGroups = new Set<string>();
for (const match of matches) {
  const utcDate = fixtureDates[match.id];
  if (!utcDate) continue;
  const start = new Date(utcDate).getTime();
  if (Number.isFinite(start) && start <= now - GRACE_MS) {
    startedGroups.add(groupId(match.id));
  }
}

const missingVisible: string[] = [];
const missingSchedule: string[] = [];

for (const match of matches) {
  if (!isPickedMatch(match)) continue;

  const utcDate = fixtureDates[match.id];
  if (!utcDate) {
    if (match.result !== null) continue;
    if (startedGroups.has(groupId(match.id))) missingSchedule.push(match.id);
    continue;
  }

  const start = new Date(utcDate).getTime();
  if (!Number.isFinite(start) || start > now - GRACE_MS) continue;

  const visible = match.result !== null || preliminary.has(match.id);
  if (!visible) missingVisible.push(match.id);
}

if (missingVisible.length > 0 || missingSchedule.length > 0) {
  const parts: string[] = [];
  if (missingVisible.length > 0) {
    parts.push(`started picked fixtures not visible=${missingVisible.sort().join(',')}`);
  }
  if (missingSchedule.length > 0) {
    parts.push(`picked fixtures missing schedule in started groups=${missingSchedule.sort().join(',')}`);
  }
  console.error(`FRESHNESS_FAIL: ${parts.join('; ')}`);
  process.exit(2);
}

console.log('FRESHNESS_OK');
