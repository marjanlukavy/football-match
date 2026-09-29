import type { CSSProperties } from 'react';
import { AvatarStack } from '@/components/ui/Avatar';
import { confirmedCount } from '@futbol/shared/game';
import type { Game, Player } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { formatTimeRange } from '@/lib/date';
import { EVENT_TONE_CLASSES, type EventTone } from './calendarUtils';

interface GameEventCardProps {
  game: Game;
  tone: EventTone;
  /** Підтверджені гравці — для аватарок. */
  attendees: Player[];
  height: number;
  selected: boolean;
  style?: CSSProperties;
  onSelect: (anchor: HTMLElement) => void;
}

/** Блок гри в тижневій сітці: назва, час і хто вже записався. */
export function GameEventCard({ game, tone, attendees, height, selected, style, onSelect }: GameEventCardProps) {
  const count = confirmedCount(game);
  const roomy = height >= 96;
  const tiny = height < 52;

  return (
    <button
      type="button"
      style={style}
      aria-haspopup="dialog"
      aria-expanded={selected}
      onClick={(e) => onSelect(e.currentTarget)}
      className={cn(
        'absolute flex flex-col overflow-hidden rounded-tile text-left transition-[background-color,box-shadow,transform]',
        'duration-150 hover:z-10 hover:-translate-y-px focus-visible:z-10',
        tiny ? 'justify-center px-3 py-1' : 'p-3',
        EVENT_TONE_CLASSES[tone],
        selected && 'z-10 shadow-pop ring-2 ring-ink',
      )}
    >
      <span className="truncate text-[13px] leading-tight font-semibold">{game.location.name}</span>
      <span className="mt-0.5 text-[11px] font-medium opacity-60 tabular-nums">
        {formatTimeRange(game.startsAt, game.durationMin)}
      </span>

      {roomy && (
        <span className="mt-auto flex items-center pt-2">
          <AvatarStack players={attendees.slice(0, 3)} max={3} size="xs" />
          <span
            title={`Підтвердили ${count} з ${game.maxPlayers}`}
            className={cn(
              'relative inline-grid h-6 shrink-0 place-items-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-white tabular-nums ring-2 ring-white',
              attendees.length > 0 && '-ml-1',
            )}
          >
            {count}/{game.maxPlayers}
          </span>
        </span>
      )}
    </button>
  );
}
