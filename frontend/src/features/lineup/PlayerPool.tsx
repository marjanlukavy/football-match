import { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Search, UserRoundX, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Field';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TEAM_HEX } from '@futbol/shared/constants';
import { getRegistration } from '@futbol/shared/game';
import type { AttendanceStatus, Game, Player, Team } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { POOL_DROP } from './dnd';
import { DraggablePlayerRow } from './DraggablePlayerRow';

type PoolFilter = 'all' | 'registered';

const STATUS_RANK: Record<AttendanceStatus | 'none', number> = { confirmed: 0, maybe: 1, none: 2 };

interface PlayerPoolProps {
  game: Game;
  players: readonly Player[];
  teams: readonly Team[];
  onAssign: (playerId: string, teamId: string) => void;
  className?: string;
}

/**
 * Гравці компанії, яких ще немає в жодній команді. Пошук за іменем;
 * зверху — ті, хто записався на гру. Тягнути можна в команду або одразу на поле.
 */
export function PlayerPool({ game, players, teams, onAssign, className }: PlayerPoolProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PoolFilter>('all');
  const { setNodeRef, isOver, active } = useDroppable({ id: POOL_DROP });

  const free = useMemo(() => {
    const taken = new Set(teams.flatMap((t) => t.playerIds));
    const needle = query.trim().toLocaleLowerCase('uk');
    const status = (p: Player) => getRegistration(game, p.id)?.status ?? 'none';
    return players
      .filter((p) => !taken.has(p.id))
      .filter((p) => filter === 'all' || status(p) !== 'none')
      .filter((p) => !needle || p.name.toLocaleLowerCase('uk').includes(needle))
      .sort(
        (a, b) =>
          STATUS_RANK[status(a)] - STATUS_RANK[status(b)] ||
          b.skill - a.skill ||
          a.name.localeCompare(b.name, 'uk'),
      );
  }, [players, teams, game, query, filter]);

  // Список підсвічується лише коли в нього тягнуть з команди чи з поля.
  const fromTeam = active?.data.current?.from !== undefined && active.data.current.from !== 'pool';

  return (
    <div ref={setNodeRef} className={className}>
      <Card className={cn('flex h-full flex-col p-4 transition-shadow', fromTeam && isOver && 'ring-2 ring-accent')}>
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-[15px] font-semibold tracking-tight">Гравці</h2>
          <span className="text-xs text-muted">без команди: {free.length}</span>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
          <Input
            type="search"
            aria-label="Пошук гравця"
            placeholder="Пошук за іменем"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-full pr-9 pl-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Очистити пошук"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <SegmentedControl
          size="sm"
          ariaLabel="Кого показувати"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Усі' },
            { value: 'registered', label: 'Записані на гру' },
          ]}
          className="mt-3 self-start"
        />

        {free.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted">
            <UserRoundX className="size-6 text-subtle" />
            {query ? 'Нікого не знайдено' : 'Усі гравці вже в командах'}
          </div>
        ) : (
          <ul className="scrollbar-thin mt-2 -mr-2 max-h-[min(60vh,560px)] overflow-y-auto pr-2">
            {free.map((player) => (
              <DraggablePlayerRow
                key={player.id}
                player={player}
                from="pool"
                editable
                meta={<StatusBadge status={getRegistration(game, player.id)?.status} />}
                trailing={<AddMenu player={player} teams={teams} onAssign={onAssign} />}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: AttendanceStatus | undefined }) {
  if (status === 'confirmed') return <Badge tone="lavender">буде</Badge>;
  if (status === 'maybe') return <Badge tone="warn">можливо</Badge>;
  return <span>не записаний</span>;
}

/** Без перетягування: «+» і вибір команди (зручно на телефоні й з клавіатури). */
function AddMenu({ player, teams, onAssign }: { player: Player; teams: readonly Team[]; onAssign: PlayerPoolProps['onAssign'] }) {
  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          aria-label={`Додати ${player.name} в команду`}
          title="Додати в команду"
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors outline-none hover:bg-black/5 hover:text-ink focus-visible:bg-lavender-soft data-[state=open]:bg-black/5 data-[state=open]:text-ink"
        >
          <Plus className="size-4" />
        </button>
      }
    >
      <DropdownMenuLabel>Додати в команду</DropdownMenuLabel>
      {teams.map((t) => (
        <DropdownMenuItem key={t.id} onSelect={() => onAssign(player.id, t.id)}>
          <span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: TEAM_HEX[t.color] }} />
          {t.name}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
