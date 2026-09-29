import { SKILL_LABELS, SKILL_LEVELS } from '@futbol/shared/constants';
import type { Player } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { plural, PLAYER_FORMS } from '@/lib/plural';

/** Гістограма «скільки гравців на кожному рівні» — п'ять стовпчиків на CSS. */
export function SkillDistribution({ players }: { players: readonly Player[] }) {
  const counts = SKILL_LEVELS.map((level) => players.filter((p) => p.skill === level).length);
  const max = Math.max(1, ...counts);

  return (
    <figure className="flex h-full flex-col">
      <figcaption className="text-xs font-medium text-muted">Розподіл за рівнем</figcaption>
      <div className="mt-3 flex flex-1 items-end gap-2" role="list">
        {SKILL_LEVELS.map((level, i) => {
          const count = counts[i];
          return (
            <div
              key={level}
              role="listitem"
              title={`${SKILL_LABELS[level]}: ${count} ${plural(count, PLAYER_FORMS)}`}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span className="text-[11px] font-semibold text-ink tabular-nums">{count}</span>
              <div className="flex h-16 w-full items-end">
                <div
                  className={cn(
                    'w-full rounded-t-[4px] transition-colors',
                    count ? 'bg-accent group-hover:bg-accent-ink' : 'bg-black/10',
                  )}
                  // Порожній рівень — тонка сіра риска, щоб було видно, що стовпчик існує.
                  style={{ height: count ? `${(count / max) * 100}%` : 2 }}
                />
              </div>
              <span className="w-full truncate text-center text-[10px] text-muted">{SKILL_LABELS[level]}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
