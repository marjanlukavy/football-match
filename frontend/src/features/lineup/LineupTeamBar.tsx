import { Shuffle } from 'lucide-react';
import { initials } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import { SIDE_BG, SIDE_TEXT } from './LineupToken';
import type { LineupTeam } from './mockLineup';

interface LineupTeamBarProps {
  team: LineupTeam;
  /** Нижня команда дзеркалить рядок: перемішування зліва, літера справа. */
  mirrored?: boolean;
}

/** Рядок команди над/під полем: літера, склад аватарками, «перемішати». */
export function LineupTeamBar({ team, mirrored = false }: LineupTeamBarProps) {
  const players = team.slots.flatMap((s) => s.player ?? []);

  return (
    <div className={cn('flex items-center justify-between gap-3', mirrored && 'flex-row-reverse')}>
      <div className={cn('flex min-w-0 items-center gap-3', mirrored && 'flex-row-reverse')}>
        <span className={cn('text-3xl leading-none font-extrabold', SIDE_TEXT[team.side])} title={team.name}>
          {team.label}
        </span>
        <span className="h-6 w-px bg-white/15" />
        <div className={cn('flex items-center -space-x-2', mirrored && 'flex-row-reverse space-x-reverse')}>
          {players.map((p) => (
            <span
              key={p.id}
              title={p.name}
              className={cn(
                'grid size-7 place-items-center rounded-full text-[9px] font-bold text-white opacity-90 ring-2 ring-pitch',
                SIDE_BG[team.side],
              )}
            >
              {initials(p.name)}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Перемішати команду ${team.label}`}
        title="Перемішати"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
      >
        <Shuffle className="size-4" />
      </button>
    </div>
  );
}
