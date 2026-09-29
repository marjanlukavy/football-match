import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { isBefore, isSameDay, isToday, setHours, startOfToday } from 'date-fns';
import { getAttendees } from '@futbol/shared/game';
import type { Game, Player, PlayerId } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { fmt, isOnDay, toDate } from '@/lib/date';
import { getEventTone, getHourRange, HOUR_HEIGHT, layoutDayGames, minutesOfDay, timezoneLabel } from './calendarUtils';
import { GameEventCard } from './GameEventCard';
import { useNow } from './useNow';

interface TimeGridProps {
  days: Date[];
  games: Game[];
  meId: PlayerId | undefined;
  playersById: ReadonlyMap<PlayerId, Player>;
  selectedGameId: string | null;
  onSelectGame: (game: Game, anchor: HTMLElement) => void;
  /** Лише для організатора: клік по вільній годині. */
  onCreateAt?: (date: Date) => void;
}

const COLUMNS = '3.5rem repeat(7, minmax(0, 1fr))';

/** Тижневий вигляд: години зліва, дні колонками, ігри — блоками. */
export function TimeGrid({ days, games, meId, playersById, selectedGameId, onSelectGame, onCreateAt }: TimeGridProps) {
  const now = useNow();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { first, last } = useMemo(() => getHourRange(games), [games]);
  const hours = useMemo(() => Array.from({ length: last - first }, (_, i) => first + i), [first, last]);
  const gamesByDay = useMemo(
    () => days.map((day) => layoutDayGames(games.filter((g) => isOnDay(g.startsAt, day)), first)),
    [days, games, first],
  );

  const attendeesOf = (game: Game) =>
    getAttendees(game, 'confirmed').flatMap((r) => playersById.get(r.playerId) ?? []);

  // Прокручуємо до першої гри (або до поточної години) — лише коли змінився
  // тиждень чи набір ігор, а не після кожного запису.
  const scrollKey = `${days[0]?.toISOString()}|${games.map((g) => g.id).join()}`;
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const starts = games.map((g) => toDate(g.startsAt).getHours());
    const target = starts.length ? Math.min(...starts) : days.some((d) => isToday(d)) ? new Date().getHours() - 1 : first;
    el.scrollTop = Math.max(0, (target - first) * HOUR_HEIGHT - 12);
  }, [scrollKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const nowTop = ((minutesOfDay(now) - first * 60) / 60) * HOUR_HEIGHT;
  const nowVisible = nowTop >= 0 && nowTop <= hours.length * HOUR_HEIGHT;

  return (
    <div className="flex flex-col gap-3">
      {/* Заголовки днів */}
      <div className="grid gap-2" style={{ gridTemplateColumns: COLUMNS }}>
        <div className="grid place-items-center rounded-tile bg-lime/60 text-[11px] font-semibold text-ink/60">
          <span className="-rotate-90 whitespace-nowrap">{timezoneLabel(now)}</span>
        </div>
        {days.map((day) => (
          <DayHeader key={day.toISOString()} day={day} />
        ))}
      </div>

      {/* Сітка */}
      <div className="rounded-card bg-white/85 shadow-soft ring-1 ring-white/60 backdrop-blur-xl">
        <div
          ref={scrollRef}
          className="scrollbar-thin max-h-[max(420px,calc(100dvh-17rem))] overflow-y-auto rounded-card px-3 py-4"
        >
          <div className="relative grid" style={{ gridTemplateColumns: COLUMNS, height: hours.length * HOUR_HEIGHT }}>
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="pointer-events-none absolute inset-x-0 flex items-start"
                style={{ top: i * HOUR_HEIGHT }}
              >
                <span className="w-14 -translate-y-2 pr-3 text-right text-xs font-medium text-muted tabular-nums">
                  {hour}:00
                </span>
                <span className="flex-1 border-t border-line" />
              </div>
            ))}

            <div aria-hidden />
            {days.map((day, dayIndex) => (
              <DayColumn key={day.toISOString()} day={day} hours={hours} onCreateAt={onCreateAt}>
                {gamesByDay[dayIndex].map(({ game, top, height, lane, lanes }) => (
                  <GameEventCard
                    key={game.id}
                    game={game}
                    tone={getEventTone(game, meId, now)}
                    attendees={attendeesOf(game)}
                    height={height}
                    selected={selectedGameId === game.id}
                    onSelect={(anchor) => onSelectGame(game, anchor)}
                    style={{
                      top: top + 2,
                      height: height - 4,
                      left: `calc(${(lane / lanes) * 100}% + 4px)`,
                      width: `calc(${100 / lanes}% - 8px)`,
                    }}
                  />
                ))}

                {isSameDay(day, now) && nowVisible && (
                  <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowTop }}>
                    <div className="relative h-0.5 bg-accent">
                      <span className="absolute -top-[5px] -left-1.5 size-3 rounded-full border-2 border-white bg-accent" />
                    </div>
                  </div>
                )}
              </DayColumn>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayHeader({ day }: { day: Date }) {
  const today = isToday(day);
  const past = isBefore(day, startOfToday());
  return (
    <div
      aria-current={today ? 'date' : undefined}
      className={cn(
        'flex h-20 items-center justify-center gap-2 rounded-tile',
        today ? 'bg-white shadow-soft' : 'bg-white/35',
        past && 'opacity-50',
      )}
    >
      <span className={cn('text-sm font-medium', today ? 'text-accent' : 'text-ink/55')}>{fmt(day, 'EEEEEE')}</span>
      <span
        className={cn(
          'text-3xl font-semibold tracking-tight tabular-nums lg:text-[34px]',
          today ? 'text-accent' : 'text-ink',
        )}
      >
        {fmt(day, 'd')}
      </span>
    </div>
  );
}

function DayColumn({
  day,
  hours,
  onCreateAt,
  children,
}: {
  day: Date;
  hours: number[];
  onCreateAt?: (date: Date) => void;
  children: ReactNode;
}) {
  const canCreate = Boolean(onCreateAt) && !isBefore(day, startOfToday());
  return (
    <div className={cn('relative', isToday(day) && 'rounded-tile bg-accent/[0.035]')}>
      {canCreate &&
        hours.map((hour, i) => (
          <button
            key={hour}
            type="button"
            aria-label={`Створити гру ${fmt(day, 'd MMMM')} о ${hour}:00`}
            onClick={() => onCreateAt!(setHours(day, hour))}
            className="absolute inset-x-1 flex items-center justify-center rounded-xl opacity-0 transition-opacity hover:bg-accent/[0.06] hover:opacity-100 focus-visible:opacity-100"
            style={{ top: i * HOUR_HEIGHT + 2, height: HOUR_HEIGHT - 4 }}
          >
            <Plus className="size-4 text-accent" />
          </button>
        ))}
      {children}
    </div>
  );
}
