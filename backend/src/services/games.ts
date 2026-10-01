import { randomUUID } from 'node:crypto';
import { and, asc, eq, gte, inArray, lt, type SQL } from 'drizzle-orm';
import { ApiError } from '@futbol/shared/errors';
import { confirmedCount, getRegistration, isFull, isRegistrationOpen } from '@futbol/shared/game';
import type {
  AttendanceStatus,
  DutyKind,
  Game,
  GameId,
  GameInput,
  Player,
  PlayerId,
  TeamsDrawInput,
} from '@futbol/shared/types';
import type { Db, Tx } from '../db/client';
import { games, players, registrations } from '../db/schema';
import { requireAdmin } from './access';

type Executor = Db | Tx;
type GameRow = typeof games.$inferSelect;
type RegistrationRow = typeof registrations.$inferSelect;

export interface GamesQuery {
  from?: string;
  to?: string;
}

function toGame(row: GameRow, regs: RegistrationRow[]): Game {
  return {
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    durationMin: row.durationMin,
    location: { name: row.locationName, address: row.locationAddress },
    maxPlayers: row.maxPlayers,
    teamCount: row.teamCount,
    notes: row.notes,
    registrations: regs.map((r) => ({ playerId: r.playerId, status: r.status, updatedAt: r.updatedAt.toISOString() })),
    duties: { ball: row.ballPlayerId, bibs: row.bibsPlayerId },
    teams: row.teams,
  };
}

function inputColumns(input: GameInput) {
  return {
    startsAt: new Date(input.startsAt),
    durationMin: input.durationMin,
    locationName: input.location.name,
    locationAddress: input.location.address,
    maxPlayers: input.maxPlayers,
    teamCount: input.teamCount,
    notes: input.notes,
  };
}

async function withRegistrations(db: Executor, rows: GameRow[]): Promise<Game[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const regs = await db
    .select()
    .from(registrations)
    .where(inArray(registrations.gameId, ids))
    .orderBy(asc(registrations.updatedAt));
  return rows.map((row) => toGame(row, regs.filter((r) => r.gameId === row.id)));
}

async function loadGame(db: Executor, id: GameId, lock = false): Promise<Game> {
  const query = db.select().from(games).where(eq(games.id, id));
  const [row] = lock ? await query.for('update') : await query;
  if (!row) throw new ApiError('NOT_FOUND', 'Гру не знайдено');
  const [game] = await withRegistrations(db, [row]);
  return game;
}

/**
 * Зміна гри в транзакції з блокуванням її рядка: паралельні запити до однієї гри
 * виконуються по черзі, тож двоє не займуть останнє місце чи той самий м'яч.
 */
function mutateGame(db: Db, id: GameId, fn: (tx: Tx, game: Game) => Promise<void>): Promise<Game> {
  return db.transaction(async (tx) => {
    await fn(tx, await loadGame(tx, id, true));
    return loadGame(tx, id);
  });
}

function requireOpen(game: Game) {
  if (!isRegistrationOpen(game)) throw new ApiError('CONFLICT', 'Гра вже почалась або завершилась');
}

/** Гравець, що відписався чи став «можливо», більше не відповідає за м'яч/манішки. */
async function releaseDuties(tx: Tx, game: Game, playerId: PlayerId) {
  if (game.duties.ball === playerId) await tx.update(games).set({ ballPlayerId: null }).where(eq(games.id, game.id));
  if (game.duties.bibs === playerId) await tx.update(games).set({ bibsPlayerId: null }).where(eq(games.id, game.id));
}

export async function listGames(db: Db, query: GamesQuery = {}): Promise<Game[]> {
  const filters: SQL[] = [];
  if (query.from) filters.push(gte(games.startsAt, new Date(query.from)));
  if (query.to) filters.push(lt(games.startsAt, new Date(query.to)));
  const rows = await db
    .select()
    .from(games)
    .where(and(...filters))
    .orderBy(asc(games.startsAt));
  return withRegistrations(db, rows);
}

export function getGame(db: Db, id: GameId): Promise<Game> {
  return loadGame(db, id);
}

export async function createGame(db: Db, me: Player, input: GameInput): Promise<Game> {
  requireAdmin(me);
  const id = randomUUID();
  await db.insert(games).values({ id, ...inputColumns(input) });
  return loadGame(db, id);
}

export function updateGame(db: Db, me: Player, id: GameId, input: GameInput): Promise<Game> {
  requireAdmin(me);
  return mutateGame(db, id, async (tx, game) => {
    const confirmed = confirmedCount(game);
    if (input.maxPlayers < confirmed) {
      throw new ApiError('VALIDATION', `Уже підтвердили ${confirmed} — ліміт не може бути меншим`);
    }
    await tx
      .update(games)
      .set({
        ...inputColumns(input),
        // Інша кількість команд робить старий поділ неактуальним.
        ...(input.teamCount !== game.teamCount && { teams: null }),
      })
      .where(eq(games.id, id));
  });
}

