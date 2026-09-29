import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isSameDay, startOfMonth, startOfToday } from 'date-fns';
import { useGames, useMe } from '@/api/hooks';
import { MonthCalendar } from '@/components/ui/MonthCalendar';
import { formatDateParam, getEventTone, getVisibleRange, parseDateParam, type EventTone } from './calendarUtils';
import { DEFAULT_VIEW } from './useCalendarState';

/** Кольори крапок, контрастні на темному фоні. */
const DOT_ON_DARK: Record<EventTone, string> = {
  confirmed: 'bg-lavender',
  maybe: 'bg-pink',
  open: 'bg-lime',
  finished: 'bg-rail-text/50',
};

/**
 * Міні-календар у бічній панелі: відмічає дні з іграми
 * і керує основним календарем через URL.
 */
export function MiniCalendar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const onCalendar = pathname === '/';
  const selected = onCalendar ? (parseDateParam(params.get('date')) ?? startOfToday()) : null;

  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()));
  // Коли основний календар перегортається — міні-календар іде слідом.
  const selectedKey = selected?.getTime();
  useEffect(() => {
    if (selectedKey !== undefined) setMonth(startOfMonth(new Date(selectedKey)));
  }, [selectedKey]);

  const range = useMemo(() => getVisibleRange('month', month), [month]);
  const { data: games = [] } = useGames({ from: range.start.toISOString(), to: range.end.toISOString() });
  const { data: me } = useMe();
  const gameOn = (day: Date) => games.find((g) => isSameDay(new Date(g.startsAt), day));

  const pick = (day: Date) => {
    const view = (onCalendar && params.get('view')) || DEFAULT_VIEW;
    navigate(`/?view=${view}&date=${formatDateParam(day)}`);
  };

  return (
    <MonthCalendar
      className="bg-rail-2/60"
      month={month}
      onMonthChange={setMonth}
      selected={selected}
      onSelect={pick}
      marker={(day) => {
        const game = gameOn(day);
        return game ? DOT_ON_DARK[getEventTone(game, me?.id)] : undefined;
      }}
      describeDay={(day) => (gameOn(day) ? 'є гра' : undefined)}
    />
  );
}
