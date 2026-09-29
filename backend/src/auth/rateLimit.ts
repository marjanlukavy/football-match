import { ApiError } from '@futbol/shared/errors';

/**
 * Обмеження невдалих спроб входу на логін — захист від перебору пароля.
 * Живе в пам'яті процесу: для одного сервера цього досить.
 */
const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

export function assertLoginAllowed(login: string, now = Date.now()) {
  const entry = failures.get(login);
  if (entry && entry.resetAt > now && entry.count >= MAX_FAILURES) {
    throw new ApiError('RATE_LIMITED', 'Забагато невдалих спроб. Спробуйте за 15 хвилин');
  }
}

export function recordLoginFailure(login: string, now = Date.now()) {
  const entry = failures.get(login);
  if (!entry || entry.resetAt <= now) failures.set(login, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
}

export function resetLoginFailures(login: string) {
  failures.delete(login);
}
