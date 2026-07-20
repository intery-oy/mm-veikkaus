import type { ReactNode } from 'react';
import { buildPortalData } from './viewmodel.js';
import type { FinalAuditView } from './viewmodel.js';
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

function Points({ points }: { points: number }) {
  return (
    <span className={`num shrink-0 rounded-full px-2 py-0.5 text-xs font-black ${points > 0 ? 'bg-[--color-grass-deep] text-white' : 'bg-black/5 text-[--color-muted]'}`}>
      {points > 0 ? `+${points} p` : '0 p'}
    </span>
  );
}

function FinalAudit({ audits }: { audits: FinalAuditView[] }) {
  if (audits.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-[--color-grass-deep]">
          <span>🧾</span> Tarkistuslaskelma
        </h2>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-wider text-[--color-muted] shadow-sm">
          jokaisen pisteen lähde näkyvissä
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {audits.map((audit) => (
          <article
            key={audit.bettorId}
            className="overflow-hidden rounded-3xl bg-white/95 shadow-lg ring-1 ring-white/40 backdrop-blur"
          >
            <header className="flex items-center justify-between gap-3 bg-[--color-sun]/25 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/80 text-3xl">
                  {audit.avatar}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-xl font-black text-[--color-ink]">
                    {audit.name}
                  </h3>
                  <div className="text-sm font-bold text-[--color-muted]">
                    {audit.matchPoints} ottelupistettä + {audit.medalBonusTotal} mitalibonusta +{' '}
                    {audit.prizeBonusTotal} palkintobonusta
                  </div>
                </div>
              </div>
              <div className="num rounded-2xl bg-[--color-ink] px-3 py-2 text-2xl font-black text-white">
                {audit.total} p
              </div>
            </header>

            <div className="space-y-4 p-4">
              <div className="space-y-3">
                {audit.teams.map((team) => (
                  <div key={`${audit.bettorId}-${team.roleLabel}-${team.teamName}`} className="rounded-2xl bg-[--color-grass]/5 p-3 ring-1 ring-[--color-grass]/10">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[0.65rem] font-black uppercase tracking-wider text-[--color-muted]">
                          {team.roleLabel}
                        </div>
                        <div className="truncate font-black text-[--color-ink]">
                          {team.flag} {team.teamName}
                        </div>
                      </div>
                      <span className="num rounded-full bg-[--color-sun]/25 px-2 py-0.5 text-xs font-black text-[--color-ink]">
                        {team.points} p yhteensä
                      </span>
                    </div>
                    <div className="space-y-1">
                      {team.matches.map((match) => (
                        <div
                          key={match.id}
                          className="rounded-xl bg-white/85 px-2 py-1.5 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-[--color-ink]">
                              {match.source}
                              <Points points={match.points} />
                            </div>
                            <div className="font-bold text-[--color-muted]">
                              {match.resultLabel}: {match.points === 3 ? '3 p' : match.points === 1 ? '1 p' : '0 p'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[--color-sky]/10 p-3 ring-1 ring-[--color-sky]/20">
                  <div className="mb-2 text-[0.65rem] font-black uppercase tracking-wider text-[--color-muted]">
                    Mitalibonukset
                  </div>
                  <div className="space-y-1">
                    {audit.medals.map((bonus) => (
                      <div key={bonus.label} className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-2 py-1.5 text-xs">
                        <div className="min-w-0">
                          <div className="font-black text-[--color-ink]">
                            {bonus.label}: {bonus.pick}
                          </div>
                          <div className="truncate font-bold text-[--color-muted]">
                            {bonus.source}
                          </div>
                        </div>
                        <Points points={bonus.points} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-[--color-sun]/20 p-3 ring-1 ring-[--color-sun]/40">
                  <div className="mb-2 text-[0.65rem] font-black uppercase tracking-wider text-[--color-muted]">
                    Palkintobonukset
                  </div>
                  <div className="space-y-1">
                    {audit.prizes.map((bonus) => (
                      <div key={bonus.label} className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-2 py-1.5 text-xs">
                        <div className="min-w-0">
                          <div className="font-black text-[--color-ink]">
                            {bonus.label}: {bonus.pick}
                          </div>
                          <div className="truncate font-bold text-[--color-muted]">
                            {bonus.source}
                          </div>
                        </div>
                        <Points points={bonus.points} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function App() {
  // Data on committoitua (seed + results.ts) — laske kerran renderissä.
  const data = buildPortalData();
  const leader = data.bettors[0];
  const leaders = leader ? data.bettors.filter((b) => b.total === leader.total) : [];
  const anyPoints = data.bettors.some((b) => b.total > 0);
  const topScorerLeader = data.topScorers[0] ?? null;

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
        {data.remainingTournamentMatches > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Pill>⚽ {data.remainingTournamentMatches} ottelua jäljellä</Pill>
          </div>
        )}
      </header>

      {leader && anyPoints && (
        <section className="mb-6 flex items-center gap-4 rounded-3xl bg-white/90 p-4 shadow-md ring-1 ring-white/30 backdrop-blur">
          <div className="relative flex h-16 w-24 shrink-0 items-center justify-center -space-x-2 rounded-full bg-[--color-sun]/25 text-4xl ring-2 ring-[--color-gold]">
            {leaders.map((b) => (
              <span key={b.bettorId} className="grid h-12 w-12 place-items-center rounded-full bg-white/80">
                {b.avatar}
              </span>
            ))}
            <span className="absolute -right-2 -top-3 rotate-12 text-3xl drop-shadow-sm">👑</span>
          </div>
          <div className="min-w-0">
            <div className="font-display text-xs font-black uppercase tracking-wider text-[--color-muted]">
              Voittajat
            </div>
            <div className="truncate font-display text-2xl font-black text-[--color-ink]">
              {leaders.map((b) => b.name).join(' ja ')}
            </div>
            <div className="num mt-1 text-sm font-bold text-[--color-grass-deep]">
              {leader.total} pistettä
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
        <section className="overflow-hidden rounded-3xl bg-white/95 shadow-lg ring-2 ring-[--color-sun]/40 backdrop-blur">
          <div className="bg-[--color-sun]/25 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-black text-[--color-ink]">
                Pisteiden tila
              </h2>
            </div>
          </div>

          <div className="grid gap-3 p-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-[--color-grass]/10 p-3 ring-1 ring-[--color-grass]/20">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[0.7rem] font-black uppercase tracking-wider text-[--color-muted]">
                  Jaettu lopullisesti
                </div>
                <span className="rounded-full bg-[--color-grass-deep] px-2 py-0.5 text-xs font-black text-white">
                  mukana
                </span>
              </div>
              <ul className="space-y-1 text-sm font-black text-[--color-ink]">
                <li>Ottelupisteet kaikista peleistä</li>
                <li>Mestari +15 p: Espanja</li>
                <li>Hopea +10 p: Argentiina</li>
                <li>Pronssi +6 p: Englanti</li>
                <li>Paras pelaaja +10 p: Rodri</li>
                <li>Maalikuningas +10 p: Mbappé</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-[--color-sun]/25 p-3 ring-2 ring-[--color-sun]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[0.7rem] font-black uppercase tracking-wider text-[--color-muted]">
                  Kaikki jaettu
                </div>
                <span className="rounded-full bg-[--color-ink] px-2 py-0.5 text-xs font-black text-white">
                  valmis
                </span>
              </div>
              <div className="text-sm font-black text-[--color-ink]">
                Rodri paras pelaaja
              </div>
              {topScorerLeader && (
                <p className="mt-2 text-xs font-bold text-[--color-muted]">
                  Maalikuningas: {topScorerLeader.playerName},
                  {` ${topScorerLeader.goals} maalia`}. Jokainen bonusruutu on nyt mukana
                  lopullisessa taulukossa.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-black/5 p-3 ring-1 ring-black/5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[0.7rem] font-black uppercase tracking-wider text-[--color-muted]">
                  Lopputulos
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-[--color-muted]">
                  finaali
                </span>
              </div>
              <ul className="space-y-1 text-sm font-black text-[--color-ink]">
                <li>Espanja 1–0 Argentiina</li>
                <li>Espanja maailmanmestari</li>
                <li>Argentiina hopealla</li>
              </ul>
            </div>
          </div>

          {data.finalScenarios.length > 0 && (
            <div className="border-t border-[--color-line] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <h3 className="font-display text-xl font-black text-[--color-grass-deep]">
                  Mitä jos finaali päättyy näin?
                </h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {data.finalScenarios.map((scenario) => (
                  <div
                    key={scenario.winnerTeamId}
                    className="rounded-2xl bg-[--color-card] p-3 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="font-display text-base font-black text-[--color-ink]">
                        {scenario.winnerFlag} {scenario.winnerName} voittaa
                      </div>
                      <span className="rounded-full bg-[--color-grass]/10 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-[--color-grass-deep]">
                        top 3 kokonaispisteet
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {scenario.rows.map((row) => (
                        <div
                          key={`${scenario.winnerTeamId}-${row.rank}-${row.name}`}
                          className="flex items-center gap-2 rounded-xl bg-white/80 px-2 py-1.5"
                        >
                          <span className="flex min-w-0 items-center gap-2 font-bold text-[--color-ink]">
                            <span className="num w-5 shrink-0 text-center">{row.rank}.</span>
                            <span className="shrink-0">{row.avatar}</span>
                            <span className="truncate">
                              {row.name} <span className="num font-black">{row.total} p</span>
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-2xl bg-[--color-sky]/10 px-3 py-2 text-sm font-bold text-[--color-muted]">
                Nämä skenaariot eivät sisällä parhaan pelaajan bonusta.
              </p>
            </div>
          )}
        </section>
        {data.topScorers.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-[--color-grass-deep]">
                <span>👟</span> Maalipörssi
              </h2>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-wider text-[--color-muted] shadow-sm">
                +10 p mukana lopullisessa taulukossa
              </span>
            </div>
            <div className="overflow-hidden rounded-3xl bg-white/90 shadow-md ring-1 ring-white/30 backdrop-blur">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 border-b border-[--color-line] px-3 py-2 text-[0.7rem] font-black uppercase tracking-wider text-[--color-muted]">
                <span>#</span>
                <span>Pelaaja</span>
                <span className="text-right">M</span>
                <span className="hidden text-right sm:block">O</span>
              </div>
              {data.topScorers.map((s, i) => (
                <div
                  key={`${s.playerName}-${s.teamName}`}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 border-b border-[--color-line] px-3 py-2 last:border-b-0"
                >
                  <span className="num w-5 text-sm font-black text-[--color-grass-deep]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[--color-ink]">
                      {s.teamFlag} {s.playerName}
                    </div>
                    <div className="truncate text-xs font-bold text-[--color-muted]">
                      {s.teamName}
                    </div>
                    {s.pickedBy.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {s.pickedBy.map((p) => (
                          <span
                            key={p.name}
                            className="flex items-center gap-1 rounded-full bg-[--color-grass]/10 px-2 py-0.5 text-xs font-bold text-[--color-ink]"
                          >
                            <span>{p.avatar}</span>
                            {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="num rounded-full bg-[--color-sun]/25 px-2 py-0.5 text-sm font-black text-[--color-ink]">
                    {s.goals}
                  </span>
                  <span className="num hidden text-right text-xs font-bold text-[--color-muted] sm:block">
                    {s.playedMatches}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
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
        <FinalAudit audits={data.finalAudit} />
      </main>
    </div>
  );
}
