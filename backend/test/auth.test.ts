import { describe, expect, it } from 'vitest';
import { app, Client } from './helpers';

describe('авторизація', () => {
  it('перший зареєстрований — організатор, наступні — гравці', async () => {
    const admin = new Client();
    const first = await admin.register('first');
    const second = await new Client().register('second', await admin.invite());
    expect(first.role).toBe('admin');
    expect(second.role).toBe('player');
    expect(second.skill).toBe(3);
  });

  it('гість отримує null на /me і 401 на дані', async () => {
    const guest = new Client();
    expect((await guest.request('GET', '/me')).data).toBeNull();
    expect((await guest.request('GET', '/games')).status).toBe(401);
  });

  it('логін не залежить від регістру й пробілів, зайнятий логін — конфлікт', async () => {
    const taras = new Client();
    await taras.register('Taras');
    const again = await new Client().request('POST', '/auth/register', {
      login: ' taras ',
      name: 'Інший Тарас',
      password: 'password123',
      inviteCode: await taras.invite(),
    });
    expect(again.status).toBe(409);

    const client = new Client();
    const { status, data } = await client.request('POST', '/auth/login', { login: 'TARAS', password: 'password123' });
    expect(status).toBe(200);
    expect(data.login).toBe('taras');
  });

  it('невірний пароль — 401, вихід знищує сесію', async () => {
    const client = new Client();
    await client.register('ostap');
    expect((await new Client().request('POST', '/auth/login', { login: 'ostap', password: 'wrong' })).status).toBe(401);

    const session = client.cookie;
    expect((await client.request('POST', '/auth/logout')).status).toBe(204);
    const stolen = new Client();
    stolen.cookie = session;
    expect((await stolen.request('GET', '/me')).data).toBeNull();
  });

  it('валідація реєстрації: короткий пароль і кирилиця в логіні', async () => {
    const shortPassword = await new Client().request('POST', '/auth/register', {
      login: 'nazar',
      name: 'Назар',
      password: '123',
    });
    expect(shortPassword.status).toBe(422);
    const cyrillic = await new Client().request('POST', '/auth/register', {
      login: 'назар',
      name: 'Назар',
      password: 'password123',
    });
    expect(cyrillic.status).toBe(422);
  });

  it('профіль: змінити ім’я; зміна пароля виходить з інших пристроїв', async () => {
    const phone = new Client();
    await phone.register('roman', undefined, 'Роман');
    const laptop = new Client();
    await laptop.request('POST', '/auth/login', { login: 'roman', password: 'password123' });

    const renamed = await phone.request('PATCH', '/me', { name: 'Роман Олійник' });
    expect(renamed.data.name).toBe('Роман Олійник');

    const wrong = await phone.request('PUT', '/me/password', { currentPassword: 'nope', newPassword: 'newpassword1' });
    expect(wrong.status).toBe(422);
    const changed = await phone.request('PUT', '/me/password', {
      currentPassword: 'password123',
      newPassword: 'newpassword1',
    });
    expect(changed.status).toBe(204);

    expect((await phone.request('GET', '/me')).data.login).toBe('roman');
    expect((await laptop.request('GET', '/me')).data).toBeNull();
    const relogin = await new Client().request('POST', '/auth/login', { login: 'roman', password: 'newpassword1' });
    expect(relogin.status).toBe(200);
  });

  it('після 10 невдалих спроб вхід тимчасово блокується', async () => {
    await new Client().register('yurii');
    const attacker = new Client();
    for (let i = 0; i < 10; i++) await attacker.request('POST', '/auth/login', { login: 'yurii', password: `bad${i}` });
    const blocked = await attacker.request('POST', '/auth/login', { login: 'yurii', password: 'password123' });
    expect(blocked.status).toBe(429);
  });
});

describe('запрошення', () => {
  const join = (inviteCode?: string) =>
    new Client().request('POST', '/auth/register', { login: 'guest', name: 'Гість', password: 'password123', inviteCode });

  it('на порожній базі реєстрація відкрита, далі — лише за кодом', async () => {
    const guest = new Client();
    expect((await guest.request('GET', '/auth/registration')).data).toEqual({ open: true });

    const admin = new Client();
    await admin.register('admin');
    const code = await admin.invite();
    expect((await guest.request('GET', '/auth/registration')).data).toEqual({ open: false });
    expect((await guest.request('GET', '/auth/registration?invite=wrong')).data).toEqual({ open: false });
    expect((await guest.request('GET', `/auth/registration?invite=${code}`)).data).toEqual({ open: true });

    expect((await join()).status).toBe(403);
    expect((await join('wrong')).status).toBe(403);
    expect((await join(code)).status).toBe(201);
  });

  it('посилання стале, доки організатор не створить нове; старе тоді не працює', async () => {
    const admin = new Client();
    await admin.register('admin');
    const first = await admin.invite();
    expect(await admin.invite()).toBe(first);

    const { data } = await admin.request('POST', '/invite');
    expect(data.code).not.toBe(first);
    expect((await join(first)).status).toBe(403);
    expect((await join(data.code)).status).toBe(201);
  });

  it('гравець не бачить і не змінює запрошення', async () => {
    const admin = new Client();
    await admin.register('admin');
    const player = new Client();
    await player.register('player', await admin.invite());
    expect((await player.request('GET', '/invite')).status).toBe(403);
    expect((await player.request('POST', '/invite')).status).toBe(403);
    expect((await new Client().request('GET', '/invite')).status).toBe(401);
  });

  it('одночасна реєстрація на порожній базі дає лише одного організатора', async () => {
    const results = await Promise.all(['first1', 'first2', 'first3'].map((login) => new Client().request('POST', '/auth/register', {
      login,
      name: 'Хтось',
      password: 'password123',
    })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.find((r) => r.status === 201)?.data.role).toBe('admin');
  });
});

describe('CSRF', () => {
  it('змінні запити з чужого Origin відхиляються', async () => {
    const client = new Client();
    await client.register('mykola');
    const res = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { cookie: client.cookie, origin: 'https://evil.example', 'content-type': 'text/plain' },
    });
    expect(res.status).toBe(403);
    expect((await client.request('GET', '/me')).data.login).toBe('mykola');
  });
});
