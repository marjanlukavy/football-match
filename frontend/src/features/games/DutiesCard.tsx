import { Info, Package } from 'lucide-react';
import { useSetDuty } from '@/api/hooks';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select, type SelectOption } from '@/components/ui/Select';
import { DUTY_KINDS, DUTY_LABELS } from '@futbol/shared/constants';
import { getAttendees, getRegistration, isRegistrationOpen } from '@futbol/shared/game';
import type { DutyKind, Game, Player, PlayerId } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { DutyIcon } from './DutyIcon';

/** Radix Select не приймає порожній рядок, тож «нікого» — окреме значення. */
const NOBODY = 'none';

interface DutiesCardProps {
  game: Game;
  meId: PlayerId | undefined;
  isAdmin: boolean;
  playersById: ReadonlyMap<PlayerId, Player>;
}

/** Хто приносить м'яч і манішки. Правила ті самі, що й у api.setDuty. */
export function DutiesCard({ game, meId, isAdmin, playersById }: DutiesCardProps) {
  const setDuty = useSetDuty(game.id);
  const open = isRegistrationOpen(game);
  const iAmConfirmed = getRegistration(game, meId)?.status === 'confirmed';
  const confirmedPlayers = getAttendees(game, 'confirmed')
    .map((r) => playersById.get(r.playerId))
    .filter((p): p is Player => Boolean(p));

  const pendingKind = setDuty.isPending ? setDuty.variables?.kind : undefined;
  const assign = (kind: DutyKind, playerId: PlayerId | null) => setDuty.mutate({ kind, playerId });

  // Себе організатор знаходить першим рядком, а не серед усіх імен.
  const assigneeOptions: SelectOption[] = [
    { value: NOBODY, label: 'Ніхто' },
    ...[...confirmedPlayers]
      .sort((a, b) => Number(b.id === meId) - Number(a.id === meId))
      .map((p) => ({
        value: p.id,
        label: p.id === meId ? `Я (${p.name})` : p.name,
        icon: <Avatar player={p} size="xs" />,
      })),
  ];

  return (
    <Card className="p-5">
      <CardHeader
        icon={<Package className="size-4" />}
        title="М'яч і манішки"
        subtitle="Хто що приносить на гру"
      />

      <ul className="mt-4 space-y-2">
        {DUTY_KINDS.map((kind) => {
          const holderId = game.duties[kind];
          const holder = holderId ? playersById.get(holderId) : undefined;
          const isMine = holderId !== null && holderId === meId;

          return (
            <li key={kind} className="flex items-center gap-3 rounded-tile bg-black/[0.03] p-3">
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-xl',
                  kind === 'ball' ? 'bg-lavender-soft text-accent-ink' : 'bg-lime/70 text-[#4d5a0f]',
                )}
              >
                <DutyIcon kind={kind} className="size-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted">{DUTY_LABELS[kind]}</p>
                {holder ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Avatar player={holder} size="xs" />
                    <span className="truncate">{isMine ? 'Ви' : holder.name}</span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm font-medium text-subtle">Ніхто не взяв</p>
                )}
              </div>

              {open && isAdmin && (
                <Select
                  size="sm"
                  ariaLabel={`Відповідальний: ${DUTY_LABELS[kind].toLowerCase()}`}
                  value={holderId ?? NOBODY}
                  options={assigneeOptions}
                  disabled={pendingKind !== undefined}
                  onValueChange={(value) => assign(kind, value === NOBODY ? null : value)}
                  className="max-w-40 shrink-0"
                />
              )}

              {open && !isAdmin && isMine && (
                <Button size="sm" variant="ghost" loading={pendingKind === kind} onClick={() => assign(kind, null)}>
                  Відмовитись
                </Button>
              )}

              {open && !isAdmin && !holderId && iAmConfirmed && meId && (
                <Button size="sm" variant="primary" loading={pendingKind === kind} onClick={() => assign(kind, meId)}>
                  Я візьму
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {open && !iAmConfirmed && !isAdmin && (
        <p className="mt-3 flex gap-2 text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0" />
          Взяти м'яч чи манішки може лише той, хто точно прийде.
        </p>
      )}
      {open && isAdmin && confirmedPlayers.length === 0 && (
        <p className="mt-3 flex gap-2 text-xs text-muted">
          <Info className="mt-px size-3.5 shrink-0" />
          Призначити можна лише гравців зі статусом «точно буду».
        </p>
      )}
    </Card>
  );
}
