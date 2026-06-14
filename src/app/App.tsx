import type { ReactNode } from 'react';
import { buildPortalData } from './viewmodel.js';
import { buildCommentary } from './commentary.js';
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
  const commentary = buildCommentary(data);

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

      {/* Selostaja — hauska kommentaari tilanteesta */}
      <div className="mb-6 flex items-start gap-3 rounded-3xl bg-[--color-card] p-4 shadow-sm ring-1 ring-black/5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[--color-sun]/20 text-2xl">
          🎙️
        </div>
        <div className="min-w-0">
          <div className="font-display text-xs font-bold uppercase tracking-wider text-[--color-muted]">
            Selostaja
          </div>
          <p className="font-semibold text-[--color-ink]">{commentary}</p>
        </div>
      </div>

      {/* Tulosfiidi */}
      {data.results.length > 0 && (
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          {data.results.map((r) => (
            <div
              key={r.id}
              className={[
                'num flex items-center gap-2 rounded-2xl bg-[--color-card] px-3 py-1.5 text-sm font-bold shadow-sm ring-1',
                r.preliminary ? 'ring-2 ring-red-400' : 'ring-black/5',
              ].join(' ')}
              title={r.preliminary ? 'Alustava — peli kesken' : undefined}
            >
              {r.preliminary && (
                <span className="flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider text-red-500">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  Live
                </span>
              )}
              <span>{r.homeFlag}</span>
              <span className="text-[--color-grass-deep]">
                {r.homeGoals}–{r.awayGoals}
              </span>
              <span>{r.awayFlag}</span>
            </div>
          ))}
        </div>
      )}
      {data.hasPreliminary && (
        <p className="mb-8 text-center text-xs font-semibold text-red-500">
          🔴 Sisältää alustavan tuloksen (peli kesken) — pisteet voivat vielä muuttua.
        </p>
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
