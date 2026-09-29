import { Plus } from 'lucide-react';
import { initials } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import type { LineupSide, LineupSlot } from './mockLineup';

export const SIDE_BG: Record<LineupSide, string> = {
  a: 'bg-team-a',
  b: 'bg-team-b',
};

export const SIDE_TEXT: Record<LineupSide, string> = {
  a: 'text-team-a',
  b: 'text-team-b',
};

interface LineupTokenProps {
  slot: LineupSlot;
  side: LineupSide;
}

/** Гравець на полі (кружок з ініціалами) або вільне місце «+». */
export function LineupToken({ slot, side }: LineupTokenProps) {
  const { player } = slot;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      {player ? (
        <button
          type="button"
          title={player.name}
          className={cn(
            'grid size-9 place-items-center rounded-full text-[11px] font-bold text-white sm:size-10 sm:text-xs',
            'shadow-[0_0_0_3px_var(--color-pitch)] transition-transform hover:scale-110',
            SIDE_BG[side],
          )}
        >
          {initials(player.name)}
        </button>
      ) : (
        <button
          type="button"
          aria-label="Вільне місце"
          title="Вільне місце"
          className="grid size-9 place-items-center rounded-full bg-slot text-white/80 shadow-[0_0_0_3px_var(--color-pitch)] transition-colors hover:bg-white/25 hover:text-white sm:size-10"
        >
          <Plus className="size-4" />
        </button>
      )}
      <span
        className={cn(
          'pointer-events-none absolute top-full mt-1 max-w-20 truncate text-[10px] font-medium whitespace-nowrap',
          player ? 'text-white/70' : 'text-white/30',
        )}
      >
        {player ? player.name.split(' ')[0] : 'вільно'}
      </span>
    </div>
  );
}
