import type { TeamOwnershipView } from './viewmodel.js';

export function TeamOwnership({ teams }: { teams: TeamOwnershipView[] }) {
  if (teams.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-bold text-[--color-grass-deep]">
        <span>👥</span> Joukkueiden veikkaajat
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
                    {team.owners.length} veikkaajaa
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
