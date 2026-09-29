import { Hono } from 'hono';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ApiError, ERROR_STATUS, type ApiErrorBody } from '@futbol/shared/errors';
import type { Db } from './db/client';
import type { AppEnv } from './http/context';
import { sessionMiddleware } from './http/session';
import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/games';
import { playerRoutes } from './routes/players';

interface AppOptions {
  db: Db;
  secureCookies: boolean;
}

/** HTTP-застосунок без прив'язки до порту — так його зручно ганяти в тестах через app.request(). */
export function createApp({ db, secureCookies }: AppOptions) {
  const api = new Hono<AppEnv>()
    .use(async (c, next) => {
      c.set('db', db);
      c.set('secureCookies', secureCookies);
      await next();
    })
    // Відхиляє змінні запити з чужих Origin — другий шар захисту поверх SameSite-cookie.
    .use(csrf())
    .use(sessionMiddleware)
    .route('/', authRoutes)
    .route('/', playerRoutes)
    .route('/', gameRoutes)
    // Невідомі /api-шляхи — JSON-помилка, а не index.html фронтенду.
    .all('*', () => {
      throw new ApiError('NOT_FOUND', 'Такого запиту немає');
    });

  api.onError((error, c) => {
    if (error instanceof ApiError) {
      return c.json<ApiErrorBody>({ code: error.code, message: error.message }, ERROR_STATUS[error.code] as ContentfulStatusCode);
    }
    if (error instanceof HTTPException && error.status === 403) {
      return c.json<ApiErrorBody>({ code: 'FORBIDDEN', message: 'Запит з іншого сайту відхилено' }, 403);
    }
    console.error(error);
    return c.json({ message: 'Помилка сервера' }, 500);
  });

  return new Hono().use(secureHeaders()).route('/api', api);
}
