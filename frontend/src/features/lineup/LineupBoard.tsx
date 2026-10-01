import { useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Eraser, Save, Shuffle, TriangleAlert, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSaveTeams } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MIN_PLAYERS_PER_TEAM, TEAM_HEX } from '@futbol/shared/constants';
import type { Game, Player, PlayerId } from '@futbol/shared/types';
import { POOL_DROP, PITCH_DROP, TEAM_DROP_PREFIX, type DragData } from './dnd';
import { fromScreen, type PitchSide } from './formation';
import { LineupPitch } from './LineupPitch';
import { LineupTeamCard } from './LineupTeamCard';
import { DragToken } from './LineupToken';
import { PlayerPool } from './PlayerPool';
import { teamOf, useLineupDraft } from './useLineupDraft';

/** Координати курсора чи пальця на початку перетягування. */
function pointOf(event: Event | null): { x: number; y: number } | null {
  if (!event) return null;
  if ('touches' in event) {
    const touch = (event as TouchEvent).touches[0] ?? (event as TouchEvent).changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }
  if ('clientX' in event) return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
  return null;
}

interface LineupBoardProps {
  game: Game;
  players: readonly Player[];
  playersById: ReadonlyMap<PlayerId, Player>;
  editable: boolean;
  /** Шапка поля (назва гри, дата). */
  pitchHeader: ReactNode;
  /** Відкрити налаштування гри — щоб збільшити кількість учасників. */
  onEditGame: () => void;
}

/**
 * Розстановка однієї гри: список гравців, команди й поле. Організатор тягне гравців
 * мишею чи пальцем (на телефоні — затиснути), а зберігає все однією кнопкою.
 */
export function LineupBoard({ game, players, playersById, editable, pitchHeader, onEditGame }: LineupBoardProps) {
  const draft = useLineupDraft(game, playersById);
  const save = useSaveTeams(game.id);
  const [pair, setPair] = useState<[string, string]>(() => [draft.teams[0].id, draft.teams[1].id]);
  const [dragging, setDragging] = useState<PlayerId | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // На телефоні тягнемо після короткого затискання, щоб звичайний свайп гортав сторінку.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const byId = (id: string) => draft.teams.find((t) => t.id === id) ?? draft.teams[0];
  const top = byId(pair[0]);
  const bottom = byId(pair[1]);
  const sideTeam: Record<PitchSide, string> = { top: top.id, bottom: bottom.id };

  /** Та сама команда з обох боків не буває: вибір «зайнятої» міняє їх місцями. */
  const changePair = (side: PitchSide, teamId: string) =>
    setPair(([t, b]) => {
      if (side === 'top') return teamId === b ? [b, t] : [teamId, b];
      return teamId === t ? [b, t] : [t, teamId];
    });

  const onDragStart = ({ active }: DragStartEvent) => {
    setDragging((active.data.current as DragData | undefined)?.playerId ?? null);
  };

  const onDragEnd = ({ active, over, activatorEvent, delta }: DragEndEvent) => {
    setDragging(null);
    const data = active.data.current as DragData | undefined;
    if (!data || !over) return;
    const { playerId, from } = data;
    const overId = String(over.id);

    if (overId === POOL_DROP) {
      if (from !== 'pool') draft.assign(playerId, null);
      return;
    }

    if (overId.startsWith(TEAM_DROP_PREFIX)) {
      const teamId = overId.slice(TEAM_DROP_PREFIX.length);
      // З поля у свою ж команду — це «в запас».
      if (from === 'pitch' && teamOf(draft.teams, playerId)?.id === teamId) draft.bench(playerId);
      else draft.assign(playerId, teamId);
      return;
    }

    if (overId === PITCH_DROP) {
      // Точка, де відпустили: початок жесту + зсув. Рядок зі списку широкий, тож його центр не годиться.
      const start = pointOf(activatorEvent);
      if (!start) return;
      const screen = {
        x: ((start.x + delta.x - over.rect.left) / over.rect.width) * 100,
        y: ((start.y + delta.y - over.rect.top) / over.rect.height) * 100,
      };
      // Гравець команди з поля лишається у своїй команді; решта — у ту, на чию половину кинули.
      const current = teamOf(draft.teams, playerId)?.id;
      const side: PitchSide =
        current === top.id ? 'top' : current === bottom.id ? 'bottom' : screen.y < 50 ? 'top' : 'bottom';
      draft.place(playerId, sideTeam[side], fromScreen(screen, side));
    }
  };

  const shuffleAll = () => {
    if (!draft.shuffleAll()) {
      toast.error(
        `Замало гравців: потрібно хоча б ${draft.teams.length * MIN_PLAYERS_PER_TEAM}. Додайте когось у команди`,
      );
    }
  };

  const saveDraft = () => save.mutate(draft.toInput(), { onSuccess: draft.markSaved });

  const overLimit = draft.assigned > game.maxPlayers;
  const draggedPlayer = dragging ? playersById.get(dragging) : undefined;
  const draggedTeam = dragging ? teamOf(draft.teams, dragging) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {editable && (
        <Card className="mb-5 flex flex-wrap items-center gap-3 p-3 sm:p-4">
          <p className="mr-auto px-1 text-sm text-ink/70">
            У командах <span className="font-bold text-ink">{draft.assigned}</span> з {game.maxPlayers} місць
          </p>
          {draft.dirty && (
            <Button size="sm" variant="ghost" icon={<Undo2 className="size-3.5" />} onClick={draft.reset}>
              Скасувати зміни
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon={<Eraser className="size-3.5" />}
            onClick={draft.clear}
            disabled={draft.assigned === 0}
          >
            Очистити
          </Button>
          <Button size="sm" variant="primary" icon={<Shuffle className="size-3.5" />} onClick={shuffleAll}>
            Перемішати
          </Button>
          <Button
            size="sm"
            variant="accent"
            icon={<Save className="size-3.5" />}
            onClick={saveDraft}
            loading={save.isPending}
            disabled={!draft.dirty || overLimit}
          >
            Зберегти
          </Button>
          {overLimit && (
            <div className="flex w-full flex-wrap items-center gap-3 rounded-tile bg-warn/15 px-4 py-2.5 text-sm text-ink ring-1 ring-warn/30">
              <TriangleAlert className="size-4 shrink-0 text-warn" />
              <p className="flex-1">
                У командах більше гравців, ніж місць у грі ({game.maxPlayers}).
              </p>
              <Button size="sm" variant="soft" onClick={onEditGame}>
                Збільшити кількість учасників
              </Button>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)_minmax(0,20rem)]">
        <div className="xl:order-2">
          <LineupPitch
            header={pitchHeader}
            top={top}
            bottom={bottom}
            allTeams={draft.teams}
            onPairChange={changePair}
            playersById={playersById}
            editable={editable}
            onShuffleSpots={(teamId) => draft.arrange(teamId, true)}
          />
        </div>

        {editable && (
          <PlayerPool
            game={game}
            players={players}
            teams={draft.teams}
            onAssign={draft.assign}
            className="xl:order-1 xl:sticky xl:top-0"
          />
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:order-3 xl:grid-cols-1">
          {draft.teams.map((team) => (
            <LineupTeamCard
              key={team.id}
              team={team}
              playersById={playersById}
              editable={editable}
              onPitch={team.id === top.id || team.id === bottom.id}
              onRemove={(id) => draft.assign(id, null)}
              onArrange={() => draft.arrange(team.id)}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggedPlayer && (
          <DragToken player={draggedPlayer} hex={draggedTeam ? TEAM_HEX[draggedTeam.color] : undefined} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
