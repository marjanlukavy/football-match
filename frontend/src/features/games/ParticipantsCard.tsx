import { UserPlus, Users } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { DUTY_KINDS } from '@futbol/shared/constants';
import { getAttendees } from '@futbol/shared/game';
import type { AttendanceStatus, Game, Player, PlayerId } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { PLAYER_FORMS, plural } from '@/lib/plural';
import { PlayerLine } from './PlayerLine';

interface ParticipantsCardProps {
  game: Game;
  meId: PlayerId | undefined;
  playersById: ReadonlyMap<PlayerId, Player>;
}

const GROUPS: { status: AttendanceStatus; title: string; dot: string }[] = [
  { status: 'confirmed', title: 'Точно будуть', dot: 'bg-accent' },
  { status: 'maybe', title: 'Під питанням', dot: 'bg-pink-ink/60' },
];

export function ParticipantsCard({ game, meId, playersById }: ParticipantsCardProps) {
  const total = game.registrations.length;
  const dutiesOf = (id: PlayerId) => DUTY_KINDS.filter((kind) => game.duties[kind] === id);

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        icon={<Users className="size-4" />}
        title="Учасники"
        subtitle={total ? `Записались ${total} ${plural(total, PLAYER_FORMS)}` : undefined}
      />

      {total === 0 ? (
        <EmptyState
          icon={<UserPlus className="size-6" />}
          title="Поки ніхто не записався"
          description="Будьте першим — решта підтягнеться."
        />
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {GROUPS.map(({ status, title, dot }) => {
            const players = getAttendees(game, status)
              .map((r) => playersById.get(r.playerId))
              .filter((p): p is Player => Boolean(p));

            return (
              <section key={status} aria-label={title}>
                <h4 className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
                  <span className={cn('size-2 rounded-full', dot)} />
                  {title}
                  <span className="text-ink">{players.length}</span>
                </h4>
                {players.length === 0 ? (
                  <p className="py-3 text-sm text-subtle">Нікого</p>
                ) : (
                  <div className="divide-y divide-line">
                    {players.map((p) => (
                      <PlayerLine key={p.id} player={p} isMe={p.id === meId} duties={dutiesOf(p.id)} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Card>
  );
}
