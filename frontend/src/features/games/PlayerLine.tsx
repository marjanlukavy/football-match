import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { SkillMeter } from '@/components/ui/SkillMeter';
import { DUTY_LABELS } from '@futbol/shared/constants';
import type { DutyKind, Player } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { DutyIcon } from './DutyIcon';

interface PlayerLineProps {
  player: Player;
  isMe?: boolean;
  duties?: readonly DutyKind[];
  trailing?: ReactNode;
  className?: string;
}

/** Рядок гравця: аватар, ім'я, рівень — у списках учасників і командах. */
export function PlayerLine({ player, isMe = false, duties = [], trailing, className }: PlayerLineProps) {
  return (
    <div className={cn('flex items-center gap-3 py-2', className)}>
      <Avatar player={player} />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-ink">{player.name}</span>
        {isMe && <span className="shrink-0 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">ви</span>}
        {duties.map((kind) => (
          <span
            key={kind}
            title={`Відповідає за: ${DUTY_LABELS[kind].toLowerCase()}`}
            className="grid size-5 shrink-0 place-items-center rounded-full bg-lime/80 text-ink"
          >
            <DutyIcon kind={kind} className="size-3" />
          </span>
        ))}
      </div>
      <SkillMeter value={player.skill} className="shrink-0" />
      {trailing}
    </div>
  );
}
