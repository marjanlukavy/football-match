import { useMemo } from 'react';
import { useGames } from '@/api/hooks';
import { getPhase } from '@futbol/shared/game';
import type { PlayerId } from '@futbol/shared/types';

/** Скільки завершених ігор кожен гравець відіграв зі статусом «точно буду». */
export function useGamesPlayed(): ReadonlyMap<PlayerId, number> {
  const { data: games } = useGames();
  return useMemo(() => {
    const counts = new Map<PlayerId, number>();
    const now = new Date();
    for (const game of games ?? []) {
      if (getPhase(game, now) !== 'finished') continue;
      for (const r of game.registrations) {
        if (r.status === 'confirmed') counts.set(r.playerId, (counts.get(r.playerId) ?? 0) + 1);
      }
    }
    return counts;
  }, [games]);
}
