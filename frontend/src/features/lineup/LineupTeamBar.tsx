import { Shuffle } from 'lucide-react';
import { initials } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { TEAM_HEX } from '@futbol/shared/constants';
import type { Player, PlayerId, Team } from '@futbol/shared/types';
import { cn } from '@/lib/cn';

interface LineupTeamBarProps {
  team: Team;
  /** Усі команди гри: якщо їх більше двох, назва стає вибором «хто на полі». */
  allTeams: readonly Team[];
  onTeamChange: (teamId: string) => void;
  playersById: ReadonlyMap<PlayerId, Player>;
  /** Перемішати місця гравців команди на полі; без нього кнопки немає. */
  onShuffle?: () => void;
  /** Нижня команда дзеркалить рядок: перемішування зліва, назва справа. */
  mirrored?: boolean;
}

/** Рядок команди над/під полем: колір і назва, склад аватарками, «перемішати місця». */
export function LineupTeamBar({ team, allTeams, onTeamChange, playersById, onShuffle, mirrored = false }: LineupTeamBarProps) {
  const hex = TEAM_HEX[team.color];
  const players = team.playerIds.flatMap((id) => playersById.get(id) ?? []);

  return (
    <div className={cn('flex items-center justify-between gap-3', mirrored && 'flex-row-reverse')}>
      <div className={cn('flex min-w-0 items-center gap-3', mirrored && 'flex-row-reverse')}>
        <span className="size-4 shrink-0 rounded-full ring-2 ring-white/15" style={{ backgroundColor: hex }} />
        {allTeams.length > 2 ? (
          <Select
            size="sm"
            ariaLabel={mirrored ? 'Команда знизу поля' : 'Команда зверху поля'}
            value={team.id}
            onValueChange={onTeamChange}
            options={allTeams.map((t) => ({ value: t.id, label: t.name }))}
          />
        ) : (
          <span className="truncate text-base font-bold">{team.name}</span>
        )}
        <span className="h-6 w-px shrink-0 bg-white/15 max-sm:hidden" />
        <div className={cn('flex items-center -space-x-2 max-sm:hidden', mirrored && 'flex-row-reverse space-x-reverse')}>
          {players.slice(0, 8).map((p) => (
            <span
              key={p.id}
              title={p.name}
              className="grid size-7 place-items-center rounded-full text-[9px] font-bold text-ink opacity-90 ring-2 ring-pitch"
              style={{ backgroundColor: hex }}
            >
              {initials(p.name)}
            </span>
          ))}
          {players.length > 8 && (
            <span className="grid size-7 place-items-center rounded-full bg-slot text-[9px] font-bold text-white ring-2 ring-pitch">
              +{players.length - 8}
            </span>
          )}
        </div>
      </div>

      {onShuffle && (
        <button
          type="button"
          onClick={onShuffle}
          disabled={players.length === 0}
          aria-label={`Перемішати місця: ${team.name}`}
          title="Перемішати місця на полі"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-40"
        >
          <Shuffle className="size-4" />
        </button>
      )}
    </div>
  );
}
