// npm run db:migrate — застосовує нові міграції з папки drizzle/.
import { env } from '../env';
import { createDb } from './client';
import { runMigrations } from './migrations';

const { db, close } = createDb(env.DATABASE_URL);
await runMigrations(db);
await close();
console.log('Міграції застосовано');
