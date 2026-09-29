import { cn } from '@/lib/cn';

interface LogoProps {
  /** Щоразу, як значення змінюється, м'яч прокручується (і на першій появі теж). */
  rollKey?: string;
}

/** Логотип для темного фону: м'яч на лаймовій плитці й назва. */
export function Logo({ rollKey }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-lime text-ink">
        <svg
          key={rollKey}
          viewBox="0 0 24 24"
          className={cn('size-6', rollKey !== undefined && 'animate-roll')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9.5" />
          <path d="m12 7.2 4.1 3-1.6 4.8h-5l-1.6-4.8Z" fill="currentColor" />
          <path d="M12 7.2V2.8M16.1 10.2l4.1-1.3M14.5 15l2.6 3.5M9.5 15l-2.6 3.5M7.9 10.2 3.8 8.9" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-tight text-white">Футбол</span>
        <span className="block text-xs text-rail-text">з друзями</span>
      </span>
    </div>
  );
}
