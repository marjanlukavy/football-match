import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { startOfToday } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { cn } from '@/lib/cn';
import { CALENDAR_VIEWS, formatRangeTitle, VIEW_LABELS } from './calendarUtils';
import type { CalendarState } from './useCalendarState';

const VIEW_OPTIONS = CALENDAR_VIEWS.map((value) => ({ value, label: VIEW_LABELS[value] }));

const PREV_LABEL = { month: 'Попередній місяць', week: 'Попередній тиждень' };
const NEXT_LABEL = { month: 'Наступний місяць', week: 'Наступний тиждень' };

interface CalendarToolbarProps {
  state: CalendarState;
  onCreate?: () => void;
}

export function CalendarToolbar({ state, onCreate }: CalendarToolbarProps) {
  const { view, date, range } = state;
  const today = startOfToday();
  const showsToday = today >= range.start && today < range.end;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <h1 className="truncate text-xl font-semibold tracking-tight text-ink sm:text-[28px]">
          {formatRangeTitle(view, date, range)}
        </h1>
        <button
          type="button"
          onClick={state.today}
          className={cn(
            'rounded-full px-3.5 py-1 text-xs font-semibold transition-colors',
            showsToday ? 'bg-ink text-white' : 'bg-white/70 text-ink ring-1 ring-black/10 hover:bg-white',
          )}
        >
          Сьогодні
        </button>
        <div className="flex items-center">
          <NavArrow label={PREV_LABEL[view]} onClick={state.prev}>
            <ChevronLeft className="size-5" />
          </NavArrow>
          <NavArrow label={NEXT_LABEL[view]} onClick={state.next}>
            <ChevronRight className="size-5" />
          </NavArrow>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SegmentedControl ariaLabel="Вигляд календаря" value={view} options={VIEW_OPTIONS} onChange={state.setView} />
        {onCreate && (
          <Button variant="primary" size="md" icon={<Plus className="size-4" />} onClick={onCreate}>
            <span className="max-sm:sr-only">Нова гра</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function NavArrow({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-ink/70 transition-colors hover:bg-white/60 hover:text-ink"
    >
      {children}
    </button>
  );
}
