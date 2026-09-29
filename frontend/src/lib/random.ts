/** Генератор випадкових чисел у діапазоні [0, 1). */
export type Rng = () => number;

/** Детермінований генератор (mulberry32) — для сідів і тестів. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates; повертає нову копію масиву. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandom<T>(items: readonly T[], rng: Rng = Math.random): T {
  if (items.length === 0) throw new RangeError('pickRandom: порожній масив');
  return items[Math.floor(rng() * items.length)];
}

export function randomId(prefix = ''): string {
  const id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return prefix ? `${prefix}_${id}` : id;
}
