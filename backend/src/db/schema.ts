import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { AttendanceStatus, Role, SkillLevel, TeamsDraw } from '@futbol/shared/types';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const players = pgTable(
  'players',
  {
    id: text('id').primaryKey(),
    /** Завжди в нижньому регістрі. */
    login: text('login').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    skill: smallint('skill').$type<SkillLevel>().notNull(),
    role: text('role').$type<Role>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check('players_skill_range', sql`${t.skill} between 1 and 5`),
    check('players_role_valid', sql`${t.role} in ('admin', 'player')`),
  ],
);

/** У базі лежить лише SHA-256 від токена: витік таблиці не дає зайти під чужою сесією. */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_player_idx').on(t.playerId)],
);

export const games = pgTable(
  'games',
  {
    id: text('id').primaryKey(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    durationMin: integer('duration_min').notNull(),
    locationName: text('location_name').notNull(),
    locationAddress: text('location_address').notNull(),
    maxPlayers: integer('max_players').notNull(),
    teamCount: integer('team_count').notNull(),
    notes: text('notes').notNull(),
    ballPlayerId: text('ball_player_id').references(() => players.id, { onDelete: 'set null' }),
    bibsPlayerId: text('bibs_player_id').references(() => players.id, { onDelete: 'set null' }),
    /** Поділ завжди читається й пишеться цілком, тому окремі таблиці не потрібні. */
    teams: jsonb('teams').$type<TeamsDraw>(),
    createdAt: createdAt(),
  },
  (t) => [index('games_starts_at_idx').on(t.startsAt)],
);

export const registrations = pgTable(
  'registrations',
  {
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    status: text('status').$type<AttendanceStatus>().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.gameId, t.playerId] }),
    check('registrations_status_valid', sql`${t.status} in ('confirmed', 'maybe')`),
  ],
);

/**
 * Запрошення в компанію. Активне завжди одне: нове посилання замінює старе,
 * тож злите в чужі руки посилання організатор «вимикає» одним натиском.
 */
export const invites = pgTable('invites', {
  code: text('code').primaryKey(),
  createdBy: text('created_by')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
});
