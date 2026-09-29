import { subDays } from 'date-fns';
import { describe, expect, it } from 'vitest';
import type { Game } from '@futbol/shared/types';
import { createGame, gameInput, setupCompany } from './helpers';

describe('ігри', () => {
  it('створювати гру може лише організатор', async () => {
    const { admin, players } = await setupCompany(1);
    expect((await players[0].request('POST', '/games', gameInput())).status).toBe(403);
    const game = await createGame(admin);
    expect(game.registrations).toEqual([]);
    expect(game.duties).toEqual({ ball: null, bibs: null });
  });

  it('список фільтрується за інтервалом [from, to)', async () => {
    const { admin } = await setupCompany(0);
    await createGame(admin, { startsAt: '2030-01-10T18:00:00.000Z' });
    await createGame(admin, { startsAt: '2030-01-20T18:00:00.000Z' });
    const { data } = await admin.request('GET', '/games?from=2030-01-01T00:00:00.000Z&to=2030-01-20T18:00:00.000Z');
    expect(data.map((g: Game) => g.startsAt)).toEqual(['2030-01-10T18:00:00.000Z']);
  });

  it('два гравці одночасно на останнє місце — підтверджено лише одного', async () => {
    const { admin, players } = await setupCompany(5);
    const game = await createGame(admin, { maxPlayers: 4 });
    for (const p of players.slice(0, 3)) await p.request('PUT', `/games/${game.id}/attendance`, { status: 'confirmed' });

    const results = await Promise.all(
      players.slice(3).map((p) => p.request('PUT', `/games/${game.id}/attendance`, { status: 'confirmed' })),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);

    const { data } = await admin.request('GET', `/games/${game.id}`);
    expect(data.registrations.filter((r: { status: string }) => r.status === 'confirmed')).toHaveLength(4);
  });

  it('обов’язки: лише для «точно буду», знімаються при відписці', async () => {
    const { admin, players } = await setupCompany(2);
    const [ivan, petro] = players;
    const game = await createGame(admin);
    const me = (await ivan.request('GET', '/me')).data;

    await ivan.request('PUT', `/games/${game.id}/attendance`, { status: 'maybe' });
    expect((await ivan.request('PUT', `/games/${game.id}/duties/ball`, { playerId: me.id })).status).toBe(422);

    await ivan.request('PUT', `/games/${game.id}/attendance`, { status: 'confirmed' });
    const took = await ivan.request('PUT', `/games/${game.id}/duties/ball`, { playerId: me.id });
    expect(took.data.duties.ball).toBe(me.id);

    // Інший гравець не може перехопити чи призначити когось.
    expect((await petro.request('PUT', `/games/${game.id}/duties/ball`, { playerId: me.id })).status).toBe(403);

    const left = await ivan.request('DELETE', `/games/${game.id}/attendance`);
    expect(left.data.duties.ball).toBeNull();
  });

  it('на гру, що вже минула, записатись не можна', async () => {
    const { admin, players } = await setupCompany(1);
    const game = await createGame(admin, { startsAt: subDays(new Date(), 1).toISOString() });
    const res = await players[0].request('PUT', `/games/${game.id}/attendance`, { status: 'confirmed' });
    expect(res.status).toBe(409);
  });

  it('склади: лише записані гравці, без повторів; зміна кількості команд скидає поділ', async () => {
    const { admin, players } = await setupCompany(4);
    const game = await createGame(admin);
    const ids: string[] = [];
    for (const p of players) {
      await p.request('PUT', `/games/${game.id}/attendance`, { status: 'confirmed' });
      ids.push((await p.request('GET', '/me')).data.id);
    }
    const team = (color: 'orange' | 'blue', playerIds: string[]) => ({ id: color, name: color, color, playerIds });

    const duplicate = await admin.request('PUT', `/games/${game.id}/teams`, {
      includeMaybe: false,
      teams: [team('orange', [ids[0], ids[1]]), team('blue', [ids[1], ids[2]])],
    });
    expect(duplicate.status).toBe(422);

    const saved = await admin.request('PUT', `/games/${game.id}/teams`, {
      includeMaybe: false,
      teams: [team('orange', ids.slice(0, 2)), team('blue', ids.slice(2))],
    });
    expect(saved.status).toBe(200);
    expect(saved.data.teams.createdBy).toBeTruthy();

    const updated = await admin.request('PUT', `/games/${game.id}`, gameInput({ teamCount: 3 }));
    expect(updated.data.teams).toBeNull();
  });

  it('ліміт місць не можна зменшити нижче вже підтверджених', async () => {
    const { admin, players } = await setupCompany(5);
    const game = await createGame(admin);
    for (const p of players) await p.request('PUT', `/games/${game.id}/attendance`, { status: 'confirmed' });
    const res = await admin.request('PUT', `/games/${game.id}`, gameInput({ maxPlayers: 4 }));
    expect(res.status).toBe(422);
  });
});

describe('гравці', () => {
  it('рівень змінює лише організатор; зняти права із себе не можна', async () => {
    const { admin, players } = await setupCompany(1);
    const me = (await admin.request('GET', '/me')).data;
    const player = (await players[0].request('GET', '/me')).data;

    expect((await players[0].request('PATCH', `/players/${player.id}`, { skill: 5 })).status).toBe(403);
    expect((await admin.request('PATCH', `/players/${player.id}`, { skill: 5 })).data.skill).toBe(5);
    expect((await admin.request('PATCH', `/players/${me.id}`, { role: 'player' })).status).toBe(422);

    const list = await players[0].request('GET', '/players');
    expect(list.data).toHaveLength(2);
    expect(list.data[0]).not.toHaveProperty('login');
  });
});
