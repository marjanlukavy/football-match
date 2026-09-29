import { randomBytes } from 'node:crypto';
import { count, desc, eq } from 'drizzle-orm';
import type { Invite, Player } from '@futbol/shared/types';
import type { Db, Tx } from '../db/client';
import { invites, players } from '../db/schema';
import { requireAdmin } from './access';

type Executor = Db | Tx;

const toInvite = (row: typeof invites.$inferSelect): Invite => ({
  code: row.code,
  createdAt: row.createdAt.toISOString(),
});

/** 128 біт випадковості — підібрати код перебором нереально. */
const newCode = () => randomBytes(16).toString('base64url');

export async function isValidInvite(db: Executor, code: string | undefined): Promise<boolean> {
  if (!code) return false;
  const [row] = await db.select({ code: invites.code }).from(invites).where(eq(invites.code, code));
  return Boolean(row);
}

export async function hasPlayers(db: Executor): Promise<boolean> {
  const [{ total }] = await db.select({ total: count() }).from(players);
  return total > 0;
}

/** На порожній базі реєстрація відкрита (так з'являється перший організатор), далі — лише за запрошенням. */
export async function isRegistrationOpen(db: Db, code: string | undefined): Promise<boolean> {
  return !(await hasPlayers(db)) || (await isValidInvite(db, code));
}

/** Поточне запрошення; якщо його ще немає — створюємо. */
export async function getInvite(db: Db, me: Player): Promise<Invite> {
  requireAdmin(me);
  const [current] = await db.select().from(invites).orderBy(desc(invites.createdAt)).limit(1);
  if (current) return toInvite(current);
  const [created] = await db.insert(invites).values({ code: newCode(), createdBy: me.id }).returning();
  return toInvite(created);
}

/** Нове посилання замість старого: старе одразу перестає працювати. */
export async function regenerateInvite(db: Db, me: Player): Promise<Invite> {
  requireAdmin(me);
  return db.transaction(async (tx) => {
    await tx.delete(invites);
    const [created] = await tx.insert(invites).values({ code: newCode(), createdBy: me.id }).returning();
    return toInvite(created);
  });
}
