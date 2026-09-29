import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { cn } from '@/lib/cn';
import { capitalize, fmt, WEEK_OPTIONS } from '@/lib/date';

interface MonthCalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  selected?: Date | null;
  onSelect: (day: Date) => void;
  /** Клас кольору крапки під днем (напр. день з грою) або undefined. */
  marker?: (day: Date) => string | undefined;
  isDisabled?: (day: Date) => boolean;
  /** Підпис дня для скрінрідера, напр. «є гра». */
  describeDay?: (day: Date) => string | undefined;
  className?: string;
}

/**
 * Темний місячний календар (дизайн міні-календаря з сайдбару).
 * Використовується і в сайдбарі, і як вибір дати у формах.
 */
export function MonthCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  marker,
  isDisabled,
  describeDay,
  className,
}: MonthCalendarProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  });

  return (
    <section aria-label="Календар" className={cn('rounded-3xl bg-rail p-3 text-white', className)}>
      <div className="mb-2 flex items-center justify-between pl-1.5">
        <span className="text-sm font-semibold">{capitalize(fmt(month, 'LLLL yyyy'))}</span>
        <div className="flex">
          <Arrow label="Попередній місяць" onClick={() => onMonthChange(addMonths(month, -1))}>
            <ChevronLeft className="size-4" />
          </Arrow>
          <Arrow label="Наступний місяць" onClick={() => onMonthChange(addMonths(month, 1))}>
            <ChevronRight className="size-4" />
          </Arrow>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center">
        {days.slice(0, 7).map((day) => (
          <span key={day.getDay()} className="pb-1 text-[10px] font-medium text-rail-text/70 uppercase">
            {fmt(day, 'EEEEEE')}
          </span>
        ))}
        {days.map((day) => {
          const today = isToday(day);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const disabled = isDisabled?.(day) ?? false;
          const dot = marker?.(day);
          const description = describeDay?.(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              aria-label={`${fmt(day, 'd MMMM')}${description ? `, ${description}` : ''}`}
              aria-pressed={isSelected}
              aria-current={today ? 'date' : undefined}
              className={cn(
                'relative mx-auto grid size-8 place-items-center rounded-full text-xs font-medium tabular-nums transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-25',
                isSameMonth(day, month) ? 'text-rail-text hover:bg-white/10 hover:text-white' : 'text-rail-text/35',
                today && 'bg-lime font-bold text-ink hover:bg-lime hover:text-ink',
                isSelected && !today && 'bg-white font-bold text-ink hover:bg-white hover:text-ink',
                isSelected && today && 'ring-1 ring-white/60 ring-offset-2 ring-offset-rail',
              )}
            >
              {fmt(day, 'd')}
              {dot && (
                <span
                  className={cn(
                    'absolute bottom-0.5 size-1 rounded-full',
                    today || isSelected ? 'bg-ink' : dot,
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Arrow({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-full text-rail-text transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}
