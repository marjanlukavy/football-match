import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Db = PostgresJsDatabase<typeof schema>;
/** Транзакція має той самий API запитів, що й база. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export function createDb(url: string) {
  const client = postgres(url, { max: 10, onnotice: () => {} });
  const db: Db = drizzle(client, { schema });
  return { db, close: () => client.end() };
}
