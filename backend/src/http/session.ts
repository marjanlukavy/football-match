import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { createSession, validateSession } from '../auth/sessions';
import type { AppContext, AppEnv } from './context';

const COOKIE_NAME = 'futbol_session';

function writeCookie(c: AppContext, token: string, expires: Date) {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    // Lax: cookie не йде з чужих сайтів на POST/PUT/DELETE — базовий захист від CSRF.
    sameSite: 'Lax',
    secure: c.get('secureCookies'),
    path: '/',
    expires,
  });
}

/** Визначає поточного користувача за cookie; неактивну сесію тихо ігнорує. */
export const sessionMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  c.set('me', null);
  c.set('sessionToken', null);
  const token = getCookie(c, COOKIE_NAME);
  if (token) {
    const session = await validateSession(c.get('db'), token);
    if (session) {
      c.set('me', session.me);
      c.set('sessionToken', token);
      if (session.renewedUntil) writeCookie(c, token, session.renewedUntil);
    } else {
      deleteCookie(c, COOKIE_NAME, { path: '/' });
    }
  }
  await next();
});

export async function startSession(c: AppContext, playerId: string) {
  const { token, expiresAt } = await createSession(c.get('db'), playerId);
  writeCookie(c, token, expiresAt);
}

export function clearSessionCookie(c: AppContext) {
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}
