import { TEAM_PRESETS } from '@futbol/shared/constants';
import type { Player, PlayerId, Team } from '@futbol/shared/types';
import type { Rng } from '@/lib/random';
import { balanceTeams } from './balanceTeams';

/** Ділить гравців на команди й одразу дає їм назви/кольори манішок. */
export function drawTeams(players: readonly Player[], teamCount: number, rng?: Rng): Team[] {
  const { teams } = balanceTeams(players, { teamCount, rng });
  const byId = new Map(players.map((p) => [p.id, p]));

  return teams.map((ids, index) => {
    const preset = TEAM_PRESETS[index % TEAM_PRESETS.length];
    return {
      id: preset.color,
      name: preset.name,
      color: preset.color,
      playerIds: sortLineup(ids, byId),
    };
  });
}

/** Порядок у складі: від найсильнішого до найслабшого, однакові — за іменем. */
export function sortLineup(ids: readonly PlayerId[], byId: ReadonlyMap<PlayerId, Player>): PlayerId[] {
  return [...ids].sort((a, b) => {
    const pa = byId.get(a);
    const pb = byId.get(b);
    if (!pa || !pb) return pa ? -1 : pb ? 1 : 0;
    return pb.skill - pa.skill || pa.name.localeCompare(pb.name, 'uk');
  });
}
