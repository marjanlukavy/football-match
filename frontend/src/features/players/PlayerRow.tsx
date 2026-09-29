import type { ReactNode } from 'react';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdatePlayer } from '@/api/hooks';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkillMeter, SkillPicker } from '@/components/ui/SkillMeter';
import { SKILL_LABELS } from '@futbol/shared/constants';
import type { Player, PlayerPatch } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { GAME_FORMS, plural } from '@/lib/plural';

/** Спільна сітка для рядків і заголовка таблиці. */
export function playerGridClass(editable: boolean): string {
  return editable
    ? 'md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)] md:items-center md:gap-4'
    : 'md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.8fr)_minmax(0,0.8fr)] md:items-center md:gap-4';
}

const SUCCESS_MESSAGES: Record<keyof PlayerPatch, string> = {
  skill: 'Рівень оновлено',
  role: 'Права оновлено',
};

interface PlayerRowProps {
  player: Player;
  isMe: boolean;
  /** Поточний користувач — організатор і може редагувати. */
  editable: boolean;
  gamesPlayed: number;
}

export function PlayerRow({ player, isMe, editable, gamesPlayed }: PlayerRowProps) {
  const update = useUpdatePlayer();

  const save = (patch: PlayerPatch) => {
    const field = Object.keys(patch)[0] as keyof PlayerPatch;
    update.mutate({ id: player.id, patch }, { onSuccess: () => toast.success(SUCCESS_MESSAGES[field]) });
  };

  const isAdmin = player.role === 'admin';

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 transition-colors sm:px-6',
        playerGridClass(editable),
        isMe ? 'bg-lavender-soft/45' : 'hover:bg-black/[0.015]',
      )}
    >
      <div className="flex min-w-0 basis-full items-center gap-3 md:basis-auto">
        <Avatar player={player} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-ink">{player.name}</span>
            {isMe && <Badge tone="lime">ви</Badge>}
            {update.isPending && <Loader2 className="size-3.5 animate-spin text-accent" aria-label="Зберігаємо" />}
          </div>
          {isAdmin && (
            <Badge tone="lavender" className="mt-1">
              <ShieldCheck className="size-3" />
              Організатор
            </Badge>
          )}
        </div>
      </div>

      <Cell label="Рівень">
        {editable ? (
          <span className="inline-flex items-center gap-2.5">
            <SkillPicker value={player.skill} disabled={update.isPending} onChange={(skill) => save({ skill })} />
            <span className="text-xs font-medium text-muted">{SKILL_LABELS[player.skill]}</span>
          </span>
        ) : (
          <SkillMeter value={player.skill} showLabel />
        )}
      </Cell>

      <Cell label="Зіграно">
        <span className="text-sm text-ink tabular-nums">
          <span className="font-semibold">{gamesPlayed}</span>
          <span className="text-muted md:hidden"> {plural(gamesPlayed, GAME_FORMS)}</span>
        </span>
      </Cell>

      {editable && (
        <div className="max-md:ml-auto md:justify-self-end">
          <Button
            size="sm"
            variant="ghost"
            icon={isAdmin ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
            disabled={update.isPending || (isMe && isAdmin)}
            title={isMe && isAdmin ? 'Не можна зняти права організатора із себе' : undefined}
            onClick={() => save({ role: isAdmin ? 'player' : 'admin' })}
          >
            {isAdmin ? 'Зняти права' : 'Зробити організатором'}
          </Button>
        </div>
      )}
    </li>
  );
}

/** На мобільних показуємо підпис колонки поруч зі значенням. */
function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="text-[11px] font-medium text-subtle md:hidden">{label}</span>
      {children}
    </div>
  );
}
