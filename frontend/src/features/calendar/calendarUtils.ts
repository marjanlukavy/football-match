import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { getPhase, getRegistration } from '@futbol/shared/game';
import type { Game, PlayerId } from '@futbol/shared/types';
import { capitalize, fmt, toDate, WEEK_OPTIONS } from '@/lib/date';

export type CalendarView = 'month' | 'week';

export const CALENDAR_VIEWS: readonly CalendarView[] = ['month', 'week'];

export const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Місяць',
  week: 'Тиждень',
};

// ——— Параметри URL ———

const DATE_PARAM_FORMAT = 'yyyy-MM-dd';

export function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = parse(value, DATE_PARAM_FORMAT, new Date());
  return isValid(date) ? startOfDay(date) : null;
}

export function formatDateParam(date: Date): string {
  return format(date, DATE_PARAM_FORMAT);
}

export function parseViewParam(value: string | null): CalendarView | null {
  return CALENDAR_VIEWS.includes(value as CalendarView) ? (value as CalendarView) : null;
}

// ——— Видимий діапазон ———

export interface VisibleRange {
  days: Date[];
  /** Початок першого дня, включно. */
  start: Date;
  /** Початок дня після останнього, не включно. */
  end: Date;
}

export function getVisibleRange(view: CalendarView, anchor: Date): VisibleRange {
  const first = startOfWeek(view === 'month' ? startOfMonth(anchor) : anchor, WEEK_OPTIONS);
  const last = endOfWeek(view === 'month' ? endOfMonth(anchor) : anchor, WEEK_OPTIONS);
  const days = eachDayOfInterval({ start: first, end: last });
  return { days, start: startOfDay(first), end: addDays(startOfDay(last), 1) };
}

/** Заголовок тулбара: «Вересень 2026», «Вересень – Жовтень 2026», «Грудень 2026 – Січень 2027». */
export function formatRangeTitle(view: CalendarView, anchor: Date, range: VisibleRange): string {
  if (view !== 'week') return capitalize(fmt(anchor, 'LLLL yyyy'));
  const first = range.days[0];
  const last = range.days[range.days.length - 1];
  if (isSameMonth(first, last)) return capitalize(fmt(first, 'LLLL yyyy'));
  if (isSameYear(first, last)) return `${capitalize(fmt(first, 'LLLL'))} – ${fmt(last, 'LLLL yyyy')}`;
  return `${capitalize(fmt(first, 'LLLL yyyy'))} – ${fmt(last, 'LLLL yyyy')}`;
}

/** «GMT+3» для підпису часової колонки. */
export function timezoneLabel(date: Date = new Date()): string {
  const offset = -date.getTimezoneOffset() / 60;
  const sign = offset >= 0 ? '+' : '−';
  const abs = Math.abs(offset);
  return `GMT${sign}${Number.isInteger(abs) ? abs : abs.toFixed(1)}`;
}

// ——— Колір події ———

/** Як подія виглядає для поточного гравця. */
export type EventTone = 'confirmed' | 'maybe' | 'open' | 'finished';

export function getEventTone(game: Game, meId: PlayerId | undefined, now: Date = new Date()): EventTone {
  if (getPhase(game, now) === 'finished') return 'finished';
  return getRegistration(game, meId)?.status ?? 'open';
}

export const EVENT_TONE_LABELS: Record<EventTone, string> = {
  confirmed: 'Я точно буду',
  maybe: 'Можливо не зможу',
  open: 'Не записаний',
  finished: 'Завершена',
};

export const EVENT_TONE_CLASSES: Record<EventTone, string> = {
  confirmed: 'bg-lavender text-ink hover:bg-[#bdb2f4]',
  maybe: 'bg-pink/80 text-ink hover:bg-pink',
  open: 'bg-mist text-ink hover:bg-[#cfdde5]',
  finished: 'bg-[#ececf0] text-ink/55 hover:bg-[#e4e4ea]',
};

/** Колір маркера-крапки (легенда, міні-календар, місячний вид). */
export const EVENT_TONE_DOT: Record<EventTone, string> = {
  confirmed: 'bg-accent',
  maybe: 'bg-pink-ink',
  open: 'bg-mist-ink',
  finished: 'bg-subtle',
};

// ——— Часова сітка ———

export const HOUR_HEIGHT = 68;
const DEFAULT_FIRST_HOUR = 9;
const DEFAULT_LAST_HOUR = 22;

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Години, які показує сітка: стандартні рамки, розширені під фактичні ігри. */
export function getHourRange(games: readonly Game[]): { first: number; last: number } {
  let first = DEFAULT_FIRST_HOUR;
  let last = DEFAULT_LAST_HOUR;
  for (const game of games) {
    const start = toDate(game.startsAt);
    const endMin = Math.min(24 * 60, minutesOfDay(start) + game.durationMin);
    first = Math.min(first, start.getHours());
    last = Math.max(last, Math.ceil(endMin / 60));
  }
  return { first, last };
}

export interface PositionedGame {
  game: Game;
  top: number;
  height: number;
  /** Доріжка й кількість доріжок — для ігор, що перетинаються в часі. */
  lane: number;
  lanes: number;
}

/**
 * Розкладка ігор одного дня: вертикальна позиція за часом,
 * ігри, що перетинаються, діляться на паралельні доріжки.
 */
export function layoutDayGames(games: readonly Game[], firstHour: number): PositionedGame[] {
  const sorted = [...games].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const result: PositionedGame[] = [];
  let cluster: PositionedGame[] = [];
  let clusterEnd = -Infinity;
  let laneEnds: number[] = [];

  const flush = () => {
    const lanes = laneEnds.length;
    for (const item of cluster) item.lanes = lanes;
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const game of sorted) {
    const startMin = minutesOfDay(toDate(game.startsAt));
    const endMin = Math.min(24 * 60, startMin + game.durationMin);
    if (startMin >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= startMin);
    if (lane === -1) lane = laneEnds.push(endMin) - 1;
    else laneEnds[lane] = endMin;
    clusterEnd = Math.max(clusterEnd, endMin);

    cluster.push({
      game,
      top: ((startMin - firstHour * 60) / 60) * HOUR_HEIGHT,
      height: Math.max(28, ((endMin - startMin) / 60) * HOUR_HEIGHT),
      lane,
      lanes: 1,
    });
  }
  flush();
  return result;
}
