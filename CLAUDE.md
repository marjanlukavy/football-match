# Футбол з друзями

Сайт для організації аматорського футболу. Монорепо на npm workspaces:

- `frontend/` — React + TypeScript + Vite + Tailwind v4 + TanStack Query + Radix UI. Дані йдуть через `Api` (`frontend/src/api/types.ts`), реалізація — `httpApi.ts`.
- `backend/` — Hono + Drizzle ORM + PostgreSQL, вхід за логіном/паролем (сесія в httpOnly-cookie). Бізнес-правила — у `backend/src/services`.
- `shared/` — спільні для обох типи, константи, правила гри (`game.ts`), zod-схеми запитів і помилки. Змінюєш контракт — міняй тут.

Запуск: `npm run dev` у корені (API :3000 + Vite з проксі `/api`). База для `npm run dev` — з `backend/.env`: зараз це Neon (проєкт `football`, Франкфурт), локальний Postgres закоментований там само. Тести завжди йдуть на локальну `futbol_test`. Демо-дані `npm run db:seed` — лише на локальну базу (логін `andrii`, пароль `futbol123`; реєстрація — `/register?invite=demo-invite`). Нова міграція після зміни `backend/src/db/schema.ts`: `npm run db:generate -w backend`.

Історія роботи над проєктом — у [`SESSION-LOG.md`](SESSION-LOG.md); нову сесію дописуй туди зверху.

## Правила для UI

- **Жодних нативних контролів форм.** Не використовуй `<select>`, `<datalist>`, `<input type="date|time|number|checkbox|radio">` тощо. Лише готові компоненти з `frontend/src/components/ui` (на базі Radix UI з нашими стилями): `Select`, `DropdownMenu`, `Switch`, `Stepper`, `ChoiceChips`, `TimePicker`, `MonthCalendar`, `SegmentedControl`, `Field`/`Input`/`Textarea`/`PasswordInput`. Якщо потрібного компонента немає — спершу додай його в `components/ui`, потім використовуй.
- **Кожен новий компонент — одразу в `frontend/INVENTORY.md`**: шлях, призначення, ключові пропси. Змінив поведінку чи пропси існуючого — онови запис. Видалив компонент — прибери рядок.
- Кольори, радіуси й тіні — лише токени з `frontend/src/index.css` (`@theme`), без хардкоду по компонентах.
- На полях вводу без glow/ring-ефектів: фокус показується лише кольором border.
- Інтерфейс простий і не перевантажений: мінімум допоміжних текстів, великі зручні елементи для натискання.
- Увесь текст інтерфейсу й коментарі в коді — українською.
- MCP-інструменти в цьому проєкті не використовувати (візуальні перевірки — локальним headless-браузером).
