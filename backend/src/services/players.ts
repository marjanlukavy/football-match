import { eq } from 'drizzle-orm';
import { ApiError } from '@futbol/shared/errors';
import type { Player, PlayerId, PlayerPatch } from '@futbol/shared/types';
import type { Db } from '../db/client';
import { players } from '../db/schema';
import { requireAdmin } from './access';

/** Публічні поля гравця — без логіна й хеша пароля. */
export const publicPlayer = {
  id: players.id,
  name: players.name,
  skill: players.skill,
  role: players.role,
};

export async function listPlayers(db: Db): Promise<Player[]> {
  const rows = await db.select(publicPlayer).from(players);
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}

export async function updatePlayer(db: Db, me: Player, id: PlayerId, patch: PlayerPatch): Promise<Player> {
  requireAdmin(me);
  // Завдяки цьому в компанії завжди лишається хоча б один організатор.
  if (patch.role === 'player' && id === me.id) {
    throw new ApiError('VALIDATION', 'Не можна зняти права організатора із себе');
  }
  const [player] = await db.update(players).set(patch).where(eq(players.id, id)).returning(publicPlayer);
  if (!player) throw new ApiError('NOT_FOUND', 'Гравця не знайдено');
  return player;
}
