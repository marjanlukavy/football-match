import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

interface Thumb {
  left: number;
  width: number;
}

/** Перемикач-«таблетка» як Month / Week / Day на референсі; біла «таблетка» плавно їде до обраного пункту. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | null>(null);

  // Міряємо активну кнопку; ResizeObserver ловить підвантаження шрифту й зміну ширини.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const active = container.querySelector<HTMLElement>('[aria-checked="true"]');
      setThumb(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('relative inline-flex rounded-full bg-black/[0.06] p-1 backdrop-blur', className)}
    >
      {thumb && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 rounded-full bg-white shadow-sm transition-[translate,width] duration-500 ease-spring"
          style={{ width: thumb.width, translate: `${thumb.left}px 0` }}
        />
      )}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-full font-medium transition-colors duration-300 disabled:opacity-40',
              size === 'md' ? 'px-5 py-1.5 text-sm' : 'px-3 py-1 text-xs',
              active ? 'text-ink' : 'text-ink/55 hover:text-ink',
              // Поки «таблетку» не виміряно (перший кадр) — фон на самій кнопці.
              active && !thumb && 'bg-white shadow-sm',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
