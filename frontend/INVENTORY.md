# Інвентар компонентів

Усі компоненти сайту в одному місці. **Правило:** створив компонент — додай рядок сюди; змінив пропси чи поведінку — онови; видалив — прибери.
Нативні контроли форм (`<select>`, `<input type="date|time|number">`, `<datalist>` …) не використовуємо — лише компоненти з розділу «UI-кіт».

## UI-кіт — `src/components/ui`

Базові «цеглинки» без бізнес-логіки. Інтерактивні примітиви зроблені на Radix UI зі стилями з токенів `src/index.css`.

| Компонент | Файл | Призначення | Ключові пропси |
|---|---|---|---|
| `Button` | `Button.tsx` | Кнопка-«таблетка» | `variant` (primary / accent / soft / ghost / danger), `size` (sm / md / lg / icon / icon-sm), `loading`, `icon` |
| `Card`, `CardHeader` | `Card.tsx` | Біла картка з тінню; заголовок картки з іконкою й дією | `title`, `subtitle`, `icon`, `action` |
| `Badge` | `Badge.tsx` | Маленька мітка-чип | `tone` (neutral / lavender / pink / lime / mist / success / warn / danger / dark) |
| `Avatar`, `AvatarStack` | `Avatar.tsx` | Аватар з ініціалами в пастельному кольорі; стек аватарок, що перекриваються | `player`, `size` (xs / sm / md / lg), `max` |
| `SkillMeter`, `SkillPicker` | `SkillMeter.tsx` | Рівень гри 1–5 «сходинками»: показ і редагування | `value`, `onChange`, `showLabel` |
| `Select` | `Select.tsx` | Випадний список (Radix Select) | `value`, `onValueChange`, `options[{value,label,icon,triggerLabel}]`, `ariaLabel`, `size`. Порожній рядок як value заборонений — для «нічого» беремо `'none'` |
| `DropdownMenu` (+ `Item`, `CheckItem`, `Label`, `Separator`) | `DropdownMenu.tsx` | Меню дій (Radix DropdownMenu) | `trigger`, `align`, `tone` (light / dark) |
| `Switch` | `Switch.tsx` | Перемикач увімк./вимк. з підписом (Radix Switch) | `checked`, `onCheckedChange`, `label` |
| `Stepper` | `Stepper.tsx` | Число з кнопками − / + | `value`, `onChange`, `min`, `max`, `step`, `suffix` |
| `ChoiceChips` | `ChoiceChips.tsx` | Великі чипи для вибору одного варіанта (тривалість, час, кількість) | `value`, `options[{value,label,hint}]`, `onChange`, `columns`, `size` |
| `TimePicker` | `TimePicker.tsx` | Вибір часу: популярні слоти + «Інший» з колонками годин/хвилин (Radix Popover) | `value` («HH:mm»), `onChange`, `presets` |
| `MonthCalendar` | `MonthCalendar.tsx` | Темний місячний календар (дизайн сайдбару); і в сайдбарі, і для вибору дати | `month`, `onMonthChange`, `selected`, `onSelect`, `marker`, `isDisabled` |
| `SegmentedControl` | `SegmentedControl.tsx` | Перемикач-«таблетка» між режимами; біла «таблетка» плавно їде до обраного пункту | `value`, `options`, `onChange`, `size` |
| `AutoHeight` | `AutoHeight.tsx` | Плавно змінює висоту під вміст (зміна форми, поява помилки) | `children`, `className` |
| `Field`, `Input`, `Textarea` | `Field.tsx` | Підпис + поле + помилка з aria-зв'язками; текстові поля без glow | `label`, `error`, `hint` |
| `PasswordInput` | `PasswordInput.tsx` | Поле пароля з кнопкою «показати/сховати» (на базі `Input`); праворуч потрібен `pr-12` | пропси `<input>` без `type` |
| `Modal` | `Modal.tsx` | Модальне вікно (Radix Dialog); поповери Radix усередині працюють коректно | `open`, `onClose`, `title`, `description`, `footer`, `className` |
| `Spinner`, `PageLoader`, `EmptyState`, `ErrorState` | `States.tsx` | Стани завантаження, порожнечі й помилки | `title`, `description`, `action`, `onRetry` |
| `BallIcon` | `icons.tsx` | Іконка м'яча (в lucide немає) | SVG-пропси |

## Каркас — `src/components/layout`

| Компонент | Файл | Призначення |
|---|---|---|
| `AppLayout` | `AppLayout.tsx` | Чорна рамка, темний сайдбар (лого, навігація, міні-календар, користувач), градієнтне полотно для сторінок |
| `Logo` | `Logo.tsx` | Логотип для темного фону (сайдбар, сторінка входу); `rollKey` — м'яч прокручується, коли значення змінюється |
| `UserMenu` | `UserMenu.tsx` | Поточний користувач у сайдбарі; меню «Профіль» / «Вийти». Проп `compact` — лише аватар (шапка на телефоні) |
| `RequireAuth` | `RequireAuth.tsx` | Пускає на сторінки лише з активною сесією, інакше редирект на `/login` (з поверненням назад після входу) |

## Вхід і профіль — `src/features/auth`, `src/features/profile`

