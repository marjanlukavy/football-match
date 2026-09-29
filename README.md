# Футбол з друзями

Монорепо: `frontend/` (React), `backend/` (Hono + Postgres), `shared/` (спільні типи, правила, схеми).

## Локальний запуск

Потрібні Node 22+ і PostgreSQL (локально, в Docker чи Neon — будь-який).

```bash
npm install
cp backend/.env.example backend/.env   # за потреби змініть DATABASE_URL
createdb futbol                        # один раз
npm run db:seed                        # демо-дані: логін andrii, пароль futbol123
npm run dev                            # API :3000 + сайт :5173
```

Реєстрація закрита: зареєструватись можна лише за посиланням-запрошенням, яке організатор копіює на сторінці
«Гравці» (демо: `http://localhost:5173/register?invite=demo-invite`). Виняток — порожня база: перший
зареєстрований проходить без коду й стає організатором, тож після деплою зареєструйтесь першим одразу.

## Neon (продакшн-база)

Репозиторій прив'язаний до проєкту Neon `football` у Франкфурті (`aws-eu-central-1`, файл `.neon`).
Рядки підключення — у `backend/.env.neon` (не в git): `DATABASE_URL` через пулер — для сервера,
`DATABASE_URL_UNPOOLED` — для міграцій. `backend/.env` зараз теж вказує на Neon; локальний Postgres там закоментований.
Тести завжди йдуть на локальну `futbol_test`, а `db:seed` відмовляється стирати віддалену базу.

```bash
npx --registry=https://registry.npmjs.org/ neon@6.0.0 env pull -e DATABASE_URL,DATABASE_URL_UNPOOLED --file backend/.env.neon
```

## Команди

| Команда | Що робить |
|---|---|
| `npm run dev` | API і фронт у режимі розробки |
| `npm test` | тести бекенду (база `futbol_test`) і фронту |
| `npm run typecheck` | перевірка типів у всіх пакетах |
| `npm run db:migrate` | застосувати міграції (сервер робить це й сам при старті) |
| `npm run db:generate -w backend` | згенерувати міграцію після зміни `backend/src/db/schema.ts` |
| `npm run build && NODE_ENV=production npm start` | продакшн: один сервер віддає API і зібраний фронт |

## API

Усі шляхи під `/api`, помилки — `{ code, message }` зі статусами 401/403/404/409/422/429.

```
GET  /auth/registration?invite · POST /auth/register · POST /auth/login · POST /auth/logout
GET|POST /invite  (організатор: поточне / нове посилання)
GET  /me · PATCH /me · PUT /me/password
GET  /players · PATCH /players/:id
GET  /games?from&to · GET /games/:id · POST /games · PUT /games/:id · DELETE /games/:id
PUT|DELETE /games/:id/attendance · PUT /games/:id/duties/:kind · PUT|DELETE /games/:id/teams
```
# football-match