export async function deleteGame(db: Db, me: Player, id: GameId): Promise<void> {
  requireAdmin(me);
  const deleted = await db.delete(games).where(eq(games.id, id)).returning({ id: games.id });
  if (deleted.length === 0) throw new ApiError('NOT_FOUND', 'Гру не знайдено');
}

export function setAttendance(db: Db, me: Player, gameId: GameId, status: AttendanceStatus): Promise<Game> {
  return mutateGame(db, gameId, async (tx, game) => {
    requireOpen(game);
    const existing = getRegistration(game, me.id);
    if (status === 'confirmed' && existing?.status !== 'confirmed' && isFull(game)) {
      throw new ApiError('CONFLICT', 'Усі місця зайняті — можна записатись як «можливо»');
    }

    const updatedAt = new Date();
    await tx
      .insert(registrations)
      .values({ gameId, playerId: me.id, status, updatedAt })
      .onConflictDoUpdate({ target: [registrations.gameId, registrations.playerId], set: { status, updatedAt } });
    // Відповідальним за інвентар може бути лише той, хто точно прийде.
    if (status === 'maybe') await releaseDuties(tx, game, me.id);
  });
}

export function cancelAttendance(db: Db, me: Player, gameId: GameId): Promise<Game> {
  return mutateGame(db, gameId, async (tx, game) => {
    requireOpen(game);
    await tx
      .delete(registrations)
      .where(and(eq(registrations.gameId, gameId), eq(registrations.playerId, me.id)));
    await releaseDuties(tx, game, me.id);
  });
}

const DUTY_COLUMN = { ball: 'ballPlayerId', bibs: 'bibsPlayerId' } as const;

export function setDuty(db: Db, me: Player, gameId: GameId, kind: DutyKind, playerId: PlayerId | null): Promise<Game> {
  return mutateGame(db, gameId, async (tx, game) => {
    requireOpen(game);
    const current = game.duties[kind];
    const isAdmin = me.role === 'admin';

    if (playerId === null) {
      if (!isAdmin && current !== me.id) throw new ApiError('FORBIDDEN', 'Звільнити може лише відповідальний');
    } else {
      if (!isAdmin && playerId !== me.id) throw new ApiError('FORBIDDEN', 'Призначати інших може лише організатор');
      if (!isAdmin && current && current !== me.id) throw new ApiError('CONFLICT', 'Хтось уже взяв це на себе');
      if (getRegistration(game, playerId)?.status !== 'confirmed') {
        throw new ApiError('VALIDATION', 'Відповідальним може бути лише той, хто точно прийде');
      }
    }
    await tx
      .update(games)
      .set({ [DUTY_COLUMN[kind]]: playerId })
      .where(eq(games.id, gameId));
  });
}

/**
 * Зберігає склади. Організатор може поставити в команду й того, хто не записувався:
 * такого гравця записуємо як «точно буду», якщо вистачає місць.
 */
export function saveTeams(db: Db, me: Player, gameId: GameId, draw: TeamsDrawInput): Promise<Game> {
  requireAdmin(me);
  return mutateGame(db, gameId, async (tx, game) => {
    const ids = draw.teams.flatMap((t) => t.playerIds);
    if (new Set(ids).size !== ids.length) throw new ApiError('VALIDATION', 'Гравець не може бути у двох командах');
    for (const team of draw.teams) {
      const members = new Set(team.playerIds);
      if (Object.keys(team.positions ?? {}).some((id) => !members.has(id))) {
        throw new ApiError('VALIDATION', 'На полі стоїть гравець не зі своєї команди');
      }
    }

    const newcomers = ids.filter((id) => !getRegistration(game, id));
    if (newcomers.length > 0) {
      const known = await tx.select({ id: players.id }).from(players).where(inArray(players.id, newcomers));
      if (known.length !== newcomers.length) throw new ApiError('VALIDATION', 'У командах є невідомі гравці');
      const confirmed = confirmedCount(game) + newcomers.length;
      if (confirmed > game.maxPlayers) {
        throw new ApiError(
          'CONFLICT',
          `Бракує місць: у командах ${confirmed}, а ліміт гри — ${game.maxPlayers}. Збільште кількість учасників`,
        );
      }
      const updatedAt = new Date();
      await tx
        .insert(registrations)
        .values(newcomers.map((playerId) => ({ gameId, playerId, status: 'confirmed' as const, updatedAt })));
    }

    await tx
      .update(games)
      .set({ teams: { ...draw, createdAt: new Date().toISOString(), createdBy: me.id } })
      .where(eq(games.id, gameId));
  });
}

export function clearTeams(db: Db, me: Player, gameId: GameId): Promise<Game> {
  requireAdmin(me);
  return mutateGame(db, gameId, async (tx) => {
    await tx.update(games).set({ teams: null }).where(eq(games.id, gameId));
  });
}
