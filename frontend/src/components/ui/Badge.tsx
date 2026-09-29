import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'lavender' | 'pink' | 'lime' | 'mist' | 'success' | 'warn' | 'danger' | 'dark';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-black/5 text-ink/70',
  lavender: 'bg-lavender-soft text-accent-ink',
  pink: 'bg-pink text-pink-ink',
  lime: 'bg-lime/70 text-[#4d5a0f]',
  mist: 'bg-mist text-mist-ink',
  success: 'bg-success/12 text-success',
  warn: 'bg-warn/15 text-[#9a6a0c]',
  danger: 'bg-danger/10 text-danger',
  dark: 'bg-ink text-white',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
