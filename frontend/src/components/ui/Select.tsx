import type { ReactNode } from 'react';
import { Select as RadixSelect } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption<T extends string = string> {
  value: T;
  label: ReactNode;
  /** Текст у кнопці, якщо label надто багатий (іконки, аватарки). */
  triggerLabel?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  value: T | undefined;
  onValueChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  ariaLabel: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

/**
 * Випадний список на Radix Select: клавіатура, фокус і позиціонування —
 * з бібліотеки, вигляд — наш. Radix не приймає порожній рядок як value,
 * тож для «нічого не вибрано» використовуйте окреме значення (напр. 'none').
 */
export function Select<T extends string>({
  value,
  onValueChange,
  options,
  placeholder = 'Оберіть…',
  ariaLabel,
  size = 'md',
  disabled,
  className,
}: SelectProps<T>) {
  const selected = options.find((o) => o.value === value);

  return (
    <RadixSelect.Root value={value} onValueChange={(v) => onValueChange(v as T)} disabled={disabled}>
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex min-w-0 items-center justify-between gap-2 rounded-full bg-white font-semibold text-ink ring-1 ring-black/[0.08]',
          'transition-colors outline-none hover:ring-black/15 focus-visible:ring-accent data-[placeholder]:text-subtle',
          'disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <RadixSelect.Value placeholder={placeholder}>
            {selected && (
              <span className="flex min-w-0 items-center gap-2">
                {selected.icon}
                <span className="truncate">{selected.triggerLabel ?? selected.label}</span>
              </span>
            )}
          </RadixSelect.Value>
        </span>
        <RadixSelect.Icon>
          <ChevronDown className="size-4 shrink-0 text-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'z-[60] max-h-[min(320px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)]',
            'overflow-hidden rounded-2xl bg-white p-1 shadow-pop ring-1 ring-black/5 data-[state=open]:animate-pop-in',
          )}
        >
          <RadixSelect.Viewport className="scrollbar-thin">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  'relative flex cursor-pointer items-center gap-2 rounded-xl py-2 pr-9 pl-3 text-sm text-ink outline-none select-none',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-lavender-soft',
                  'data-[state=checked]:font-semibold',
                )}
              >
                {option.icon}
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-3">
                  <Check className="size-4 text-accent" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
