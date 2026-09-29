import { cn } from '@/lib/cn';
import { EVENT_TONE_CLASSES, EVENT_TONE_LABELS, type EventTone } from './calendarUtils';

const TONES: EventTone[] = ['confirmed', 'maybe', 'open', 'finished'];

export function CalendarLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-ink/60', className)}>
      {TONES.map((tone) => (
        <li key={tone} className="flex items-center gap-2">
          <span className={cn('size-3.5 rounded-[5px] ring-1 ring-black/5', EVENT_TONE_CLASSES[tone])} />
          {EVENT_TONE_LABELS[tone]}
        </li>
      ))}
    </ul>
  );
}
