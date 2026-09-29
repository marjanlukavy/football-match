import { Shirt } from 'lucide-react';
import type { DutyKind } from '@futbol/shared/types';
import { cn } from '@/lib/cn';

function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m12 7.2 4.1 3-1.6 4.8h-5l-1.6-4.8Z" fill="currentColor" />
      <path d="M12 7.2V2.8M16.1 10.2l4.1-1.3M14.5 15l2.6 3.5M9.5 15l-2.6 3.5M7.9 10.2 3.8 8.9" />
    </svg>
  );
}

export function DutyIcon({ kind, className }: { kind: DutyKind; className?: string }) {
  return kind === 'ball' ? <BallIcon className={cn('size-4', className)} /> : <Shirt className={cn('size-4', className)} />;
}
