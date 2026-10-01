import type { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { SkillMeter } from '@/components/ui/SkillMeter';
import type { Player } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { dragId, type DragData, type DragSource } from './dnd';

interface DraggablePlayerRowProps {
  player: Player;
  from: Exclude<DragSource, 'pitch'>;
  editable: boolean;
  /** Мітка під іменем (статус запису, «на полі»). */
  meta?: ReactNode;
  /** Кнопки праворуч; кліки по них не починають перетягування. */
  trailing?: ReactNode;
}

/** Рядок гравця, якого можна перетягнути в команду чи на поле. */
export function DraggablePlayerRow({ player, from, editable, meta, trailing }: DraggablePlayerRowProps) {
  const data: DragData = { playerId: player.id, from };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId(from, player.id),
    data,
    disabled: !editable,
  });

  return (
    <li className={cn('flex items-center gap-2 py-1.5 transition-opacity', isDragging && 'opacity-30')}>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        aria-label={editable ? `Перетягнути: ${player.name}` : player.name}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1 outline-none select-none',
          editable && 'cursor-grab hover:bg-black/[0.04] focus-visible:bg-lavender-soft active:cursor-grabbing',
        )}
      >
        {editable && <GripVertical className="size-4 shrink-0 text-subtle" />}
        <Avatar player={player} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{player.name}</p>
          {meta && <div className="mt-0.5 text-[11px] text-muted">{meta}</div>}
        </div>
        <SkillMeter value={player.skill} />
      </div>
      {trailing}
    </li>
  );
}
