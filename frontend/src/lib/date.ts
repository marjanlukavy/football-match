import { addMinutes, format, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { gameEnd, toDate } from '@futbol/shared/game';

export { gameEnd, toDate };

export const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export function fmt(value: string | Date, pattern: string): string {
  return format(toDate(value), pattern, { locale: uk });
}

/** «19:00» */
export function formatTime(value: string | Date): string {
  return fmt(value, 'HH:mm');
}

/** «19:00 – 20:30» */
export function formatTimeRange(startsAt: string | Date, durationMin: number): string {
  const start = toDate(startsAt);
  return `${formatTime(start)} – ${formatTime(addMinutes(start, durationMin))}`;
}

/** «субота, 27 вересня» */
export function formatLongDate(value: string | Date): string {
  return fmt(value, 'EEEE, d MMMM');
}

/** «27 вер.» */
export function formatShortDate(value: string | Date): string {
  return fmt(value, 'd MMM');
}

/** «Вересень 2026» — назва місяця в називному відмінку. */
export function formatMonthTitle(value: Date): string {
  return capitalize(fmt(value, 'LLLL yyyy'));
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function isOnDay(value: string | Date, day: Date): boolean {
  return isSameDay(toDate(value), day);
}

/** Значення для <input type="date"> / <input type="time">. */
export function toDateInput(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

export function toTimeInput(value: Date): string {
  return format(value, 'HH:mm');
}

/** Склеює значення date- і time-інпутів у ISO-рядок з урахуванням локальної зони. */
export function fromDateTimeInputs(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}
