import { createDb } from '../src/db/client';
import { runMigrations } from '../src/db/migrations';

export default async function setup() {
  const { db, close } = createDb(process.env.DATABASE_URL!);
  await runMigrations(db);
  await close();
}
