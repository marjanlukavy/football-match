// npm run db:seed — демо-дані для розробки. Стирає все в базі!
import { addDays, addWeeks, setHours, setMinutes, startOfDay, startOfWeek, subMinutes } from 'date-fns';
import { randomUUID } from 'node:crypto';
import type { GameLocation, SkillLevel } from '@futbol/shared/types';
import { hashPassword } from '../auth/password';
import { env, isProduction } from '../env';
import { createDb } from './client';
import { runMigrations } from './migrations';
import { games, invites, players, registrations, sessions } from './schema';

// Сід стирає все, тож за замовчуванням працює лише з локальною базою.
const isLocalDb = ['localhost', '127.0.0.1'].includes(new URL(env.DATABASE_URL).hostname);
if (isProduction || (!isLocalDb && !process.argv.includes('--force-remote'))) {
  console.error('Сід стирає всі дані, тому запускається лише на локальній базі.');
  console.error('Свідомо залити демо-дані у віддалену базу: npm run db:seed -- --force-remote');
  process.exit(1);
}

/** Пароль усіх демо-гравців. */
const DEMO_PASSWORD = 'futbol123';

const PLAYERS: [login: string, name: string, skill: SkillLevel][] = [
  ['andrii', 'Андрій Коваленко', 4],
  ['bohdan', 'Богдан Шевчук', 3],
  ['vitalii', 'Віталій Бондар', 3],
  ['dmytro', 'Дмитро Ткаченко', 5],
  ['yevhen', 'Євген Мельник', 2],
  ['oleh', 'Олег Кравчук', 4],
  ['ihor', 'Ігор Савчук', 3],
  ['maksym', 'Максим Поліщук', 5],
  ['nazar', 'Назар Лисенко', 2],
  ['ostap', 'Остап Гнатюк', 4],
  ['roman', 'Роман Олійник', 4],
  ['serhii', 'Сергій Мороз', 3],
  ['taras', 'Тарас Литвин', 3],
  ['yurii', 'Юрій Павленко', 2],
  ['yaroslav', 'Ярослав Руденко', 4],
  ['kostiantyn', 'Костянтин Марченко', 1],
  ['mykola', 'Микола Зінченко', 3],
  ['pavlo', 'Павло Кушнір', 3],
];

const LOCATIONS: GameLocation[] = [
  { name: 'СК «Олімп»', address: 'вул. Спортивна, 12' },
  { name: 'Стадіон «Юність»', address: 'просп. Незалежності, 48' },
  { name: 'Манеж «Арена»', address: 'вул. Промислова, 3' },
];

/** Регулярний розклад компанії: день тижня (0 — понеділок), час, параметри. */
const SCHEDULE = [
  { weekday: 1, hour: 20, minute: 0, durationMin: 90, location: LOCATIONS[0], maxPlayers: 12, teamCount: 2, notes: 'Зал, взуття — тільки футзалки.' },
  { weekday: 3, hour: 19, minute: 30, durationMin: 90, location: LOCATIONS[2], maxPlayers: 14, teamCount: 2, notes: '' },
  { weekday: 5, hour: 10, minute: 0, durationMin: 120, location: LOCATIONS[1], maxPlayers: 18, teamCount: 3, notes: 'Граємо на три команди, на виліт.' },
];

const shuffle = <T>(items: readonly T[]) => [...items].sort(() => Math.random() - 0.5);

const { db, close } = createDb(env.DATABASE_URL);
await runMigrations(db);

const passwordHash = await hashPassword(DEMO_PASSWORD);
const playerRows = PLAYERS.map(([login, name, skill], i) => ({
  id: randomUUID(),
  login,
  passwordHash,
  name,
  skill,
  role: i === 0 ? ('admin' as const) : ('player' as const),
}));

const now = new Date();
const firstWeek = addWeeks(startOfWeek(now, { weekStartsOn: 1 }), -2);
const gameRows: (typeof games.$inferInsert)[] = [];
const registrationRows: (typeof registrations.$inferInsert)[] = [];

for (let week = 0; week < 7; week++) {
  for (const slot of SCHEDULE) {
    // Одна субота «вільна» — щоб календар виглядав живим, а не шаблонним.
    if (week === 4 && slot.weekday === 5) continue;
    const day = addDays(addWeeks(firstWeek, week), slot.weekday);
    const startsAt = setMinutes(setHours(startOfDay(day), slot.hour), slot.minute);
    const id = randomUUID();

    // Чим ближча гра, тим більше людей уже записались.
    const daysAhead = (startsAt.getTime() - now.getTime()) / 86_400_000;
    const fill = daysAhead < 0 ? 0.9 : daysAhead < 7 ? 0.75 : daysAhead < 14 ? 0.45 : 0.15;
    const target = Math.round(slot.maxPlayers * fill + Math.random() * 3);
    let confirmed = 0;
    const confirmedIds: string[] = [];
    shuffle(playerRows)
      .slice(0, target)
      .forEach((p, i) => {
        const isConfirmed = Math.random() > 0.22 && confirmed < slot.maxPlayers;
        if (isConfirmed) {
          confirmed++;
          confirmedIds.push(p.id);
        }
        registrationRows.push({
          gameId: id,
          playerId: p.id,
          status: isConfirmed ? 'confirmed' : 'maybe',
          updatedAt: subMinutes(startsAt, 60 * 24 * 4 - i * 37),
        });
      });

    const pick = () => confirmedIds[Math.floor(Math.random() * confirmedIds.length)] ?? null;
    gameRows.push({
      id,
      startsAt,
      durationMin: slot.durationMin,
      locationName: slot.location.name,
      locationAddress: slot.location.address,
      maxPlayers: slot.maxPlayers,
      teamCount: slot.teamCount,
      notes: slot.notes,
      ballPlayerId: Math.random() > 0.25 ? pick() : null,
      bibsPlayerId: Math.random() > 0.4 ? pick() : null,
    });
  }
}

/** Стале демо-запрошення, щоб посилання на реєстрацію не мінялось після кожного сіду. */
const DEMO_INVITE = 'demo-invite';

await db.transaction(async (tx) => {
  await tx.delete(invites);
  await tx.delete(registrations);
  await tx.delete(games);
  await tx.delete(sessions);
  await tx.delete(players);
  await tx.insert(players).values(playerRows);
  await tx.insert(games).values(gameRows);
  await tx.insert(registrations).values(registrationRows);
  await tx.insert(invites).values({ code: DEMO_INVITE, createdBy: playerRows[0].id });
});
await close();

console.log(`Готово: ${playerRows.length} гравців, ${gameRows.length} ігор.`);
console.log(`Вхід: логін andrii (організатор) або будь-який інший, пароль ${DEMO_PASSWORD}`);
console.log(`Реєстрація: http://localhost:5173/register?invite=${DEMO_INVITE}`);
