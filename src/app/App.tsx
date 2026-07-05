import type { ReactNode } from 'react';
import { buildPortalData } from './viewmodel.js';
import { StandingsTable } from './StandingsTable.js';
import { BettorCards } from './BettorCards.js';
import { Confetti } from './Confetti.js';
import { TeamOwnership } from './FunPanels.js';

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-bold text-[--color-grass-deep] shadow-sm">
      {children}
    </span>
  );
}

function backerCountLabel(count: number): string {
  if (count === 0) return 'Ei panosta';
  if (count === 1) return '1 veikkaaja kentällä';
  return `${count} veikkaajaa kentällä`;
}

export function App() {
  // Data on committoitua (seed + results.ts) — laske kerran renderissä.
  const data = buildPortalData();
  const leader = data.bettors[0];
  const anyPoints = data.bettors.some((b) => b.total > 0);

  // Seuraavat ottelut. Pidä juuri alkaneet pelit näkyvissä hetken, jotta ottelu
  // ei katoa, jos tuloshaku päivittyy muutaman minuutin myöhässä.
  const now = Date.now();
  const liveGraceMs = 3 * 60 * 60 * 1000;
  const visibleUpcoming = data.upcoming.filter((u) => new Date(u.utcDate).getTime() > now - liveGraceMs);
  const isStarted = (utcDate: string) => new Date(utcDate).getTime() <= now;
  const highlightedMatch = visibleUpcoming.find((u) => u.backers.length > 0);
  const highlightedMatchId = highlightedMatch?.id;
  const nextMatches = visibleUpcoming.slice(0, 6);
  const fmt = new Intl.DateTimeFormat('fi-FI', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Helsinki',
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      {/* Konfetti kärjelle kun pisteitä on jo kertynyt */}
      {anyPoints && <Confetti />}

      <header className="mb-6 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[--color-grass-deep] sm:text-5xl">
          ☀️ MM-veikkaus <span className="text-[--color-sun]">2026</span> ⚽
        </h1>
        <div className="mt-3 flex justify-center">
          <div
            className="grid grid-cols-6 gap-1.5 rounded-3xl bg-white/60 px-3 py-2 shadow-sm ring-1 ring-white/70 backdrop-blur"
            aria-label="Veikkaajat tanssivat jonossa"
          >
            {data.bettors.map((b, i) => (
              <span
                key={b.bettorId}
                className="dance-avatar grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70 text-2xl shadow-sm"
                style={{ animationDelay: `${i * 0.11}s` }}
                title={b.name}
              >
                {b.avatar}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Pill>⚽ {data.playedMatches}/{data.totalMatches} ottelua</Pill>
        </div>
      </header>

      {leader && anyPoints && (
        <section className="mb-6 flex items-center gap-4 rounded-3xl bg-white/90 p-4 shadow-md ring-1 ring-white/30 backdrop-blur">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[--color-sun]/25 text-4xl ring-2 ring-[--color-gold]">
            <span>{leader.avatar}</span>
            <span className="absolute -right-2 -top-3 rotate-12 text-3xl drop-shadow-sm">👑</span>
          </div>
          <div className="min-w-0">
            <div className="font-display text-xs font-black uppercase tracking-wider text-[--color-muted]">
              Kärjessä nyt
            </div>
            <div className="truncate font-display text-2xl font-black text-[--color-ink]">
              {leader.name}
            </div>
            <div className="num mt-1 text-sm font-bold text-[--color-grass-deep]">
              {leader.total} pistettä · {leader.playedTeamGames} joukkuepeliä
            </div>
          </div>
        </section>
      )}

      {/* Seuraavaksi — tulevat ottelut, veikkaajat erikseen merkittynä */}
      {nextMatches.length > 0 && (
        <section className="mb-8 next-matches">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-[--color-grass-deep]">
            <span>⏭️</span> Seuraavaksi
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {nextMatches.map((u) => (
              <article
                key={u.id}
                className={[
                  'pop overflow-hidden rounded-3xl bg-white/90 p-3 shadow-md ring-1 backdrop-blur',
                  u.id === highlightedMatchId
                    ? 'glow-leader ring-2 ring-[--color-gold]'
                    : 'ring-white/30',
                ].join(' ')}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={[
                      'num rounded-full px-2 py-0.5 text-xs font-black uppercase',
                      isStarted(u.utcDate)
                        ? 'bg-red-500 text-white'
                        : 'bg-[--color-sky]/15 text-[--color-sky]',
                    ].join(' ')}
                  >
                    {isStarted(u.utcDate) ? 'Live' : fmt.format(new Date(u.utcDate))}
                  </span>
                  <span className="rounded-full bg-[--color-grass]/10 px-2 py-0.5 text-xs font-bold text-[--color-grass-deep]">
                    {backerCountLabel(u.backers.length)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="min-w-0 rounded-2xl bg-[--color-grass]/5 p-2 text-right">
                    <div className="leading-none text-5xl sm:text-6xl">{u.homeFlag}</div>
                    <div className="mt-1 truncate text-sm font-black text-[--color-ink]">
                      {u.homeName}
                    </div>
                  </div>
                  <div className="num rounded-full bg-[--color-sun]/25 px-2 py-1 text-xs font-black uppercase text-[--color-ink]">
                    vs
                  </div>
                  <div className="min-w-0 rounded-2xl bg-[--color-grass]/5 p-2">
                    <div className="leading-none text-5xl sm:text-6xl">{u.awayFlag}</div>
                    <div className="mt-1 truncate text-sm font-black text-[--color-ink]">
                      {u.awayName}
                    </div>
                  </div>
                </div>

                {u.backers.length > 0 ? (
                  <div className="mt-3 border-t border-[--color-line] pt-2">
                    <div className="mb-1 text-[0.65rem] font-black uppercase tracking-wider text-[--color-muted]">
                      Kentällä
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {u.backers.map((b, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 rounded-full bg-[--color-grass]/10 px-2 py-0.5 text-xs font-bold text-[--color-ink]"
                        >
                          <span>{b.flag}</span>
                          <span>{b.avatar}</span>
                          {b.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 border-t border-[--color-line] pt-2 text-xs font-bold text-[--color-muted]">
                    Ei veikkaajia tässä ottelussa
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <main className="space-y-10">
        {!anyPoints && (
          <p className="rounded-3xl bg-[--color-card] p-6 text-center font-display text-lg font-semibold text-[--color-muted] shadow-sm ring-1 ring-black/5">
            🏁 Kisa alkaa! Vielä 0–0 kaikkialla — pisteet syttyvät kun tulokset
            tulevat. ⚽
          </p>
        )}
        <StandingsTable bettors={data.bettors} />
        {data.latestResults.length > 0 && (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-[--color-grass-deep]">
              <span>📋</span> Viimeisimmät tulokset
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.latestResults.map((r) => (
                <div
                  key={r.id}
                  className={[
                    'num flex flex-col gap-1.5 rounded-2xl bg-[--color-card] px-3 py-2 text-sm font-bold shadow-sm ring-1',
                    r.preliminary ? 'ring-2 ring-red-400' : 'ring-black/5',
                  ].join(' ')}
                  title={r.preliminary ? 'Alustava — peli kesken' : undefined}
                >
                  <div className="flex items-center justify-center gap-2">
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
                  {r.backers.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 border-t border-[--color-line] pt-1">
                      {r.backers.map((b, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 rounded-full bg-[--color-grass]/10 px-2 py-0.5 text-xs font-bold text-[--color-ink]"
                        >
                          <span>{b.flag}</span>
                          <span>{b.avatar}</span>
                          {b.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {data.hasPreliminary && (
              <p className="text-xs font-semibold text-red-500">
                🔴 Sisältää alustavan tuloksen (peli kesken) — pisteet voivat vielä muuttua.
              </p>
            )}
          </section>
        )}
        <section className="space-y-4">
          <div className="ownership-panel">
            <TeamOwnership teams={data.teamOwnership} />
          </div>
        </section>
        <div className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
          <img
            src="/bettors.jpg"
            alt="MM-veikkaus 2026 — veikkaajat"
            className="w-full object-cover"
          />
        </div>
        <BettorCards bettors={data.bettors} />
      </main>
    </div>
  );
}
