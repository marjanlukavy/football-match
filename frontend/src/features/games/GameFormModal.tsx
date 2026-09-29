import { useEffect, useId, useMemo, useState, type BaseSyntheticEvent, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { isBefore, isSameMonth, startOfMonth, startOfToday } from 'date-fns';
import { useCreateGame, useGames, useUpdateGame } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { MonthCalendar } from '@/components/ui/MonthCalendar';
import { Stepper } from '@/components/ui/Stepper';
import { TimePicker } from '@/components/ui/TimePicker';
import { MIN_PLAYERS_PER_TEAM } from '@futbol/shared/constants';
import { confirmedCount } from '@futbol/shared/game';
import type { Game, GameLocation } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { capitalize, fmt, formatLongDate, formatTimeRange, toDate, toDateInput } from '@/lib/date';
import { plural, PLAYER_FORMS } from '@/lib/plural';
import {
  createGameFormSchema,
  DURATION_OPTIONS,
  formatDuration,
  MAX_PLAYERS_LIMIT,
  NOTES_MAX_LENGTH,
  parseFormDate,
  parseFormDateTime,
  TEAM_COUNT_OPTIONS,
  TIME_PRESETS,
  toFormValues,
  toGameInput,
  type GameFormValues,
} from './gameFormSchema';

export interface GameFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Якщо передано — редагування, інакше створення. */
  game?: Game;
  /** Дата, на яку створюємо гру (клік по дню в календарі). */
  defaultDate?: Date;
  onSaved?: (game: Game) => void;
}

export function GameFormModal(props: GameFormModalProps) {
  // Кожне відкриття — новий екземпляр форми зі свіжими значеннями за замовчуванням.
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) setSession((s) => s + 1);
  }
  return <GameFormDialog key={session} {...props} />;
}

function GameFormDialog({ open, onClose, game, defaultDate, onSaved }: GameFormModalProps) {
  const isEdit = Boolean(game);
  const formId = useId();
  const create = useCreateGame();
  const update = useUpdateGame(game?.id ?? '');
  const saving = create.isPending || update.isPending;

  const schema = useMemo(() => createGameFormSchema({ allowPast: isEdit }), [isEdit]);
  const form = useForm<GameFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(game, defaultDate),
  });

  const submit = form.handleSubmit((values) => {
    const mutation = game ? update : create;
    mutation.mutate(toGameInput(values), {
      onSuccess: (saved) => {
        onSaved?.(saved);
        onClose();
      },
    });
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-3xl"
      title={isEdit ? 'Редагувати гру' : 'Нова гра'}
      footer={
        <>
          <FormSummary form={form} />
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Скасувати
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={saving}>
            {isEdit ? 'Зберегти' : 'Створити гру'}
          </Button>
        </>
      }
    >
      <GameFormFields id={formId} form={form} game={game} disabled={saving} onSubmit={submit} />
    </Modal>
  );
}

/** «Чт, 24 вер · 19:30 – 21:00 · Манеж «Арена»» — щоб бачити підсумок, не гортаючи форму. */
function FormSummary({ form }: { form: UseFormReturn<GameFormValues> }) {
  const [date, time, durationMin, locationName] = useWatch({
    control: form.control,
    name: ['date', 'time', 'durationMin', 'locationName'],
  });
  const start = parseFormDateTime(date, time);
  if (!start) return <span className="mr-auto" />;

  const parts = [capitalize(fmt(start, 'EEEEEE, d MMM')), formatTimeRange(start, durationMin), locationName.trim()];
  return (
    <span className="mr-auto hidden min-w-0 truncate text-sm text-muted sm:block">
      {parts.filter(Boolean).join(' · ')}
    </span>
  );
}

const NEW_PLACE = '__new';

interface GameFormFieldsProps {
  id: string;
  form: UseFormReturn<GameFormValues>;
  game?: Game;
  disabled: boolean;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
}

