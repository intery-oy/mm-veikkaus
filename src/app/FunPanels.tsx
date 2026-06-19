import type { ChangeStory, InsightCard, TeamOwnershipView } from './viewmodel.js';

function ScorePill({ children }: { children: string }) {
  return (
    <span className="num shrink-0 rounded-full bg-[--color-grass]/10 px-2 py-0.5 text-xs font-bold text-[--color-grass-deep]">
      {children}
    </span>
  );
}

export function InsightCards({ cards }: { cards: InsightCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <article
          key={card.id}
          className="pop rounded-2xl bg-[--color-card] p-3 shadow-sm ring-1 ring-black/5"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-2xl">{card.icon}</span>
            <span className="text-right text-[0.65rem] font-black uppercase text-[--color-muted]">
              {card.label}
            </span>
          </div>
          <div className="truncate font-display text-base font-bold text-[--color-ink]">
            {card.value}
          </div>
          <div className="mt-1 text-xs font-bold text-[--color-muted]">{card.detail}</div>
        </article>
      ))}
    </section>
  );
}

export function ChangePanel({ story }: { story: ChangeStory | null }) {
  if (!story) return null;
  const shown = story.impact.slice(0, 5);
  return (
    <section className="rounded-3xl bg-[--color-card] p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[--color-grass-deep]">
          <span>🧾</span> Mitä muuttui?
        </h2>
        <div className="num rounded-full bg-[--color-sun]/25 px-3 py-1 text-sm font-bold text-[--color-ink]">
          {story.match.homeFlag} {story.match.homeGoals}–{story.match.awayGoals}{' '}
          {story.match.awayFlag}
        </div>
      </div>
      {shown.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {shown.map((i) => (
            <div key={i.bettorId} className="rounded-2xl bg-[--color-grass]/5 p-3">
              <div className="flex items-center gap-2 font-bold text-[--color-ink]">
                <span>{i.avatar}</span>
                <span className="truncate">{i.name}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {i.pointsDelta > 0 && <ScorePill>{`+${i.pointsDelta} p`}</ScorePill>}
                {i.rankDelta > 0 && <ScorePill>{`+${i.rankDelta} sijaa`}</ScorePill>}
                {i.rankDelta < 0 && <ScorePill>{`${i.rankDelta} sijaa`}</ScorePill>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-bold text-[--color-muted]">
          Viimeisin tulos ei heilauttanut pisteitä. Dramaattista vain teoriassa.
        </p>
      )}
    </section>
  );
}

export function TeamOwnership({ teams }: { teams: TeamOwnershipView[] }) {
  if (teams.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-bold text-[--color-grass-deep]">
        <span>👥</span> Joukkueomistus
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <details
            key={team.teamId}
            className="rounded-3xl bg-[--color-card] p-3 shadow-sm ring-1 ring-black/5 open:ring-2 open:ring-[--color-sky]"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-bold text-[--color-ink]">
                    {team.flag} {team.teamName}
                  </div>
                  <div className="text-xs font-bold text-[--color-muted]">
                    {team.owners.length} omistajaa
                  </div>
                </div>
                <span className="rounded-full bg-[--color-sky]/15 px-2 py-1 text-xs font-black uppercase text-[--color-sky]">
                  avaa
                </span>
              </div>
            </summary>
            <div className="mt-3 space-y-2 border-t border-[--color-line] pt-3">
              {team.owners.map((owner) => (
                <div key={`${team.teamId}-${owner.bettorId}-${owner.role}`} className="flex items-center gap-2">
                  <span className="text-xl">{owner.avatar}</span>
                  <span className="min-w-0 flex-1 truncate font-bold text-[--color-ink]">
                    {owner.name}
                  </span>
                  <span className="shrink-0 rounded-full bg-[--color-grass]/10 px-2 py-0.5 text-xs font-bold text-[--color-grass-deep]">
                    {owner.roleLabel}
                  </span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
