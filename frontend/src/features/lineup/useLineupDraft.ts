import { useState } from 'react';
import { MIN_PLAYERS_PER_TEAM, TEAM_PRESETS } from '@futbol/shared/constants';
import { getRegistration } from '@futbol/shared/game';
import type { Game, PitchPoint, Player, PlayerId, Team, TeamsDrawInput } from '@futbol/shared/types';
import { drawTeams, sortLineup } from '@/features/teams/drawTeams';
import { autoPositions } from './formation';

function emptyTeams(count: number): Team[] {
  return TEAM_PRESETS.slice(0, count).map((p) => ({
    id: p.color,
    name: p.name,
    color: p.color,
    playerIds: [],
    positions: {},
  }));
}

function initialTeams(game: Game): Team[] {
  return game.teams?.teams.map((t) => ({ ...t, positions: t.positions ?? {} })) ?? emptyTeams(game.teamCount);
}

/** Прибирає гравця з усіх команд разом із його місцем на полі. */
function without(teams: readonly Team[], playerId: PlayerId): Team[] {
  return teams.map((team) => {
    if (!team.playerIds.includes(playerId)) return team;
    const { [playerId]: _removed, ...positions } = team.positions ?? {};
    return { ...team, playerIds: team.playerIds.filter((id) => id !== playerId), positions };
  });
}

export function teamOf(teams: readonly Team[], playerId: PlayerId): Team | undefined {
  return teams.find((t) => t.playerIds.includes(playerId));
}

/**
 * Чернетка розстановки на сторінці «Розстановка»: організатор переносить гравців
 * між командами й по полю, а на сервер усе йде одним «Зберегти».
 * Компонент з цим хуком монтується з key={game.id}, тож зміна гри починає нову чернетку.
 */
export function useLineupDraft(game: Game, playersById: ReadonlyMap<PlayerId, Player>) {
  const [teams, setTeams] = useState<Team[]>(() => initialTeams(game));
  const [dirty, setDirty] = useState(false);

  const update = (fn: (teams: Team[]) => Team[]) => {
    setTeams(fn);
    setDirty(true);
  };

  /** В команду (у запас) або назад у список гравців, якщо teamId = null. */
  const assign = (playerId: PlayerId, teamId: string | null) =>
    update((current) => {
      if (teamOf(current, playerId)?.id === teamId) return current;
      const rest = without(current, playerId);
      if (teamId === null) return rest;
      return rest.map((t) =>
        t.id === teamId ? { ...t, playerIds: sortLineup([...t.playerIds, playerId], playersById) } : t,
      );
    });

  /** Поставити на поле: за потреби гравець переходить у цю команду. */
  const place = (playerId: PlayerId, teamId: string, point: PitchPoint) =>
    update((current) => {
      const base = teamOf(current, playerId)?.id === teamId ? current : without(current, playerId);
      return base.map((t) => {
        if (t.id !== teamId) return t;
        const playerIds = t.playerIds.includes(playerId)
          ? t.playerIds
          : sortLineup([...t.playerIds, playerId], playersById);
        return { ...t, playerIds, positions: { ...t.positions, [playerId]: point } };
      });
    });

  /** З поля в запас своєї команди. */
  const bench = (playerId: PlayerId) =>
    update((current) =>
      current.map((t) => {
        if (!t.positions?.[playerId]) return t;
        const { [playerId]: _benched, ...positions } = t.positions;
        return { ...t, positions };
      }),
    );

  /** Розставити всю команду за типовою схемою; shuffleSpots — у випадковому порядку. */
  const arrange = (teamId: string, shuffleSpots = false) =>
    update((current) =>
      current.map((t) =>
        t.id === teamId ? { ...t, positions: autoPositions(t.playerIds, shuffleSpots ? Math.random : undefined) } : t,
      ),
    );

  /**
   * Випадковий, але рівний за силою поділ: беремо тих, хто вже в командах,
   * і всіх, хто записався «точно буду». Кожна команда одразу стає на поле.
   */
  const shuffleAll = (): boolean => {
    const ids = new Set(teams.flatMap((t) => t.playerIds));
    for (const r of game.registrations) if (r.status === 'confirmed') ids.add(r.playerId);
    const pool = [...ids].map((id) => playersById.get(id)).filter((p): p is Player => Boolean(p));
    if (pool.length < teams.length * MIN_PLAYERS_PER_TEAM) return false;

    const drawn = drawTeams(pool, teams.length);
    update(() =>
      teams.map((t, i) => ({ ...t, playerIds: drawn[i].playerIds, positions: autoPositions(drawn[i].playerIds) })),
    );
    return true;
  };

  const clear = () => update((current) => current.map((t) => ({ ...t, playerIds: [], positions: {} })));

  const reset = () => {
    setTeams(initialTeams(game));
    setDirty(false);
  };

  const assigned = teams.reduce((sum, t) => sum + t.playerIds.length, 0);

  const toInput = (): TeamsDrawInput => ({
    teams,
    includeMaybe: teams.some((t) => t.playerIds.some((id) => getRegistration(game, id)?.status === 'maybe')),
  });

  return {
    teams,
    dirty,
    assigned,
    assign,
    place,
    bench,
    arrange,
    shuffleAll,
    clear,
    reset,
    markSaved: () => setDirty(false),
    toInput,
  };
}

export type LineupDraft = ReturnType<typeof useLineupDraft>;
