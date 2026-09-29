import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'accent' | 'soft' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/85',
  accent: 'bg-accent text-white hover:bg-accent-ink shadow-[0_6px_16px_-6px_rgb(123_108_246/0.7)]',
  soft: 'bg-white/70 text-ink ring-1 ring-black/5 hover:bg-white',
  ghost: 'text-ink/70 hover:bg-black/5 hover:text-ink',
  danger: 'bg-danger/10 text-danger hover:bg-danger/15',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
  icon: 'size-10',
  'icon-sm': 'size-8',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'soft',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap',
        'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
