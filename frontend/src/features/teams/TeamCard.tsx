import type { CSSProperties } from 'react';
import { ArrowLeftRight, Shirt } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/DropdownMenu';
import { TEAM_HEX } from '@futbol/shared/constants';
import type { Player, PlayerId, Team } from '@futbol/shared/types';
import { PlayerLine } from '@/features/games/PlayerLine';
import { cn } from '@/lib/cn';
import { PLAYER_FORMS, plural } from '@/lib/plural';
import { teamStats } from './balanceTeams';

interface TeamCardProps {
  team: Team;
  /** Усі команди поділу — для меню «перемістити в…». */
  allTeams: readonly Team[];
  playersById: ReadonlyMap<PlayerId, Player>;
  meId: PlayerId | undefined;
  /** Якщо передано — показуємо ручне переміщення гравців (режим чернетки). */
  onMove?: (playerId: PlayerId, toTeamId: string) => void;
  className?: string;
  style?: CSSProperties;
}

const skillOf = (byId: ReadonlyMap<PlayerId, Player>) => (id: PlayerId) => byId.get(id)?.skill ?? 0;

export function TeamCard({ team, allTeams, playersById, meId, onMove, className, style }: TeamCardProps) {
  const hex = TEAM_HEX[team.color];
  const stats = teamStats(team.playerIds, skillOf(playersById));
  const others = allTeams.filter((t) => t.id !== team.id);

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)} style={style}>
      <header
        className="flex items-center gap-3 px-5 pt-5 pb-4"
        style={{ background: `linear-gradient(180deg, ${hex}33 0%, transparent 100%)` }}
      >
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-black/10"
          style={{ backgroundColor: hex }}
        >
          <Shirt className="size-5 text-ink/70" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold tracking-tight text-ink">{team.name}</h3>
          <p className="text-xs text-muted">
            {stats.count} {plural(stats.count, PLAYER_FORMS)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl leading-none font-extrabold tracking-tight text-ink" title="Сумарний рівень">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] font-medium text-muted">сер. {stats.average.toFixed(1)}</p>
        </div>
      </header>

      {team.playerIds.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-subtle">У команді поки нікого</p>
      ) : (
        <div className="divide-y divide-line px-5 pb-3">
          {team.playerIds.map((id) => {
            const player = playersById.get(id);
            if (!player) return null;
            return (
              <PlayerLine
                key={id}
                player={player}
                isMe={id === meId}
                trailing={
                  onMove &&
                  others.length > 0 && (
                    <MoveMenu playerName={player.name} teams={others} onMove={(to) => onMove(id, to)} />
                  )
                }
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}

interface MoveMenuProps {
  playerName: string;
  teams: readonly Team[];
  onMove: (teamId: string) => void;
}

/** Меню «перемістити в іншу команду» для режиму чернетки. */
function MoveMenu({ playerName, teams, onMove }: MoveMenuProps) {
  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          aria-label={`Перемістити ${playerName} в іншу команду`}
          title="Перемістити в іншу команду"
          className="grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors outline-none hover:bg-black/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent data-[state=open]:bg-black/5 data-[state=open]:text-ink"
        >
          <ArrowLeftRight className="size-3.5" />
        </button>
      }
    >
      <DropdownMenuLabel>Перемістити в</DropdownMenuLabel>
      {teams.map((t) => (
        <DropdownMenuItem key={t.id} onSelect={() => onMove(t.id)}>
          <span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: TEAM_HEX[t.color] }} />
          {t.name}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
