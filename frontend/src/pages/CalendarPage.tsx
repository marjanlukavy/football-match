import { useState } from 'react';
import { isBefore, startOfToday } from 'date-fns';
import { useGames, useIsAdmin, useMe, usePlayersById } from '@/api/hooks';
import { getErrorMessage } from '@/api/errors';
import { ErrorState, Spinner } from '@/components/ui/States';
import type { Game } from '@futbol/shared/types';
import { CalendarLegend } from '@/features/calendar/CalendarLegend';
import { CalendarToolbar } from '@/features/calendar/CalendarToolbar';
import { GamePopover } from '@/features/calendar/GamePopover';
import { MonthGrid } from '@/features/calendar/MonthGrid';
import { TimeGrid } from '@/features/calendar/TimeGrid';
import { useCalendarState } from '@/features/calendar/useCalendarState';
import { WeekAgenda } from '@/features/calendar/WeekAgenda';
import { GameFormModal } from '@/features/games/GameFormModal';

interface Selection {
  gameId: string;
  anchor: HTMLElement;
  /** Діапазон, у якому відкрили поповер: при перегортанні він закривається сам. */
  rangeKey: string;
}

/** Календар ігор: місяць / тиждень, картка гри поверх календаря, створення гри. */
export default function CalendarPage() {
  const state = useCalendarState();
  const { view, date, range } = state;
  const isAdmin = useIsAdmin();
  const { data: me } = useMe();
  const playersById = usePlayersById();
  const gamesQuery = useGames({ from: range.start.toISOString(), to: range.end.toISOString() });
  const games = gamesQuery.data ?? [];

  const [selection, setSelection] = useState<Selection | null>(null);
  const [createAt, setCreateAt] = useState<Date | null>(null);

  const rangeKey = `${view}|${range.start.toISOString()}`;
  const active = selection?.rangeKey === rangeKey ? selection : null;
  // Гра береться зі свіжих даних, тож поповер одразу бачить зміни після запису.
  const selectedGame = active ? games.find((g) => g.id === active.gameId) : undefined;

  const toggleGame = (game: Game, anchor: HTMLElement) =>
    setSelection(selectedGame?.id === game.id ? null : { gameId: game.id, anchor, rangeKey });

  const shared = {
    games,
    meId: me?.id,
    selectedGameId: selectedGame?.id ?? null,
    onSelectGame: toggleGame,
  };
  const onCreateAt = isAdmin ? (at: Date) => setCreateAt(at) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <CalendarToolbar
        state={state}
        onCreate={isAdmin ? () => setCreateAt(isBefore(date, startOfToday()) ? startOfToday() : date) : undefined}
      />

      {gamesQuery.isError ? (
        <ErrorState message={getErrorMessage(gamesQuery.error)} onRetry={() => gamesQuery.refetch()} />
      ) : (
        <div className="relative">
          {view === 'month' ? (
            <MonthGrid month={date} days={range.days} onOpenWeek={state.openWeek} onCreateAt={onCreateAt} {...shared} />
          ) : (
            <>
              <div className="hidden md:block">
                <TimeGrid days={range.days} playersById={playersById} onCreateAt={onCreateAt} {...shared} />
              </div>
              <div className="md:hidden">
                <WeekAgenda days={range.days} {...shared} />
              </div>
            </>
          )}
          {gamesQuery.isFetching && (
            <div className="absolute top-3 right-3 rounded-full bg-white/80 p-1.5 shadow-soft">
              <Spinner className="size-4" />
            </div>
          )}
        </div>
      )}

      <CalendarLegend />

      {active && selectedGame && (
        <GamePopover
          game={selectedGame}
          anchor={active.anchor}
          meId={me?.id}
          playersById={playersById}
          onClose={() => setSelection(null)}
        />
      )}

      {isAdmin && (
        <GameFormModal
          open={createAt !== null}
          defaultDate={createAt ?? undefined}
          onClose={() => setCreateAt(null)}
          onSaved={(game) => state.setDate(new Date(game.startsAt))}
        />
      )}
    </div>
  );
}
