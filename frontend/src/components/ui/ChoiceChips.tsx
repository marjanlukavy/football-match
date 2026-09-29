import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Другий рядок дрібним шрифтом (напр. адреса місця). */
  hint?: ReactNode;
  disabled?: boolean;
}

interface ChoiceChipsProps<T extends string | number> {
  value: T | undefined;
  options: readonly ChoiceOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Колонок у сітці; без нього чипи просто переносяться рядками. */
  columns?: number;
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * Великі «таблетки» для вибору одного варіанта: тривалість, час, кількість команд.
 * Зручно натискати пальцем, усі варіанти видно одразу.
 */
export function ChoiceChips<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  columns,
  size = 'lg',
  className,
}: ChoiceChipsProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(columns ? 'grid gap-2' : 'flex flex-wrap gap-2', className)}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border px-4 text-center transition-all',
              'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
              size === 'lg' ? 'min-h-12 py-2.5 text-sm' : 'min-h-10 py-2 text-[13px]',
              active
                ? 'border-ink bg-ink font-semibold text-white'
                : 'border-line bg-white font-medium text-ink hover:border-black/20',
            )}
          >
            <span className="leading-tight">{option.label}</span>
            {option.hint && (
              <span className={cn('mt-0.5 text-[11px] leading-tight', active ? 'text-white/60' : 'text-muted')}>
                {option.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
