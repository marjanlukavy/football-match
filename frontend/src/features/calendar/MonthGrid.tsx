import { Plus } from 'lucide-react';
import { isBefore, isSameMonth, isToday, startOfToday } from 'date-fns';
import { confirmedCount } from '@futbol/shared/game';
import type { Game, PlayerId } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { fmt, formatTime, isOnDay } from '@/lib/date';
import { EVENT_TONE_CLASSES, EVENT_TONE_DOT, getEventTone } from './calendarUtils';
import { useNow } from './useNow';

interface MonthGridProps {
  month: Date;
  days: Date[];
  games: Game[];
  meId: PlayerId | undefined;
  selectedGameId: string | null;
  onSelectGame: (game: Game, anchor: HTMLElement) => void;
  /** Клік по числу — відкрити тиждень з цим днем. */
  onOpenWeek: (day: Date) => void;
  onCreateAt?: (date: Date) => void;
}

/** Місячний вигляд: відмітки днів з іграми й короткі «таблетки» ігор. */
export function MonthGrid({
  month,
  days,
  games,
  meId,
  selectedGameId,
  onSelectGame,
  onOpenWeek,
  onCreateAt,
}: MonthGridProps) {
  const now = useNow();
  const weekdays = days.slice(0, 7);

  return (
    <div>
      <div>
        <div className="mb-3 grid grid-cols-7 gap-1 sm:gap-2">
          {weekdays.map((day) => (
            <div
              key={day.getDay()}
              className="rounded-tile bg-white/35 py-2 text-center text-xs font-medium text-ink/55 capitalize sm:py-2.5 sm:text-sm"
            >
              {fmt(day, 'EEEEEE')}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 rounded-card bg-white/85 p-1.5 shadow-soft ring-1 ring-white/60 backdrop-blur-xl sm:gap-1.5 sm:p-2">
          {days.map((day) => {
            const dayGames = games.filter((g) => isOnDay(g.startsAt, day));
            const outside = !isSameMonth(day, month);
            const past = isBefore(day, startOfToday());
            const canCreate = Boolean(onCreateAt) && !past;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'group/day relative flex min-h-16 flex-col items-center gap-1 rounded-tile p-1 transition-colors sm:min-h-28 sm:items-stretch sm:p-2',
                  dayGames.length > 0 ? 'bg-panel' : 'hover:bg-panel/70',
                  outside && 'opacity-45',
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenWeek(day)}
                    aria-current={isToday(day) ? 'date' : undefined}
                    aria-label={`Тиждень з ${fmt(day, 'd MMMM')}`}
                    className={cn(
                      'grid size-8 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors',
                      isToday(day) ? 'bg-accent text-white' : 'text-ink hover:bg-black/5',
                      past && !isToday(day) && 'text-ink/45',
                    )}
                  >
                    {fmt(day, 'd')}
                  </button>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => onCreateAt!(day)}
                      aria-label={`Створити гру ${fmt(day, 'd MMMM')}`}
                      className="hidden size-7 place-items-center rounded-full text-accent opacity-0 transition-opacity group-hover/day:opacity-100 hover:bg-accent/10 focus-visible:opacity-100 sm:grid"
                    >
                      <Plus className="size-4" />
                    </button>
                  )}
                </div>

                {/* Телефон: лише кольорові крапки; ширші екрани: «таблетки» з часом і місцем. */}
                {dayGames.map((game) => (
                  <button
                    key={`dot-${game.id}`}
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`${formatTime(game.startsAt)}, ${game.location.name}`}
                    onClick={(e) => onSelectGame(game, e.currentTarget)}
                    className="grid size-6 place-items-center rounded-full sm:hidden"
                  >
                    <span className={cn('size-2 rounded-full', EVENT_TONE_DOT[getEventTone(game, meId, now)])} />
                  </button>
                ))}
                {dayGames.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={selectedGameId === game.id}
                    onClick={(e) => onSelectGame(game, e.currentTarget)}
                    className={cn(
                      'hidden w-full flex-col rounded-xl px-2.5 py-1.5 text-left transition-colors sm:flex',
                      EVENT_TONE_CLASSES[getEventTone(game, meId, now)],
                      selectedGameId === game.id && 'ring-2 ring-ink',
                    )}
                  >
                    <span className="flex items-center justify-between gap-1 text-[11px] font-semibold tabular-nums">
                      {formatTime(game.startsAt)}
                      <span className="opacity-60">
                        {confirmedCount(game)}/{game.maxPlayers}
                      </span>
                    </span>
                    <span className="truncate text-xs font-medium opacity-80">{game.location.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