function GameFormFields({ id, form, game, disabled, onSubmit }: GameFormFieldsProps) {
  const {
    control,
    register,
    setValue,
    getValues,
    setFocus,
    formState: { errors, isSubmitted },
  } = form;
  const isEdit = Boolean(game);
  const setOptions = { shouldValidate: isSubmitted, shouldDirty: true };

  const { data: games = [] } = useGames();
  const venues = useMemo(() => uniqueVenues(games), [games]);
  const venueNames = useMemo(() => new Set(venues.map((v) => v.name)), [venues]);
  // Дні, де вже є інші ігри, — крапка в календарі.
  const busyDays = useMemo(
    () => new Set(games.filter((g) => g.id !== game?.id).map((g) => toDateInput(toDate(g.startsAt)))),
    [games, game?.id],
  );

  const [date, durationMin, teamCount, maxPlayers, locationName, notes] = useWatch({
    control,
    name: ['date', 'durationMin', 'teamCount', 'maxPlayers', 'locationName', 'notes'],
  });

  const [month, setMonth] = useState(() => startOfMonth(parseFormDate(getValues('date'))));
  const [newPlace, setNewPlace] = useState(false);
  const showPlaceInputs =
    newPlace || venues.length === 0 || (locationName.trim() !== '' && !venueNames.has(locationName));

  useEffect(() => {
    if (newPlace) setFocus('locationName');
  }, [newPlace, setFocus]);

  // Під час редагування не можна опуститися нижче вже підтверджених гравців.
  const minPlayers = Math.max(teamCount * MIN_PLAYERS_PER_TEAM, game ? confirmedCount(game) : 0);

  const durationOptions = useMemo(
    () =>
      [...new Set<number>([...DURATION_OPTIONS, durationMin])]
        .sort((a, b) => a - b)
        .map((minutes) => ({ value: minutes, label: formatDuration(minutes) })),
    [durationMin],
  );

  const teamOptions = TEAM_COUNT_OPTIONS.map((count) => ({
    value: count,
    label: count,
    hint: `по ${Math.floor(maxPlayers / count)}`,
  }));

  const venueOptions = [
    ...venues.map((v) => ({ value: v.name, label: v.name, hint: v.address || undefined })),
    {
      value: NEW_PLACE,
      label: (
        <span className="inline-flex items-center gap-1">
          <Plus className="size-3.5" />
          Нове місце
        </span>
      ),
    },
  ];

  const pickVenue = (value: string) => {
    if (value === NEW_PLACE) {
      setNewPlace(true);
      if (venueNames.has(getValues('locationName'))) {
        setValue('locationName', '', setOptions);
        setValue('locationAddress', '', setOptions);
      }
      return;
    }
    const venue = venues.find((v) => v.name === value);
    if (!venue) return;
    setNewPlace(false);
    setValue('locationName', venue.name, setOptions);
    setValue('locationAddress', venue.address, setOptions);
  };

  const pickTeamCount = (count: number) => {
    setValue('teamCount', count, setOptions);
    // Більше команд — більше потрібно місць: підтягуємо ліміт замість помилки.
    const min = Math.max(count * MIN_PLAYERS_PER_TEAM, game ? confirmedCount(game) : 0);
    if (getValues('maxPlayers') < min) setValue('maxPlayers', min, setOptions);
  };

  const selectedDate = parseFormDate(date);

  return (
    <form id={id} noValidate onSubmit={onSubmit}>
      <fieldset disabled={disabled} className="grid gap-x-8 gap-y-6 sm:grid-cols-[17.5rem_minmax(0,1fr)]">
        {/* Дата */}
        <div className="flex flex-col gap-3">
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <MonthCalendar
                month={month}
                onMonthChange={setMonth}
                selected={selectedDate}
                onSelect={(day) => {
                  field.onChange(toDateInput(day));
                  if (!isSameMonth(day, month)) setMonth(startOfMonth(day));
                }}
                isDisabled={isEdit ? undefined : (day) => isBefore(day, startOfToday())}
                marker={(day) => (busyDays.has(toDateInput(day)) ? 'bg-lime' : undefined)}
                describeDay={(day) => (busyDays.has(toDateInput(day)) ? 'вже є гра' : undefined)}
              />
            )}
          />
          <div className="px-1">
            <p className="text-lg font-semibold tracking-tight text-ink">
              {capitalize(formatLongDate(selectedDate))}
            </p>
            {busyDays.has(date) && <p className="text-xs text-muted">У цей день уже є гра</p>}
            <ErrorText message={errors.date?.message} />
          </div>
        </div>

        {/* Час, тривалість, склад */}
        <div className="flex min-w-0 flex-col gap-5">
          <Section label="Початок" error={errors.time?.message}>
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <TimePicker
                  ariaLabel="Час початку"
                  value={field.value}
                  onChange={field.onChange}
                  presets={TIME_PRESETS}
                  invalid={Boolean(errors.time)}
                />
              )}
            />
          </Section>

          <Section label="Тривалість">
            <Controller
              control={control}
              name="durationMin"
              render={({ field }) => (
                <ChoiceChips
                  ariaLabel="Тривалість гри"
                  value={field.value}
                  options={durationOptions}
                  onChange={field.onChange}
                  columns={4}
                />
              )}
            />
          </Section>

          <div className="grid gap-5 sm:grid-cols-2">
            <Section label="Команд">
              <ChoiceChips
                ariaLabel="Кількість команд"
                value={teamCount}
                options={teamOptions}
                onChange={pickTeamCount}
                columns={teamOptions.length}
              />
            </Section>

            <Section label="Гравців" error={errors.maxPlayers?.message}>
              <Controller
                control={control}
                name="maxPlayers"
                render={({ field }) => (
                  <Stepper
                    ariaLabel="Максимум гравців"
                    value={field.value}
                    onChange={field.onChange}
                    min={minPlayers}
                    max={MAX_PLAYERS_LIMIT}
                    suffix={plural(field.value, PLAYER_FORMS)}
                    invalid={Boolean(errors.maxPlayers)}
                    className="w-full"
                  />
                )}
              />
            </Section>
          </div>
        </div>

        {/* Місце */}
        <Section
          label="Місце"
          className="sm:col-span-2"
          error={showPlaceInputs ? undefined : errors.locationName?.message}
        >
          {venues.length > 0 && (
            <ChoiceChips
              ariaLabel="Місце гри"
              size="md"
              value={showPlaceInputs ? NEW_PLACE : venueNames.has(locationName) ? locationName : undefined}
              options={venueOptions}
              onChange={pickVenue}
            />
          )}
          {showPlaceInputs && (
            <div className="grid animate-fade-up gap-3 sm:grid-cols-2">
              <Field label="Назва" error={errors.locationName?.message}>
                {(fieldId, describedBy) => (
                  <Input
                    id={fieldId}
                    placeholder="Наприклад, СК «Олімп»"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.locationName)}
                    aria-describedby={describedBy}
                    {...register('locationName')}
                  />
                )}
              </Field>
              <Field label="Адреса" error={errors.locationAddress?.message}>
                {(fieldId, describedBy) => (
                  <Input
                    id={fieldId}
                    placeholder="Вулиця, будинок"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.locationAddress)}
                    aria-describedby={describedBy}
                    {...register('locationAddress')}
                  />
                )}
              </Field>
            </div>
          )}
        </Section>

        {/* Нотатки */}
        <Section
          label="Нотатки"
          className="sm:col-span-2"
          error={errors.notes?.message}
          aside={
            <span className={cn('text-xs tabular-nums', notes.length > NOTES_MAX_LENGTH ? 'text-danger' : 'text-subtle')}>
              {notes.length}/{NOTES_MAX_LENGTH}
            </span>
          }
        >
          <Textarea
            rows={2}
            aria-label="Нотатки"
            placeholder="Необов'язково: взуття, оплата, що взяти з собою"
            aria-invalid={Boolean(errors.notes)}
            {...register('notes')}
          />
        </Section>
      </fieldset>
    </form>
  );
}

function Section({
  label,
  error,
  aside,
  className,
  children,
}: {
  label: string;
  error?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-muted">{label}</span>
        {aside}
      </div>
      {children}
      <ErrorText message={error} />
    </div>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

/** Унікальні місця з уже створених ігор; актуальна адреса — з найновішої гри. */
function uniqueVenues(games: readonly Game[]): GameLocation[] {
  const byName = new Map<string, GameLocation>();
  for (const g of [...games].sort((a, b) => b.startsAt.localeCompare(a.startsAt))) {
    if (!byName.has(g.location.name)) byName.set(g.location.name, g.location);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}
