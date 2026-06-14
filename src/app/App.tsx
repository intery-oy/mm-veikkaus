import { buildPortalData } from './viewmodel.js';
import { StandingsTable } from './StandingsTable.js';
import { BettorCards } from './BettorCards.js';

export function App() {
  // Data on committoitua (seed + results.ts) — laske kerran renderissä.
  const data = buildPortalData();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <header className="mb-6 border-b border-[--color-line] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[--color-ink] sm:text-2xl">
          MM-veikkaus <span className="text-indigo-400">2026</span>
        </h1>
        <p className="num mt-1 text-sm text-[--color-muted]">
          {data.playedMatches}/{data.totalMatches} ottelua pelattu
          {data.outcomePending ? ' · mitalit & palkinnot kesken' : ''}
        </p>
      </header>

      <main className="space-y-8">
        <StandingsTable bettors={data.bettors} />
        <BettorCards bettors={data.bettors} />
      </main>

      <footer className="mt-10 border-t border-[--color-line] pt-4 text-[0.7rem] text-[--color-faint]">
        Pisteet lasketaan committoidusta datasta (<span className="num">src/data/results.ts</span>).
        Sama total = jaettu sija.
      </footer>
    </div>
  );
}
