import { describe, expect, it } from 'vitest';
import { TEAM_PRESETS } from '@futbol/shared/constants';
import type { Player, SkillLevel } from '@futbol/shared/types';
import { createRng } from '@/lib/random';
import { balanceQuality, balanceTeams, teamStats, type BalanceablePlayer } from './balanceTeams';
import { drawTeams } from './drawTeams';

const makePlayers = (skills: number[]): BalanceablePlayer[] =>
  skills.map((skill, i) => ({ id: `p${i + 1}`, skill }));

const toPlayer = (p: BalanceablePlayer): Player => ({
  id: p.id,
  name: `Гравець ${p.id}`,
  skill: p.skill as SkillLevel,
  role: 'player',
});

const ROSTER = makePlayers([5, 4, 4, 3, 3, 3, 2, 2, 1, 5, 4, 3, 3, 2, 1, 4]);

describe('balanceTeams', () => {
  it.each([2, 3, 4])('кожен гравець рівно в одній команді (%i команд)', (teamCount) => {
    const { teams } = balanceTeams(ROSTER, { teamCount, rng: createRng(1) });
    const ids = teams.flat();

    expect(teams).toHaveLength(teamCount);
    expect(ids).toHaveLength(ROSTER.length);
    expect(new Set(ids)).toEqual(new Set(ROSTER.map((p) => p.id)));
  });

  it.each([
    [11, 2],
    [13, 3],
    [15, 4],
  ])('розміри команд відрізняються не більше ніж на 1 (%i гравців, %i команд)', (count, teamCount) => {
    const players = makePlayers(Array.from({ length: count }, (_, i) => (i % 5) + 1));
    const { teams } = balanceTeams(players, { teamCount, rng: createRng(7) });
    const sizes = teams.map((t) => t.length);

    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it('знаходить ідеальний баланс, коли він існує', () => {
    const players = makePlayers([5, 5, 4, 4, 3, 3, 2, 2, 1, 1]);
    const result = balanceTeams(players, { teamCount: 2, rng: createRng(42) });

    expect(result.spread).toBe(0);
    expect(result.totals).toEqual([15, 15]);
  });

  it('повертає суми, узгоджені зі складами', () => {
    const skill = new Map(ROSTER.map((p) => [p.id, p.skill]));
    const { teams, totals, spread } = balanceTeams(ROSTER, { teamCount: 3, rng: createRng(3) });

    expect(totals).toEqual(teams.map((ids) => teamStats(ids, (id) => skill.get(id)!).total));
    expect(spread).toBe(Math.max(...totals) - Math.min(...totals));
  });

  it('дає різні склади для різних сідів, але однакові — для однакових', () => {
    const lineup = (seed: number) =>
      balanceTeams(ROSTER, { teamCount: 2, rng: createRng(seed) })
        .teams.map((ids) => [...ids].sort().join(','))
        .sort()
        .join('|');

    const distinct = new Set(Array.from({ length: 10 }, (_, i) => lineup(i + 1)));
    expect(distinct.size).toBeGreaterThan(1);
    expect(lineup(5)).toBe(lineup(5));
  });

  it('кидає RangeError на некоректні вхідні дані', () => {
    expect(() => balanceTeams(ROSTER, { teamCount: 1 })).toThrow(RangeError);
    expect(() => balanceTeams(ROSTER, { teamCount: 2.5 })).toThrow(RangeError);
    expect(() => balanceTeams(makePlayers([3, 3]), { teamCount: 3 })).toThrow(RangeError);
  });
});

describe('balanceQuality', () => {
  it('оцінює баланс за різницею сумарних рівнів', () => {
    expect(balanceQuality([])).toBe('perfect');
    expect(balanceQuality([12, 12])).toBe('perfect');
    expect(balanceQuality([12, 13])).toBe('good');
    expect(balanceQuality([12, 14, 13])).toBe('good');
    expect(balanceQuality([12, 15])).toBe('uneven');
  });
});

describe('teamStats', () => {
  it('рахує кількість, суму і середнє', () => {
    const skill = { a: 5, b: 3, c: 1 } as Record<string, number>;
    expect(teamStats(['a', 'b', 'c'], (id) => skill[id])).toEqual({ count: 3, total: 9, average: 3 });
    expect(teamStats([], () => 0)).toEqual({ count: 0, total: 0, average: 0 });
  });
});

describe('drawTeams', () => {
  it('дає командам назви й кольори манішок з пресетів', () => {
    const teams = drawTeams(ROSTER.map(toPlayer), 3, createRng(11));

    expect(teams.map((t) => t.name)).toEqual(TEAM_PRESETS.slice(0, 3).map((p) => p.name));
    expect(teams.map((t) => t.color)).toEqual(TEAM_PRESETS.slice(0, 3).map((p) => p.color));
    expect(new Set(teams.map((t) => t.id)).size).toBe(3);
  });

  it('сортує склад за рівнем від найсильнішого', () => {
    const teams = drawTeams(ROSTER.map(toPlayer), 2, createRng(9));
    const skill = new Map(ROSTER.map((p) => [p.id, p.skill]));

    for (const team of teams) {
      const skills = team.playerIds.map((id) => skill.get(id)!);
      expect(skills).toEqual([...skills].sort((a, b) => b - a));
    }
  });
});
