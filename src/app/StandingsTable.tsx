import type { BettorView } from './viewmodel.js';

function Num({ value, className = '' }: { value: number; className?: string }) {
  return <span className={`num ${className}`}>{value}</span>;
}

export function StandingsTable({ bettors }: { bettors: BettorView[] }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[--color-muted]">
        Tulostaulukko
      </h2>

      <div className="overflow-hidden rounded-lg border border-[--color-line] bg-[--color-surface]">
        {/* Sarakeotsikot — piilossa kapealla, näkyy sm+ */}
        <div className="hidden grid-cols-[2.5rem_1fr_3rem_3rem_3rem_3.5rem] gap-2 border-b border-[--color-line] px-3 py-2 text-[0.65rem] font-medium uppercase tracking-wider text-[--color-muted] sm:grid">
          <div className="text-right">#</div>
          <div>Veikkaaja</div>
          <div className="text-right">Ottelu</div>
          <div className="text-right">Mitali</div>
          <div className="text-right">Palk.</div>
          <div className="text-right">Yht.</div>
        </div>

        <ol>
          {bettors.map((b, i) => {
            const top = b.rank === 1;
            return (
              <li
                key={b.bettorId}
                className={[
                  'grid grid-cols-[2.5rem_1fr_3.5rem] items-center gap-2 px-3 py-2.5 sm:grid-cols-[2.5rem_1fr_3rem_3rem_3rem_3.5rem]',
                  i > 0 ? 'border-t border-[--color-line]' : '',
                  top ? 'bg-indigo-500/5' : '',
                ].join(' ')}
              >
                <div
                  className={`num text-right text-sm ${
                    top ? 'font-semibold text-indigo-400' : 'text-[--color-muted]'
                  }`}
                >
                  {b.rank}
                </div>

                <div className="min-w-0">
                  <div className="truncate font-medium text-[--color-ink]">{b.name}</div>
                  {/* Mobiilin erittely nimen alle */}
                  <div className="num mt-0.5 text-[0.7rem] text-[--color-muted] sm:hidden">
                    O {b.matchPoints} · M {b.medalBonusTotal} · P {b.prizeBonusTotal}
                  </div>
                </div>

                <Num
                  value={b.matchPoints}
                  className="hidden text-right text-sm text-[--color-muted] sm:block"
                />
                <Num
                  value={b.medalBonusTotal}
                  className="hidden text-right text-sm text-[--color-muted] sm:block"
                />
                <Num
                  value={b.prizeBonusTotal}
                  className="hidden text-right text-sm text-[--color-muted] sm:block"
                />

                <div
                  className={`num text-right text-base font-semibold ${
                    top ? 'text-indigo-300' : 'text-[--color-ink]'
                  }`}
                >
                  {b.total}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
