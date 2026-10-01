import { useDraggable } from '@dnd-kit/core';
import { initials } from '@/components/ui/Avatar';
import type { PitchPoint, Player } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { dragId, type DragData } from './dnd';

interface LineupTokenProps {
  player: Player;
  /** Колір манішки команди. */
  hex: string;
  /** Місце на екрані у відсотках поля. */
  at: PitchPoint;
  editable: boolean;
}

/** Гравець на полі: кружок у кольорі команди з ініціалами; організатор перетягує його. */
export function LineupToken({ player, hex, at, editable }: LineupTokenProps) {
  const data: DragData = { playerId: player.id, from: 'pitch' };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId('pitch', player.id),
    data,
    disabled: !editable,
  });

  return (
    <div
      className={cn(
        'absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-[left,top] duration-300 ease-out',
        isDragging && 'opacity-0',
      )}
      style={{ left: `${at.x}%`, top: `${at.y}%` }}
    >
      <button
        ref={setNodeRef}
        type="button"
        title={player.name}
        aria-label={`${player.name} на полі`}
        {...attributes}
        {...listeners}
        className={cn(
          'grid size-9 touch-none place-items-center rounded-full text-[11px] font-bold text-ink sm:size-10 sm:text-xs',
          'shadow-[0_0_0_3px_var(--color-pitch)] transition-transform',
          editable ? 'cursor-grab hover:scale-110 active:cursor-grabbing' : 'cursor-default',
        )}
        style={{ backgroundColor: hex }}
      >
        {initials(player.name)}
      </button>
      <span className="pointer-events-none absolute top-full mt-1 max-w-20 truncate text-[10px] font-medium whitespace-nowrap text-white/70">
        {player.name.split(' ')[0]}
      </span>
    </div>
  );
}

/** Фішка під курсором під час перетягування. */
export function DragToken({ player, hex }: { player: Player; hex: string | undefined }) {
  return (
    <div className="flex cursor-grabbing items-center gap-2 rounded-full bg-ink py-1 pr-3 pl-1 text-white shadow-pop">
      <span
        className="grid size-9 place-items-center rounded-full text-[11px] font-bold text-ink"
        style={{ backgroundColor: hex ?? 'var(--color-lavender)' }}
      >
        {initials(player.name)}
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">{player.name}</span>
    </div>
  );
}
