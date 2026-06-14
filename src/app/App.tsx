import type { ReactNode } from 'react';
import { buildPortalData } from './viewmodel.js';
import { StandingsTable } from './StandingsTable.js';
import { BettorCards } from './BettorCards.js';
import { Confetti } from './Confetti.js';

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-bold text-[--color-grass-deep] shadow-sm">
      {children}
    </span>
  );
}

export function App() {
  // Data on committoitua (seed + results.ts) — laske kerran renderissä.
  const data = buildPortalData();
  const leader = data.bettors[0];
  const anyPoints = data.bettors.some((b) => b.total > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      {/* Konfetti kärjelle kun pisteitä on jo kertynyt */}
      {anyPoints && <Confetti />}

      <header className="mb-6 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[--color-grass-deep] sm:text-5xl">
          ☀️ MM-veikkaus <span className="text-[--color-sun]">2026</span> ⚽
        </h1>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill>⚽ {data.playedMatches}/{data.totalMatches} ottelua</Pill>
          {leader && anyPoints && (
            <Pill>
              👑 {leader.avatar} {leader.name} johtaa
            </Pill>
          )}
          {data.outcomePending && <Pill>🏅 mitalit & palkinnot kesken</Pill>}
        </div>
      </header>

      {/* Tulosfiidi */}
      {data.results.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {data.results.map((r) => (
            <div
              key={r.id}
              className="num flex items-center gap-2 rounded-2xl bg-[--color-card] px-3 py-1.5 text-sm font-bold shadow-sm ring-1 ring-black/5"
            >
              <span>{r.homeFlag}</span>
              <span className="text-[--color-grass-deep]">
                {r.homeGoals}–{r.awayGoals}
              </span>
              <span>{r.awayFlag}</span>
            </div>
          ))}
        </div>
      )}

      <main className="space-y-10">
        {!anyPoints && (
          <p className="rounded-3xl bg-[--color-card] p-6 text-center font-display text-lg font-semibold text-[--color-muted] shadow-sm ring-1 ring-black/5">
            🏁 Kisa alkaa! Vielä 0–0 kaikkialla — pisteet syttyvät kun tulokset
            tulevat. ⚽
          </p>
        )}
        <StandingsTable bettors={data.bettors} />
        <BettorCards bettors={data.bettors} />
      </main>

      <footer className="mt-12 text-center text-xs font-semibold text-[--color-muted]">
        Pisteet committoidusta datasta · sama total = jaettu sija 🤝
      </footer>
    </div>
  );
}
