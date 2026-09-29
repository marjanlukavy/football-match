import { useState, type ReactNode } from 'react';
import { Popover } from 'radix-ui';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ChoiceChips } from './ChoiceChips';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06–23
const MINUTES = [0, 15, 30, 45];
const OTHER = '__other';

const pad = (n: number) => String(n).padStart(2, '0');

interface TimePickerProps {
  /** «HH:mm» */
  value: string;
  onChange: (value: string) => void;
  /** Популярні варіанти, що видно одразу. */
  presets: readonly string[];
  ariaLabel: string;
  invalid?: boolean;
}

/**
 * Вибір часу: популярні слоти — одним натиском, будь-який інший —
 * у поповері з колонками годин і хвилин (без нативного input type=time).
 */
export function TimePicker({ value, onChange, presets, ariaLabel, invalid }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const isCustom = !presets.includes(value);
  const [hour, minute] = value.split(':').map(Number);

  const options = [
    ...presets.map((t) => ({ value: t, label: t })),
    {
      value: OTHER,
      label: (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {isCustom ? value : 'Інший'}
        </span>
      ),
    },
  ];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className={cn(invalid && 'rounded-2xl ring-2 ring-danger/60 ring-offset-2')}>
          <ChoiceChips
            ariaLabel={ariaLabel}
            value={isCustom ? OTHER : value}
            options={options}
            onChange={(v) => (v === OTHER ? setOpen(true) : onChange(v))}
            columns={4}
          />
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-[60] w-64 rounded-2xl bg-white p-3 shadow-pop ring-1 ring-black/5 data-[state=open]:animate-pop-in"
        >
          <p className="mb-2 px-1 text-xs font-semibold text-muted">Оберіть час</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Column label="Години">
              {HOURS.map((h) => (
                <Cell key={h} active={h === hour} onClick={() => onChange(`${pad(h)}:${pad(minute || 0)}`)}>
                  {pad(h)}
                </Cell>
              ))}
            </Column>
            <Column label="Хвилини" narrow>
              {MINUTES.map((m) => (
                <Cell key={m} active={m === minute} onClick={() => onChange(`${pad(hour || 20)}:${pad(m)}`)}>
                  :{pad(m)}
                </Cell>
              ))}
            </Column>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 h-10 w-full rounded-xl bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink/85"
          >
            Готово · {value}
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Column({ label, narrow, children }: { label: string; narrow?: boolean; children: ReactNode }) {
  return (
    <div
      role="listbox"
      aria-label={label}
      className={cn('scrollbar-thin grid max-h-48 gap-1 overflow-y-auto', narrow ? 'w-16' : 'grid-cols-3')}
    >
      {children}
    </div>
  );
}

function Cell({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'h-9 rounded-xl text-sm font-medium tabular-nums transition-colors',
        active ? 'bg-ink text-white' : 'bg-black/[0.04] text-ink hover:bg-black/[0.08]',
      )}
    >
      {children}
    </button>
  );
}
