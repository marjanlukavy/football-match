import { describe, expect, it } from 'vitest';
import { autoPositions, formationPoints, fromScreen, toScreen } from './formation';

describe('формація', () => {
  it('для будь-якої кількості гравців дає стільки ж різних місць у своїй половині', () => {
    for (let n = 0; n <= 12; n++) {
      const points = formationPoints(n);
      expect(points).toHaveLength(n);
      expect(new Set(points.map((p) => `${p.x}:${p.y}`)).size).toBe(n);
      for (const p of points) expect(p.y).toBeLessThan(50);
    }
  });

  it('перший — воротар біля своїх воріт; 8 гравців — 1-3-2-2', () => {
    const points = formationPoints(8);
    expect(points[0]).toEqual({ x: 50, y: 4 });
    const rows = new Map<number, number>();
    for (const p of points.slice(1)) rows.set(p.y, (rows.get(p.y) ?? 0) + 1);
    expect([...rows.values()]).toEqual([3, 2, 2]);
  });

  it('autoPositions ставить кожного гравця', () => {
    const positions = autoPositions(['a', 'b', 'c']);
    expect(Object.keys(positions).sort()).toEqual(['a', 'b', 'c']);
  });

  it('нижня команда дзеркальна, а перетворення екран ↔ команда взаємно обернені', () => {
    expect(toScreen({ x: 20, y: 10 }, 'bottom')).toEqual({ x: 80, y: 90 });
    expect(fromScreen(toScreen({ x: 20, y: 10 }, 'bottom'), 'bottom')).toEqual({ x: 20, y: 10 });
    // За бровку фішка не виходить.
    expect(fromScreen({ x: -10, y: 120 }, 'top')).toEqual({ x: 4, y: 97 });
  });
});
