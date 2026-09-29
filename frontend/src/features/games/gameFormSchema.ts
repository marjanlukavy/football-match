import { addDays, isSameDay } from 'date-fns';
import { z } from 'zod';
import {
  DEFAULT_GAME_DURATION_MIN,
  DEFAULT_MAX_PLAYERS,
  MAX_PLAYERS_LIMIT,
  MAX_TEAMS,
  MIN_PLAYERS_PER_TEAM,
  MIN_TEAMS,
  NOTES_MAX_LENGTH,
} from '@futbol/shared/constants';
import type { Game, GameInput } from '@futbol/shared/types';
import { fromDateTimeInputs, toDate, toDateInput, toTimeInput } from '@/lib/date';

export const DURATION_OPTIONS = [60, 90, 120, 150] as const;
/** Час, який обирають найчастіше, — видно одразу, без поповера. */
export const TIME_PRESETS = ['10:00', '18:00', '19:00', '19:30', '20:00', '21:00', '21:30'] as const;
export const TEAM_COUNT_OPTIONS = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => MIN_TEAMS + i);
export { MAX_PLAYERS_LIMIT, NOTES_MAX_LENGTH };
const DEFAULT_START_TIME = '20:00';

interface SchemaOptions {
  /** При редагуванні дозволяємо дату в минулому (виправити вже зіграну гру). */
  allowPast: boolean;
}

export function createGameFormSchema({ allowPast }: SchemaOptions) {
  return z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Оберіть дату'),
      time: z.string().regex(/^\d{2}:\d{2}$/, 'Оберіть час початку'),
      durationMin: z.number().int().min(30).max(240),
      locationName: z.string().trim().min(1, 'Оберіть або додайте місце').max(80, 'Не більше 80 символів'),
      locationAddress: z.string().trim().max(120, 'Не більше 120 символів'),
      maxPlayers: z.number().int().max(MAX_PLAYERS_LIMIT, `Не більше ${MAX_PLAYERS_LIMIT} гравців`),
      teamCount: z.number().int().min(MIN_TEAMS).max(MAX_TEAMS),
      notes: z.string().trim().max(NOTES_MAX_LENGTH, `Не більше ${NOTES_MAX_LENGTH} символів`),
    })
    .superRefine((values, ctx) => {
      const minPlayers = values.teamCount * MIN_PLAYERS_PER_TEAM;
      if (values.maxPlayers < minPlayers) {
        ctx.addIssue({
          code: 'custom',
          path: ['maxPlayers'],
          message: `Для ${values.teamCount} команд потрібно щонайменше ${minPlayers} гравців`,
        });
      }

      if (!allowPast) {
        const startsAt = parseFormDateTime(values.date, values.time);
        const now = new Date();
        if (startsAt && startsAt < now) {
          // Сьогоднішня дата — проблема в часі, інакше — у самій даті.
          ctx.addIssue({
            code: 'custom',
            path: [isSameDay(startsAt, now) ? 'time' : 'date'],
            message: 'Цей час уже минув',
          });
        }
      }
    });
}

export type GameFormValues = z.infer<ReturnType<typeof createGameFormSchema>>;

export function toFormValues(game?: Game, defaultDate?: Date): GameFormValues {
  if (game) {
    const start = toDate(game.startsAt);
    return {
      date: toDateInput(start),
      time: toTimeInput(start),
      durationMin: game.durationMin,
      locationName: game.location.name,
      locationAddress: game.location.address,
      maxPlayers: game.maxPlayers,
      teamCount: game.teamCount,
      notes: game.notes,
    };
  }

  // Клік по порожній годині в тижневій сітці передає конкретний час;
  // рівно опівніч — це клік по цілому дню, тоді ставимо звичні 20:00.
  const hasTime = defaultDate !== undefined && (defaultDate.getHours() !== 0 || defaultDate.getMinutes() !== 0);

  return {
    date: toDateInput(defaultDate ?? addDays(new Date(), 1)),
    time: hasTime ? toTimeInput(defaultDate) : DEFAULT_START_TIME,
    durationMin: DEFAULT_GAME_DURATION_MIN,
    locationName: '',
    locationAddress: '',
    maxPlayers: DEFAULT_MAX_PLAYERS,
    teamCount: MIN_TEAMS,
    notes: '',
  };
}

export function toGameInput(values: GameFormValues): GameInput {
  return {
    startsAt: fromDateTimeInputs(values.date, values.time),
    durationMin: values.durationMin,
    location: { name: values.locationName, address: values.locationAddress },
    maxPlayers: values.maxPlayers,
    teamCount: values.teamCount,
    notes: values.notes,
  };
}

/** «2026-09-24» → локальна північ цього дня. */
export function parseFormDate(date: string): Date {
  return new Date(`${date}T00:00`);
}

/** Дата + час з форми або null, якщо щось не заповнене. */
export function parseFormDateTime(date: string, time: string): Date | null {
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

/** «60» → «1 год», «90» → «1,5 год». */
export function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toLocaleString('uk-UA', { maximumFractionDigits: 2 })} год`;
}
