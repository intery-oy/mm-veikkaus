import type { BettorView, BonusSlot } from './viewmodel.js';

// Reunaväri sijoituksen mukaan: kulta/hopea/pronssi top-3, muuten nurmi.
const RANK_RING: Record<number, string> = {
  1: 'ring-[--color-gold]',
  2: 'ring-[--color-silver]',
  3: 'ring-[--color-bronze]',
};
const RANK_BADGE_BG: Record<number, string> = {
  1: 'bg-[--color-gold]',
  2: 'bg-[--color-silver]',
  3: 'bg-[--color-bronze]',
};
const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function BonusRow({ slot }: { slot: BonusSlot }) {
  const pending = slot.points === null;
  const hit = !pending && slot.points! > 0;
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0">{slot.icon}</span>
        <span className="truncate text-[--color-ink]">{slot.pick}</span>
      </span>
      {pending ? (
        <span className="shrink-0 rounded-full bg-[--color-sky]/15 px-2 py-0.5 text-[0.7rem] font-bold text-[--color-sky]">
          ⚽ kesken
        </span>
      ) : (
        <span
          className={`num shrink-0 rounded-full px-2 py-0.5 text-sm font-bold ${
            hit ? 'bg-[--color-grass] text-white' : 'bg-black/5 text-[--color-faint]'
          }`}
        >
          +{slot.points}
        </span>
      )}
    </div>
  );
}

function Card({ b }: { b: BettorView }) {
  const ring = RANK_RING[b.rank] ?? 'ring-[--color-grass]/40';
  const badgeBg = RANK_BADGE_BG[b.rank] ?? 'bg-[--color-grass]';
  return (
    <article className={`pop rounded-3xl bg-[--color-card] p-4 shadow-md ring-2 ${ring}`}>
      <header className="mb-3 flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[--color-grass]/10 text-3xl">
          {b.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl font-bold text-[--color-ink]">
            {b.name}
          </h3>
          <div className="num text-sm font-bold text-[--color-muted]">
            {MEDAL[b.rank] ?? `${b.rank}.`} sija
          </div>
        </div>
        <div
          className={`num grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white shadow-inner ${badgeBg}`}
        >
          {b.total}
        </div>
      </header>

      {/* Joukkueet rooleittain lipuin */}
      <div className="mb-3 space-y-1 text-sm">
        {b.teams.map((t) => (
          <div key={t.role} className="flex items-center justify-between gap-2">
            <span className="text-[--color-muted]">{t.roleLabel}</span>
            <span className="flex items-center gap-1.5 font-bold text-[--color-ink]">
              <span>{t.flag}</span>
              {t.teamName}
            </span>
          </div>
        ))}
      </div>

      {/* Mitali- ja palkintobonukset */}
      <div className="rounded-2xl bg-[--color-grass]/5 p-2 text-sm">
        {b.bonusSlots.map((s) => (
          <BonusRow key={s.label} slot={s} />
        ))}
      </div>
    </article>
  );
}

export function BettorCards({ bettors }: { bettors: BettorView[] }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-bold text-[--color-grass-deep]">
        <span>🃏</span> Pelaajakortit
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bettors.map((b) => (
          <Card key={b.bettorId} b={b} />
        ))}
      </div>
    </section>
  );
}
