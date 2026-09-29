import { z } from 'zod';
import {
  GAME_DURATION_MAX,
  GAME_DURATION_MIN,
  LOCATION_ADDRESS_MAX,
  LOCATION_NAME_MAX,
  LOGIN_MAX,
  LOGIN_MIN,
  MAX_PLAYERS_LIMIT,
  MAX_TEAMS,
  MIN_PLAYERS_PER_TEAM,
  MIN_TEAMS,
  NAME_MAX,
  NOTES_MAX_LENGTH,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from './constants';

/**
 * Схеми вхідних даних. Сервер ними валідує запити,
 * фронт — форми, тож правила й тексти помилок однакові.
 */

const skillSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const roleSchema = z.enum(['admin', 'player']);
const idSchema = z.string().min(1).max(64);

export const loginSchema = z.object({
  login: z
    .string()
    .trim()
    .toLowerCase()
    .min(LOGIN_MIN, `Логін — щонайменше ${LOGIN_MIN} символи`)
    .max(LOGIN_MAX, `Логін — не більше ${LOGIN_MAX} символів`)
    .regex(/^[a-z0-9._-]+$/, 'Лише латинські літери, цифри, крапка, _ і -'),
  password: z.string().min(1, 'Введіть пароль').max(PASSWORD_MAX),
});

const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `Пароль — щонайменше ${PASSWORD_MIN} символів`)
  .max(PASSWORD_MAX, `Пароль — не більше ${PASSWORD_MAX} символів`);

const nameSchema = z
  .string()
  .trim()
  .min(2, "Вкажіть ім'я")
  .max(NAME_MAX, `Не більше ${NAME_MAX} символів`);

const inviteCodeSchema = z.string().trim().max(64);

export const registerSchema = loginSchema.extend({
  name: nameSchema,
  password: newPasswordSchema,
  inviteCode: inviteCodeSchema.optional(),
});

export const registrationQuerySchema = z.object({ invite: inviteCodeSchema.optional() });

export const profilePatchSchema = z.object({ name: nameSchema });

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Введіть поточний пароль').max(PASSWORD_MAX),
  newPassword: newPasswordSchema,
});

export const playerPatchSchema = z
  .object({ skill: skillSchema, role: roleSchema })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, 'Немає змін');

export const gameInputSchema = z
  .object({
    startsAt: z.iso.datetime({ offset: true, message: 'Некоректний час початку' }),
    durationMin: z.number().int().min(GAME_DURATION_MIN).max(GAME_DURATION_MAX),
    location: z.object({
      name: z.string().trim().min(1, 'Вкажіть місце гри').max(LOCATION_NAME_MAX),
      address: z.string().trim().max(LOCATION_ADDRESS_MAX),
    }),
    maxPlayers: z.number().int().max(MAX_PLAYERS_LIMIT, `Не більше ${MAX_PLAYERS_LIMIT} гравців`),
    teamCount: z.number().int().min(MIN_TEAMS).max(MAX_TEAMS, `Кількість команд — від ${MIN_TEAMS} до ${MAX_TEAMS}`),
    notes: z.string().trim().max(NOTES_MAX_LENGTH),
  })
  .refine((input) => input.maxPlayers >= input.teamCount * MIN_PLAYERS_PER_TEAM, {
    path: ['maxPlayers'],
    message: 'Замало місць для такої кількості команд',
  });

export const gamesQuerySchema = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

export const attendanceSchema = z.object({ status: z.enum(['confirmed', 'maybe']) });

export const dutyKindSchema = z.enum(['ball', 'bibs']);
export const dutySchema = z.object({ playerId: idSchema.nullable() });

export const teamsDrawInputSchema = z.object({
  includeMaybe: z.boolean(),
  teams: z
    .array(
      z.object({
        id: z.string().min(1).max(32),
        name: z.string().trim().min(1).max(40),
        color: z.enum(['orange', 'blue', 'white', 'yellow']),
        playerIds: z.array(idSchema).max(MAX_PLAYERS_LIMIT),
      }),
    )
    .min(MIN_TEAMS)
    .max(MAX_TEAMS),
});
