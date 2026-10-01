import { useCallback, useMemo, useState } from 'react';
import { MAX_TEAMS, MIN_PLAYERS_PER_TEAM, MIN_TEAMS } from '@futbol/shared/constants';
import { getTeamPool } from '@futbol/shared/game';
import type { Game, Player, PlayerId, Team } from '@futbol/shared/types';
import { drawTeams, sortLineup } from './drawTeams';

function poolOf(game: Game, includeMaybe: boolean, playersById: ReadonlyMap<PlayerId, Player>): Player[] {
  return getTeamPool(game, includeMaybe)
    .map((id) => playersById.get(id))
    .filter((p): p is Player => Boolean(p));
}

/** Скільки команд можна зібрати з пулу (мінімум MIN_TEAMS для UI). */
function maxTeamsFor(poolSize: number): number {
  return Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, Math.floor(poolSize / MIN_PLAYERS_PER_TEAM)));
}

export function canDrawTeams(poolSize: number, teamCount: number): boolean {
  return poolSize >= teamCount * MIN_PLAYERS_PER_TEAM;
}

/**
 * Локальна чернетка поділу: організатор жеребкує, за потреби переставляє
 * гравців вручну і лише потім зберігає склади на сервер.
 */
export function useTeamsDraft(game: Game, playersById: ReadonlyMap<PlayerId, Player>) {
  const [draft, setDraft] = useState<Team[] | null>(null);
  const [teamCount, setTeamCountState] = useState(game.teams?.teams.length ?? game.teamCount);
  const [includeMaybe, setIncludeMaybeState] = useState(game.teams?.includeMaybe ?? false);
  /** Лічильник жеребкувань — ключ для анімації появи карток. */
  const [drawVersion, setDrawVersion] = useState(0);

  const pool = useMemo(() => poolOf(game, includeMaybe, playersById), [game, includeMaybe, playersById]);

  const redraw = useCallback(
    (count: number, maybe: boolean) => {
      const players = poolOf(game, maybe, playersById);
      if (!canDrawTeams(players.length, count)) {
        setDraft(null);
        return;
      }
      setDraft(drawTeams(players, count));
      setDrawVersion((v) => v + 1);
    },
    [game, playersById],
  );

  const draw = useCallback(() => redraw(teamCount, includeMaybe), [redraw, teamCount, includeMaybe]);

  const setTeamCount = (count: number) => {
    setTeamCountState(count);
    if (draft) redraw(count, includeMaybe);
  };

  /** Без «можливо» пул менший — зменшуємо кількість команд, якщо треба. */
  const setIncludeMaybe = (maybe: boolean) => {
    const count = Math.min(teamCount, maxTeamsFor(poolOf(game, maybe, playersById).length));
    setIncludeMaybeState(maybe);
    setTeamCountState(count);
    if (draft) redraw(count, maybe);
  };

  const movePlayer = (playerId: PlayerId, toTeamId: string) => {
    setDraft((teams) =>
      teams?.map((team) => {
        const without = team.playerIds.filter((id) => id !== playerId);
        const ids = team.id === toTeamId ? [...without, playerId] : without;
        // Місце на полі було в старій команді — у новій гравець починає із запасу.
        const { [playerId]: _moved, ...positions } = team.positions ?? {};
        return { ...team, playerIds: sortLineup(ids, playersById), positions };
      }) ?? null,
    );
  };

  const discard = () => setDraft(null);

  return {
    draft,
    drawVersion,
    teamCount,
    includeMaybe,
    pool,
    canDraw: canDrawTeams(pool.length, teamCount),
    playersNeeded: Math.max(0, teamCount * MIN_PLAYERS_PER_TEAM - pool.length),
    isCountAvailable: (count: number) => canDrawTeams(pool.length, count),
    draw,
    setTeamCount,
    setIncludeMaybe,
    movePlayer,
    discard,
  };
}

export type TeamsDraft = ReturnType<typeof useTeamsDraft>;
