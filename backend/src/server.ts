import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app';
import { createDb } from './db/client';
import { runMigrations } from './db/migrations';
import { env, isProduction } from './env';

const { db, close } = createDb(env.DATABASE_URL);
// Нові міграції застосовуються при кожному старті — деплой не потребує окремого кроку.
await runMigrations(db);

const app = createApp({ db, secureCookies: isProduction });

// У продакшні той самий сервер роздає зібраний фронтенд: один домен, без CORS.
const FRONTEND_DIST = fileURLToPath(new URL('../../frontend/dist', import.meta.url));
if (isProduction && existsSync(FRONTEND_DIST)) {
  const indexHtml = readFileSync(`${FRONTEND_DIST}/index.html`, 'utf8');
  app.use('*', serveStatic({ root: FRONTEND_DIST }));
  // Решта шляхів — маршрути React Router.
  app.get('*', (c) => c.html(indexHtml));
}

const server = serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
  console.log(`API: http://localhost:${port}/api`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close();
    void close().then(() => process.exit(0));
  });
}
