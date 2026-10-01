import { useDroppable } from '@dnd-kit/core';
import { LayoutGrid, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TEAM_HEX } from '@futbol/shared/constants';
import type { Player, PlayerId, Team } from '@futbol/shared/types';
import { teamStats } from '@/features/teams/balanceTeams';
import { cn } from '@/lib/cn';
import { PLAYER_FORMS, plural } from '@/lib/plural';
import { teamDropId } from './dnd';
import { DraggablePlayerRow } from './DraggablePlayerRow';

interface LineupTeamCardProps {
  team: Team;
  playersById: ReadonlyMap<PlayerId, Player>;
  editable: boolean;
  /** Чи стоїть команда зараз на полі (при 3–4 командах на полі лише дві). */
  onPitch: boolean;
  onRemove: (playerId: PlayerId) => void;
  onArrange: () => void;
}

/** Склад команди: хто на полі, хто в запасі. Сюди кидають гравців зі списку чи з поля. */
export function LineupTeamCard({ team, playersById, editable, onPitch, onRemove, onArrange }: LineupTeamCardProps) {
  const { setNodeRef, isOver, active } = useDroppable({ id: teamDropId(team.id), disabled: !editable });
  const hex = TEAM_HEX[team.color];
  const stats = teamStats(team.playerIds, (id) => playersById.get(id)?.skill ?? 0);
  const positions = team.positions ?? {};
  const members = team.playerIds.flatMap((id) => playersById.get(id) ?? []);
  const onField = members.filter((p) => positions[p.id]);
  const bench = members.filter((p) => !positions[p.id]);

  const row = (player: Player) => (
    <DraggablePlayerRow
      key={player.id}
      player={player}
      from="team"
      editable={editable}
      trailing={
        editable && (
          <button
            type="button"
            onClick={() => onRemove(player.id)}
            aria-label={`Прибрати ${player.name} з команди`}
            title="Прибрати з команди"
            className="grid size-8 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-black/5 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )
      }
    />
  );

  return (
    <div ref={setNodeRef}>
      <Card
        className={cn(
          'overflow-hidden transition-shadow',
          active && editable && 'ring-2 ring-black/5',
          isOver && 'ring-2 ring-accent',
        )}
      >
        <header
          className="flex items-center gap-3 px-4 pt-4 pb-3"
          style={{ background: `linear-gradient(180deg, ${hex}33 0%, transparent 100%)` }}
        >
          <span className="size-9 shrink-0 rounded-xl ring-1 ring-black/10" style={{ backgroundColor: hex }} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-bold tracking-tight">{team.name}</h2>
            <p className="text-xs text-muted">
              {stats.count} {plural(stats.count, PLAYER_FORMS)}
              {stats.count > 0 && ` · сер. ${stats.average.toFixed(1)}`}
            </p>
          </div>
          {editable && onPitch && members.length > 0 && (
            <Button size="sm" variant="ghost" icon={<LayoutGrid className="size-3.5" />} onClick={onArrange}>
              Розставити
            </Button>
          )}
        </header>

        <div className="px-3 pb-3">
          {members.length === 0 ? (
            <p
              className={cn(
                'rounded-tile border-2 border-dashed border-line px-4 py-6 text-center text-sm text-subtle',
                isOver && 'border-accent/40 text-accent-ink',
              )}
            >
              {editable ? 'Перетягніть гравців сюди' : 'У команді поки нікого'}
            </p>
          ) : onPitch ? (
            <>
              {onField.length > 0 && <ul>{onField.map(row)}</ul>}
              {bench.length > 0 && (
                <>
                  <p className="mt-2 px-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">Запас</p>
                  <ul>{bench.map(row)}</ul>
                </>
              )}
            </>
          ) : (
            <ul>{members.map(row)}</ul>
          )}
        </div>
      </Card>
    </div>
  );
}
