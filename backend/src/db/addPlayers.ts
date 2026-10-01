// npm run db:add-players — додає в компанію 15 гравців для розстановки.
// Нічого не стирає: тих, чий логін уже є, пропускає. Працює й на віддаленій базі.
import { randomUUID } from 'node:crypto';
import { SKILL_LEVELS } from '@futbol/shared/constants';
import { hashPassword } from '../auth/password';
import { env } from '../env';
import { createDb } from './client';
import { runMigrations } from './migrations';
import { players } from './schema';

/** Пароль усіх доданих гравців. */
const PASSWORD = 'futbol123';

const PLAYERS: [login: string, name: string][] = [
  ['artem', 'Артем Бойко'],
  ['vlad', 'Владислав Гончаренко'],
  ['denys', 'Денис Коваль'],
  ['ivan', 'Іван Сидоренко'],
  ['kyrylo', 'Кирило Мазур'],
  ['levko', 'Левко Остапенко'],
  ['marko', 'Марко Петренко'],
  ['mykhailo', 'Михайло Вовк'],
  ['oleksandr', 'Олександр Карпенко'],
  ['petro', 'Петро Юрченко'],
  ['ruslan', 'Руслан Демченко'],
  ['stepan', 'Степан Кузьменко'],
  ['tymur', 'Тимур Савенко'],
  ['fedir', 'Федір Лук’яненко'],
  ['yakiv', 'Яків Приходько'],
];

const { db, close } = createDb(env.DATABASE_URL);
await runMigrations(db);

const passwordHash = await hashPassword(PASSWORD);
const added = await db
  .insert(players)
  .values(
    PLAYERS.map(([login, name]) => ({
      id: randomUUID(),
      login,
      passwordHash,
      name,
      skill: SKILL_LEVELS[Math.floor(Math.random() * SKILL_LEVELS.length)],
      role: 'player' as const,
    })),
  )
  .onConflictDoNothing({ target: players.login })
  .returning({ name: players.name, skill: players.skill });
await close();

console.log(`Додано ${added.length} з ${PLAYERS.length} гравців (решта вже були).`);
for (const p of added) console.log(`  ${p.name} — рівень ${p.skill}`);
console.log(`Пароль усіх: ${PASSWORD}`);