| Компонент | Файл | Призначення |
|---|---|---|
| `LoginForm` | `auth/LoginForm.tsx` | Логін + пароль; `onSuccess` після входу |
| `RegisterForm` | `auth/RegisterForm.tsx` | Ім'я, логін, пароль; `inviteCode` з посилання, `onSuccess` після реєстрації |
| `FormError` | `auth/FormError.tsx` | Помилка від сервера під формою (`error`), з'являється зі струсом; `key={mutation.submittedAt}` — струс на кожну спробу |
| `ProfileForm` | `profile/ProfileForm.tsx` | Зміна імені (`me`) |
| `PasswordForm` | `profile/PasswordForm.tsx` | Зміна пароля (поточний + новий) |

## Календар — `src/features/calendar`

| Компонент | Файл | Призначення |
|---|---|---|
| `CalendarToolbar` | `CalendarToolbar.tsx` | Назва місяця, «Сьогодні», стрілки, перемикач Місяць / Тиждень, «Нова гра» |
| `TimeGrid` | `TimeGrid.tsx` | Тиждень із часовою сіткою (md+); клік по вільній годині — нова гра (організатор) |
| `WeekAgenda` | `WeekAgenda.tsx` | Тиждень списком днів — для телефона |
| `MonthGrid` | `MonthGrid.tsx` | Місяць: «таблетки» ігор (sm+) або крапки (телефон); клік по числу — тиждень |
| `GameEventCard` | `GameEventCard.tsx` | Блок гри в тижневій сітці: місце, час, аватарки й заповненість |
| `GamePopover` | `GamePopover.tsx` | Коротка картка гри поверх календаря з кнопками запису |
| `CalendarLegend` | `CalendarLegend.tsx` | Легенда кольорів ігор |
| `MiniCalendar` | `MiniCalendar.tsx` | `MonthCalendar` у сайдбарі, пов'язаний з URL календаря |

## Гра — `src/features/games`

| Компонент | Файл | Призначення |
|---|---|---|
| `GameFormModal` | `GameFormModal.tsx` | Створення / редагування гри: `MonthCalendar` для дати, `TimePicker`, `ChoiceChips` (тривалість, команди, місце), `Stepper` (гравці), підсумок у футері |
| `AttendanceControls` | `AttendanceControls.tsx` | «Точно буду» / «Можливо не зможу» / «Відписатись» |
| `GameHero` | `GameHero.tsx` | Шапка сторінки гри: дата, місце, маршрут, заповненість, дії організатора |
| `GamePhaseBadge` | `GamePhaseBadge.tsx` | Мітка стану гри (заплановано / сьогодні / йде / завершено) |
| `MyParticipationCard` | `MyParticipationCard.tsx` | Картка «Моя участь» |
| `DutiesCard` | `DutiesCard.tsx` | Хто несе м'яч і манішки; організатор призначає через `Select` |
| `DutyIcon` | `DutyIcon.tsx` | Іконка обов'язку (м'яч / манішки) |
| `ParticipantsCard` | `ParticipantsCard.tsx` | Учасники: «точно будуть» і «під питанням» |
| `PlayerLine` | `PlayerLine.tsx` | Рядок гравця: аватар, ім'я, обов'язки, рівень |
| `ConfirmModal` | `ConfirmModal.tsx` | Підтвердження небезпечної дії |

## Команди — `src/features/teams`

| Компонент | Файл | Призначення |
|---|---|---|
| `TeamsSection` | `TeamsSection.tsx` | Секція команд: збережені склади, чернетка поділу, попередження про зміну складу |
| `TeamCard` | `TeamCard.tsx` | Картка команди; у чернетці — «Перемістити в» через `DropdownMenu` |
| `BalanceSummary` | `BalanceSummary.tsx` | Оцінка балансу й смуги сил команд |
| `DrawSettings` | `DrawSettings.tsx` | Кількість команд і `Switch` «Враховувати «можливо»» |

## Гравці — `src/features/players`

| Компонент | Файл | Призначення |
|---|---|---|
| `PlayerRow` | `PlayerRow.tsx` | Рядок гравця: рівень (`SkillPicker` для організатора), зіграні ігри, права |
| `PlayerFilters` | `PlayerFilters.tsx` | Пошук за іменем і сортування |
| `SkillDistribution` | `SkillDistribution.tsx` | Гістограма рівнів |
| `InviteCard` | `InviteCard.tsx` | Посилання-запрошення для організатора: «Скопіювати» й «Нове» (з підтвердженням, старе вимикається) |

## Розстановка — `src/features/lineup`

| Компонент | Файл | Призначення |
|---|---|---|
| `PitchMarkings` | `PitchMarkings.tsx` | SVG-розмітка поля 68 × 105 |
| `LineupToken` | `LineupToken.tsx` | Фішка гравця або вільне місце «+» на полі |
| `LineupTeamBar` | `LineupTeamBar.tsx` | Рядок команди над/під полем: літера, склад, «перемішати» |

## Сторінки — `src/pages`

| Сторінка | Файл | Маршрут |
|---|---|---|
| Календар | `CalendarPage.tsx` | `/` |
| Гра | `GamePage.tsx` | `/games/:gameId` |
| Розстановка | `LineupPage.tsx` | `/lineup` (поки статичні дані) |
| Гравці | `PlayersPage.tsx` | `/players` |
| Вхід / реєстрація | `AuthPage.tsx` | `/login`, `/register?invite=…` (без сайдбару; без чинного коду форма реєстрації прихована) |
| Профіль | `ProfilePage.tsx` | `/profile` |
| 404 | `NotFoundPage.tsx` | `*` |
