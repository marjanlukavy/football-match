import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { DEFAULT_SKILL } from '@futbol/shared/constants';
import { ApiError } from '@futbol/shared/errors';
import type { LoginInput, Me, PasswordChangeInput, ProfilePatch, RegisterInput } from '@futbol/shared/types';
import { DUMMY_HASH, hashPassword, verifyPassword } from '../auth/password';
import { assertLoginAllowed, recordLoginFailure, resetLoginFailures } from '../auth/rateLimit';
import type { Db } from '../db/client';
import { players } from '../db/schema';
import { hasPlayers, isValidInvite } from './invites';

const meColumns = {
  id: players.id,
  login: players.login,
  name: players.name,
  skill: players.skill,
  role: players.role,
};

/** Ключ advisory-блокування, яким реєстрації вишиковуються в чергу. */
const REGISTRATION_LOCK = 7_310_001;

/**
 * Реєстрація лише за чинним запрошенням. Виняток — найперший користувач:
 * на порожній базі він реєструється без коду й стає організатором.
 */
export async function register(db: Db, input: RegisterInput): Promise<Me> {
  const passwordHash = await hashPassword(input.password);
  return db.transaction(async (tx) => {
    // Інакше двоє, що реєструються одночасно на порожній базі, обидва стали б «першими».
    await tx.execute(sql`select pg_advisory_xact_lock(${REGISTRATION_LOCK})`);
    const isFirst = !(await hasPlayers(tx));
    if (!isFirst && !(await isValidInvite(tx, input.inviteCode))) {
      throw new ApiError('FORBIDDEN', 'Запрошення недійсне — попросіть в організатора нове посилання');
    }

    const [me] = await tx
      .insert(players)
      .values({
        id: randomUUID(),
        login: input.login,
        passwordHash,
        name: input.name,
        skill: DEFAULT_SKILL,
        role: isFirst ? 'admin' : 'player',
      })
      .onConflictDoNothing({ target: players.login })
      .returning(meColumns);
    if (!me) throw new ApiError('CONFLICT', 'Такий логін уже зайнятий');
    return me;
  });
}

export async function login(db: Db, input: LoginInput): Promise<Me> {
  assertLoginAllowed(input.login);
  const [row] = await db
    .select({ ...meColumns, passwordHash: players.passwordHash })
    .from(players)
    .where(eq(players.login, input.login));

  const valid = await verifyPassword(input.password, row?.passwordHash ?? DUMMY_HASH);
  if (!row || !valid) {
    recordLoginFailure(input.login);
    throw new ApiError('UNAUTHORIZED', 'Невірний логін або пароль');
  }
  resetLoginFailures(input.login);
  const { passwordHash: _hash, ...me } = row;
  return me;
}

export async function updateProfile(db: Db, me: Me, patch: ProfilePatch): Promise<Me> {
  const [updated] = await db.update(players).set(patch).where(eq(players.id, me.id)).returning(meColumns);
  return updated;
}

export async function changePassword(db: Db, me: Me, input: PasswordChangeInput): Promise<void> {
  const [row] = await db.select({ passwordHash: players.passwordHash }).from(players).where(eq(players.id, me.id));
  if (!row || !(await verifyPassword(input.currentPassword, row.passwordHash))) {
    throw new ApiError('VALIDATION', 'Поточний пароль невірний');
  }
  await db
    .update(players)
    .set({ passwordHash: await hashPassword(input.newPassword) })
    .where(eq(players.id, me.id));
}
