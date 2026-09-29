import { ApiError, isApiErrorBody } from '@futbol/shared/errors';
import { NetworkError } from './errors';
import type { Api } from './types';

/** Відносний шлях: у розробці його проксіює Vite, у продакшні фронт і API на одному домені. */
const BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }

  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (res.ok) return data as T;
  if (isApiErrorBody(data)) throw new ApiError(data.code, data.message);
  throw new Error(`HTTP ${res.status}`);
}

const encode = encodeURIComponent;

export const httpApi: Api = {
  getMe: () => request('GET', '/me'),
  login: (input) => request('POST', '/auth/login', input),
  register: (input) => request('POST', '/auth/register', input),
  logout: () => request('POST', '/auth/logout'),
  updateProfile: (patch) => request('PATCH', '/me', patch),
  changePassword: (input) => request('PUT', '/me/password', input),
  getRegistrationStatus: (inviteCode) =>
    request('GET', `/auth/registration${inviteCode ? `?invite=${encode(inviteCode)}` : ''}`),

  getInvite: () => request('GET', '/invite'),
  regenerateInvite: () => request('POST', '/invite'),

  listPlayers: () => request('GET', '/players'),
  updatePlayer: (id, patch) => request('PATCH', `/players/${encode(id)}`, patch),

  listGames: (query = {}) => {
    const params = new URLSearchParams();
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
    const search = params.size > 0 ? `?${params}` : '';
    return request('GET', `/games${search}`);
  },
  getGame: (id) => request('GET', `/games/${encode(id)}`),
  createGame: (input) => request('POST', '/games', input),
  updateGame: (id, input) => request('PUT', `/games/${encode(id)}`, input),
  deleteGame: (id) => request('DELETE', `/games/${encode(id)}`),

  setAttendance: (gameId, status) => request('PUT', `/games/${encode(gameId)}/attendance`, { status }),
  cancelAttendance: (gameId) => request('DELETE', `/games/${encode(gameId)}/attendance`),
  setDuty: (gameId, kind, playerId) => request('PUT', `/games/${encode(gameId)}/duties/${kind}`, { playerId }),

  saveTeams: (gameId, draw) => request('PUT', `/games/${encode(gameId)}/teams`, draw),
  clearTeams: (gameId) => request('DELETE', `/games/${encode(gameId)}/teams`),
};
