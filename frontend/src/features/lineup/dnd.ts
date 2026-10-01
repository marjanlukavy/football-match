import type { PlayerId } from '@futbol/shared/types';

/** Звідки тягнуть гравця: зі списку, з картки команди чи з поля. */
export type DragSource = 'pool' | 'team' | 'pitch';

export interface DragData {
  playerId: PlayerId;
  from: DragSource;
}

/** Один гравець може бути водночас і в картці команди, і на полі — id різні. */
export const dragId = (from: DragSource, playerId: PlayerId) => `${from}:${playerId}`;

/** Куди кидають: список гравців, картка команди або поле. */
export const POOL_DROP = 'drop:pool';
export const PITCH_DROP = 'drop:pitch';
export const teamDropId = (teamId: string) => `drop:team:${teamId}`;
export const TEAM_DROP_PREFIX = 'drop:team:';
