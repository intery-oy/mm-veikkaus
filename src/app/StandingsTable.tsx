import type { BettorView } from './viewmodel.js';

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function rankBadge(rank: number) {
  return MEDAL[rank] ?? `${rank}.`;
}

export function StandingsTable({ bettors }: { bettors: BettorView[] }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-bold text-[--color-grass-deep]">
        <span>📊</span> Sarjataulukko
      </h2>

      <div className="space-y-2">
        {bettors.map((b) => {
          const leader = b.rank === 1;
          return (
            <div
              key={b.bettorId}
              className={[
                'pop flex items-center gap-3 rounded-3xl bg-[--color-card] px-3 py-2.5 shadow-sm ring-1 sm:px-4 sm:py-3',
                leader
                  ? 'glow-leader ring-2 ring-[--color-gold]'
                  : 'ring-black/5',
              ].join(' ')}
            >
              {/* Sija */}
              <div
                className={`num w-9 shrink-0 text-center text-xl ${
                  b.rank <= 3 ? '' : 'text-[--color-muted]'
                }`}
              >
                {rankBadge(b.rank)}
              </div>

              {/* Avatar */}
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[--color-grass]/10 text-2xl">
                {b.avatar}
              </div>

              {/* Nimi + erittely */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate font-display text-lg font-semibold text-[--color-ink]">
                  {b.name}
                  {leader && <span title="Kärjessä">👑</span>}
                </div>
                <div className="num mt-0.5 flex flex-wrap gap-x-2 text-xs text-[--color-muted]">
                  <span>⚽ {b.matchPoints}</span>
                  <span>🏅 {b.medalBonusTotal}</span>
                  <span>⭐ {b.prizeBonusTotal}</span>
                </div>
              </div>

              {/* Kokonaispisteet */}
              <div
                className="num grid h-12 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-bold"
                style={{
                  backgroundColor: leader ? 'var(--color-gold)' : 'var(--color-ink)',
                  color: leader ? 'var(--color-ink)' : '#ffffff',
                }}
              >
                {b.total}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
