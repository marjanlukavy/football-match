import { isBefore, isToday, startOfToday } from 'date-fns';
import { confirmedCount } from '@futbol/shared/game';
import type { Game, PlayerId } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { fmt, formatTimeRange, isOnDay } from '@/lib/date';
import { EVENT_TONE_CLASSES, getEventTone } from './calendarUtils';
import { useNow } from './useNow';

interface WeekAgendaProps {
  days: Date[];
  games: Game[];
  meId: PlayerId | undefined;
  selectedGameId: string | null;
  onSelectGame: (game: Game, anchor: HTMLElement) => void;
}

/** Тиждень списком — для телефона, де сім колонок не влазять. */
export function WeekAgenda({ days, games, meId, selectedGameId, onSelectGame }: WeekAgendaProps) {
  const now = useNow();

  return (
    <ol className="flex flex-col gap-2">
      {days.map((day) => {
        const dayGames = games.filter((g) => isOnDay(g.startsAt, day));
        const today = isToday(day);
        const past = isBefore(day, startOfToday());

        return (
          <li
            key={day.toISOString()}
            aria-current={today ? 'date' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-tile p-2',
              today ? 'bg-white shadow-soft' : 'bg-white/40',
              past && 'opacity-55',
            )}
          >
            <div className="flex w-12 shrink-0 flex-col items-center">
              <span className={cn('text-[11px] font-medium', today ? 'text-accent' : 'text-ink/55')}>
                {fmt(day, 'EEEEEE')}
              </span>
              <span className={cn('text-xl font-semibold tabular-nums', today ? 'text-accent' : 'text-ink')}>
                {fmt(day, 'd')}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {dayGames.length === 0 && <span className="py-3 text-xs text-ink/35">Без гри</span>}
              {dayGames.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={selectedGameId === game.id}
                  onClick={(e) => onSelectGame(game, e.currentTarget)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    EVENT_TONE_CLASSES[getEventTone(game, meId, now)],
                    selectedGameId === game.id && 'ring-2 ring-ink',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{game.location.name}</span>
                    <span className="block text-xs opacity-60 tabular-nums">
                      {formatTimeRange(game.startsAt, game.durationMin)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
                    {confirmedCount(game)}/{game.maxPlayers}
                  </span>
                </button>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
