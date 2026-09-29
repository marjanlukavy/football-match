import { useId, type ReactNode } from 'react';
import { Switch as RadixSwitch } from 'radix-ui';
import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Перемикач «увімк./вимк.» з підписом (Radix Switch). */
export function Switch({ checked, onCheckedChange, label, disabled, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative h-6 w-10 shrink-0 cursor-pointer rounded-full bg-black/15 transition-colors outline-none',
          'data-[state=checked]:bg-accent focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
      </RadixSwitch.Root>
      <label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink/80 select-none">
        {label}
      </label>
    </div>
  );
}
