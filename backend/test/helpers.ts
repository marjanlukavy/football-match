import { addDays } from 'date-fns';
import { afterAll, beforeEach } from 'vitest';
import type { Game, GameInput, Me } from '@futbol/shared/types';
import { createApp } from '../src/app';
import { createDb } from '../src/db/client';

const { db, close } = createDb(process.env.DATABASE_URL!);
export const app = createApp({ db, secureCookies: false });
export { db };

beforeEach(async () => {
  await db.execute('truncate players, sessions, games, registrations, invites cascade');
});
afterAll(() => close());

/** Мінімальний «браузер»: пам'ятає cookie сесії між запитами. */
export class Client {
  cookie = '';

  async request(method: string, path: string, body?: unknown) {
    const res = await app.request(`/api${path}`, {
      method,
      headers: {
        // Браузер додає Origin до змінних запитів; без нього CSRF-захист їх відхиляє.
        origin: 'http://localhost',
        ...(body !== undefined && { 'content-type': 'application/json' }),
        ...(this.cookie && { cookie: this.cookie }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';')[0];
    const text = await res.text();
    return { status: res.status, data: text ? JSON.parse(text) : null };
  }

  async register(login: string, inviteCode?: string, name = `Гравець ${login}`, password = 'password123'): Promise<Me> {
    const { status, data } = await this.request('POST', '/auth/register', { login, name, password, inviteCode });
    if (status !== 201) throw new Error(`Реєстрація ${login}: ${status} ${JSON.stringify(data)}`);
    return data;
  }

  /** Код поточного запрошення (лише для організатора). */
  async invite(): Promise<string> {
    const { status, data } = await this.request('GET', '/invite');
    if (status !== 200) throw new Error(`Запрошення: ${status} ${JSON.stringify(data)}`);
    return data.code;
  }
}

export function gameInput(patch: Partial<GameInput> = {}): GameInput {
  return {
    startsAt: addDays(new Date(), 2).toISOString(),
    durationMin: 90,
    location: { name: 'СК «Олімп»', address: 'вул. Спортивна, 12' },
    maxPlayers: 12,
    teamCount: 2,
    notes: '',
    ...patch,
  };
}

/** Організатор (перший зареєстрований) і кілька гравців. */
export async function setupCompany(playerCount: number) {
  const admin = new Client();
  await admin.register('admin');
  const invite = await admin.invite();
  const players: Client[] = [];
  for (let i = 0; i < playerCount; i++) {
    const client = new Client();
    await client.register(`player${i}`, invite);
    players.push(client);
  }
  return { admin, players };
}

export async function createGame(admin: Client, patch: Partial<GameInput> = {}): Promise<Game> {
  const { status, data } = await admin.request('POST', '/games', gameInput(patch));
  if (status !== 201) throw new Error(`Створення гри: ${status} ${JSON.stringify(data)}`);
  return data;
}
