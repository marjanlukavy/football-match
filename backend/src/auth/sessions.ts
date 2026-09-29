import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, lt, ne } from 'drizzle-orm';
import type { Me } from '@futbol/shared/types';
import type { Db } from '../db/client';
import { players, sessions } from '../db/schema';

const DAY_MS = 24 * 60 * 60 * 1000;
export const SESSION_TTL_MS = 30 * DAY_MS;
/** Якщо до кінця сесії лишилось менше — продовжуємо її, щоб активні гравці не вилітали. */
const RENEW_BEFORE_MS = 15 * DAY_MS;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(db: Db, playerId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: hashToken(token), playerId, expiresAt });
  // Заодно прибираємо прострочені сесії — окремий крон для такого масштабу зайвий.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  return { token, expiresAt };
}

/** Повертає користувача сесії або null; `renewedUntil` — коли сесію продовжено й cookie треба оновити. */
export async function validateSession(
  db: Db,
  token: string,
): Promise<{ me: Me; renewedUntil: Date | null } | null> {
  const id = hashToken(token);
  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      me: { id: players.id, login: players.login, name: players.name, skill: players.skill, role: players.role },
    })
    .from(sessions)
    .innerJoin(players, eq(players.id, sessions.playerId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())));
  if (!row) return null;

  let renewedUntil: Date | null = null;
  if (row.expiresAt.getTime() - Date.now() < RENEW_BEFORE_MS) {
    renewedUntil = new Date(Date.now() + SESSION_TTL_MS);
    await db.update(sessions).set({ expiresAt: renewedUntil }).where(eq(sessions.id, id));
  }
  return { me: row.me, renewedUntil };
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

/** Після зміни пароля виходимо з усіх інших пристроїв. */
export async function deleteOtherSessions(db: Db, playerId: string, currentToken: string): Promise<void> {
  await db
    .delete(sessions)
    .where(and(eq(sessions.playerId, playerId), ne(sessions.id, hashToken(currentToken))));
}
