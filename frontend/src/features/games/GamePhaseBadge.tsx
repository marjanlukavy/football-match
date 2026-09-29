import { Badge } from '@/components/ui/Badge';
import { getPhase, isToday } from '@futbol/shared/game';
import type { Game } from '@futbol/shared/types';

export function GamePhaseBadge({ game, className }: { game: Game; className?: string }) {
  const phase = getPhase(game);

  if (phase === 'live') {
    return (
      <Badge tone="pink" className={className}>
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
        Йде гра
      </Badge>
    );
  }
  if (phase === 'finished') {
    return (
      <Badge tone="neutral" className={className}>
        Завершено
      </Badge>
    );
  }
  return isToday(game) ? (
    <Badge tone="lime" className={className}>
      Сьогодні
    </Badge>
  ) : (
    <Badge tone="lavender" className={className}>
      Заплановано
    </Badge>
  );
}
