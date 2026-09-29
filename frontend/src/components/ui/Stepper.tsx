import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  ariaLabel: string;
  /** Підпис після числа, напр. «гравців». */
  suffix?: string;
  invalid?: boolean;
  className?: string;
}

/** Число з кнопками − / +: зручніше за поле вводу, особливо на телефоні. */
export function Stepper({ value, onChange, min, max, step = 1, ariaLabel, suffix, invalid, className }: StepperProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-12 items-center gap-1 rounded-2xl border bg-white p-1',
        invalid ? 'border-danger' : 'border-line',
        className,
      )}
    >
      <StepButton label="Менше" disabled={value <= min} onClick={() => set(value - step)}>
        <Minus className="size-4" />
      </StepButton>
      <output aria-live="polite" className="min-w-16 flex-1 text-center text-base font-semibold text-ink tabular-nums">
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-muted">{suffix}</span>}
      </output>
      <StepButton label="Більше" disabled={value >= max} onClick={() => set(value + step)}>
        <Plus className="size-4" />
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/[0.04] text-ink transition-colors hover:bg-black/[0.08] active:scale-95 disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}
