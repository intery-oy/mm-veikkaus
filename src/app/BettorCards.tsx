import type { BettorView, BonusSlot } from './viewmodel.js';

function BonusRow({ slot }: { slot: BonusSlot }) {
  const pending = slot.points === null;
  const hit = !pending && slot.points! > 0;
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="text-[--color-muted]">{slot.label}</span>
      <span className="flex items-baseline gap-2 text-right">
        <span className="truncate text-[--color-ink]">{slot.pick}</span>
        {pending ? (
          <span className="shrink-0 rounded bg-[--color-surface-2] px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider text-[--color-muted]">
            kesken
          </span>
        ) : (
          <span
            className={`num shrink-0 w-7 text-right ${
              hit ? 'font-semibold text-indigo-400' : 'text-[--color-faint]'
            }`}
          >
            +{slot.points}
          </span>
        )}
      </span>
    </div>
  );
}

function Card({ b }: { b: BettorView }) {
  return (
    <article className="rounded-lg border border-[--color-line] bg-[--color-surface] p-4">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="num text-sm text-[--color-muted]">{b.rank}.</span>
          <h3 className="font-semibold text-[--color-ink]">{b.name}</h3>
        </div>
        <div className="num text-lg font-semibold text-indigo-300">{b.total}</div>
      </header>

      {/* Joukkueet rooleittain */}
      <div className="mb-3 space-y-0.5 text-sm">
        {b.teams.map((t) => (
          <div key={t.role} className="flex items-baseline justify-between gap-2">
            <span className="text-[--color-muted]">{t.roleLabel}</span>
            <span className="text-[--color-ink]">{t.teamName}</span>
          </div>
        ))}
      </div>

      {/* Mitali- ja palkintobonukset */}
      <div className="border-t border-[--color-line] pt-2 text-sm">
        {b.bonusSlots.map((s) => (
          <BonusRow key={s.label} slot={s} />
        ))}
      </div>

      {/* Erittely-alapalkki */}
      <footer className="num mt-3 flex justify-between border-t border-[--color-line] pt-2 text-[0.7rem] text-[--color-muted]">
        <span>Ottelu {b.matchPoints}</span>
        <span>Mitali {b.medalBonusTotal}</span>
        <span>Palkinto {b.prizeBonusTotal}</span>
      </footer>
    </article>
  );
}

export function BettorCards({ bettors }: { bettors: BettorView[] }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[--color-muted]">
        Veikkaajat
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bettors.map((b) => (
          <Card key={b.bettorId} b={b} />
        ))}
      </div>
    </section>
  );
}
