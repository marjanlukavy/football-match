import type { PitchPoint, PlayerId } from '@futbol/shared/types';
import { shuffle, type Rng } from '@/lib/random';

/** Верхня команда атакує вниз, нижня — вгору. */
export type PitchSide = 'top' | 'bottom';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Позиція в системі команди → відсотки на екрані (left/top). */
export function toScreen(point: PitchPoint, side: PitchSide): PitchPoint {
  return side === 'top' ? point : { x: 100 - point.x, y: 100 - point.y };
}

/** Відсотки на екрані → позиція в системі команди; фішка не вилазить за бровку. */
export function fromScreen(point: PitchPoint, side: PitchSide): PitchPoint {
  const own = side === 'top' ? point : { x: 100 - point.x, y: 100 - point.y };
  const round = (v: number) => Math.round(v * 10) / 10;
  return { x: round(clamp(own.x, 4, 96)), y: round(clamp(own.y, 3, 97)) };
}

/** Лінії від своїх воріт: 1–3 лінії польових гравців, задні — щільніші. */
const ROW_DEPTHS: Record<number, number[]> = {
  1: [24],
  2: [17, 33],
  3: [15, 28, 42],
};

/**
 * Типова схема на n гравців у своїй половині: воротар + лінії.
 * Напр. 8 гравців — 1-3-2-2, 6 — 1-3-2.
 */
export function formationPoints(count: number): PitchPoint[] {
  if (count <= 0) return [];
  const points: PitchPoint[] = [{ x: 50, y: 4 }];
  const field = count - 1;
  if (field === 0) return points;

  const rows = field <= 3 ? 1 : field <= 6 ? 2 : 3;
  const depths = ROW_DEPTHS[rows];
  let left = field;
  depths.forEach((y, i) => {
    // Решту ділимо порівну, «зайвих» — у задні лінії.
    const inRow = Math.ceil(left / (rows - i));
    left -= inRow;
    for (let k = 0; k < inRow; k++) {
      points.push({ x: Math.round(12 + ((k + 1) * 76) / (inRow + 1)), y });
    }
  });
  return points;
}

/** Розставляє всіх гравців за типовою схемою; із rng — у випадковому порядку. */
export function autoPositions(ids: readonly PlayerId[], rng?: Rng): Record<PlayerId, PitchPoint> {
  const order = rng ? shuffle(ids, rng) : ids;
  const points = formationPoints(order.length);
  return Object.fromEntries(order.map((id, i) => [id, points[i]]));
}
