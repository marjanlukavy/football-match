import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addMonths, addWeeks, startOfToday } from 'date-fns';
import {
  formatDateParam,
  getVisibleRange,
  parseDateParam,
  parseViewParam,
  type CalendarView,
} from './calendarUtils';

export const DEFAULT_VIEW: CalendarView = 'week';

const STEP: Record<CalendarView, (date: Date, amount: number) => Date> = {
  month: addMonths,
  week: addWeeks,
};

/**
 * Стан календаря живе в URL (?view=week&date=2026-09-21):
 * посиланням можна поділитись, а міні-календар у сайдбарі
 * керує тим самим станом без спільного стору.
 */
export function useCalendarState() {
  const [params, setParams] = useSearchParams();
  const view = parseViewParam(params.get('view')) ?? DEFAULT_VIEW;
  const dateParam = params.get('date');
  const date = useMemo(() => parseDateParam(dateParam) ?? startOfToday(), [dateParam]);
  const range = useMemo(() => getVisibleRange(view, date), [view, date]);

  const update = useCallback(
    (next: { view?: CalendarView; date?: Date }) => {
      setParams(
        (prev) => {
          const result = new URLSearchParams(prev);
          if (next.view) result.set('view', next.view);
          if (next.date) result.set('date', formatDateParam(next.date));
          return result;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return {
    view,
    date,
    range,
    setView: (value: CalendarView) => update({ view: value }),
    setDate: (value: Date) => update({ date: value }),
    /** Відкрити тиждень, у якому цей день. */
    openWeek: (value: Date) => update({ view: 'week', date: value }),
    prev: () => update({ date: STEP[view](date, -1) }),
    next: () => update({ date: STEP[view](date, 1) }),
    today: () => update({ date: startOfToday() }),
  };
}

export type CalendarState = ReturnType<typeof useCalendarState>;
