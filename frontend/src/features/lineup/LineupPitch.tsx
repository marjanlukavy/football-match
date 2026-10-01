import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { TEAM_HEX } from '@futbol/shared/constants';
import type { Player, PlayerId, Team } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { PITCH_DROP } from './dnd';
import { toScreen, type PitchSide } from './formation';
import { LineupTeamBar } from './LineupTeamBar';
import { LineupToken } from './LineupToken';
import { PITCH_LENGTH, PITCH_WIDTH, PitchMarkings } from './PitchMarkings';

interface LineupPitchProps {
  header: ReactNode;
  top: Team;
  bottom: Team;
  allTeams: readonly Team[];
  onPairChange: (side: PitchSide, teamId: string) => void;
  playersById: ReadonlyMap<PlayerId, Player>;
  editable: boolean;
  onShuffleSpots: (teamId: string) => void;
}

/** Поле з двома командами: верхня атакує вниз, нижня — вгору. */
export function LineupPitch({
  header,
  top,
  bottom,
  allTeams,
  onPairChange,
  playersById,
  editable,
  onShuffleSpots,
}: LineupPitchProps) {
  const { setNodeRef, isOver, active } = useDroppable({ id: PITCH_DROP, disabled: !editable });
  const sides: [Team, PitchSide][] = [
    [top, 'top'],
    [bottom, 'bottom'],
  ];
  const empty = top.playerIds.length + bottom.playerIds.length === 0;

  return (
    // На десктопі ширину панелі обмежуємо висотою вікна, щоб поле влазило цілком.
    <section
      aria-label="Розстановка на полі"
      className="mx-auto w-full max-w-[520px] rounded-card bg-pitch p-4 text-white shadow-pop sm:p-6 xl:max-w-[min(520px,calc((100dvh_-_27rem)_*_0.6476_+_3rem))]"
    >
      {header}

      <LineupTeamBar
        team={top}
        allTeams={allTeams}
        onTeamChange={(id) => onPairChange('top', id)}
        playersById={playersById}
        onShuffle={editable ? () => onShuffleSpots(top.id) : undefined}
      />

      <div
        ref={setNodeRef}
        className={cn(
          'relative my-4 rounded-lg transition-shadow',
          active && 'ring-2 ring-white/15',
          isOver && 'ring-white/40',
        )}
        style={{ aspectRatio: `${PITCH_WIDTH} / ${PITCH_LENGTH}` }}
      >
        <PitchMarkings className="absolute inset-0 size-full" />
        {sides.map(([team, side]) =>
          Object.entries(team.positions ?? {}).map(([id, point]) => {
            const player = playersById.get(id);
            if (!player) return null;
            return (
              <LineupToken
                key={`${team.id}-${id}`}
                player={player}
                hex={TEAM_HEX[team.color]}
                at={toScreen(point, side)}
                editable={editable}
              />
            );
          }),
        )}
        {empty && editable && (
          <p className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-sm text-white/40">
            Перетягніть гравців сюди або натисніть «Перемішати»
          </p>
        )}
      </div>

      <LineupTeamBar
        team={bottom}
        allTeams={allTeams}
        onTeamChange={(id) => onPairChange('bottom', id)}
        playersById={playersById}
        onShuffle={editable ? () => onShuffleSpots(bottom.id) : undefined}
        mirrored
      />
    </section>
  );
}
