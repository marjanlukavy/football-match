import type { PlayerId } from '@futbol/shared/types';
import { pickRandom, shuffle, type Rng } from '@/lib/random';

export interface BalanceablePlayer {
  id: PlayerId;
  skill: number;
}

export interface BalanceOptions {
  teamCount: number;
  rng?: Rng;
  /** Скільки випадкових варіантів згенерувати перед вибором найкращого. */
  attempts?: number;
}

export interface BalanceResult {
  /** playerIds по командах. */
  teams: PlayerId[][];
  /** Сумарний рівень кожної команди. */
  totals: number[];
  /** Різниця між найсильнішою і найслабшою командою. */
  spread: number;
}

interface Bucket {
  players: BalanceablePlayer[];
  total: number;
}

/**
 * Наскільки сильно «розмивається» порядок за рівнем перед жеребкуванням.
 * 1.2 означає, що сусідні рівні (3 і 4) можуть мінятися місцями,
 * а 2 і 5 — ні. Це дає різні склади при кожному поділі без втрати балансу.
 */
const SKILL_NOISE = 1.2;
const DEFAULT_ATTEMPTS = 200;

/**
 * Рандомний поділ на збалансовані команди.
 *
 * 1. Кілька сотень разів будуємо жадібний розподіл: гравців у злегка
 *    перемішаному порядку за рівнем кладемо в найменшу, а серед рівних
 *    за розміром — у найслабшу команду.
 * 2. Кожен варіант доводимо обмінами гравців між командами, поки це
 *    зменшує дисперсію сумарних рівнів.
 * 3. Серед варіантів з мінімальною різницею сил вибираємо випадковий.
 *
 * Гарантії: кожен гравець рівно в одній команді, розміри команд
 * відрізняються не більше ніж на 1.
 */
export function balanceTeams(
  players: readonly BalanceablePlayer[],
  { teamCount, rng = Math.random, attempts = DEFAULT_ATTEMPTS }: BalanceOptions,
): BalanceResult {
  if (!Number.isInteger(teamCount) || teamCount < 2) {
    throw new RangeError('Команд має бути щонайменше дві');
  }
  if (players.length < teamCount) {
    throw new RangeError('Гравців менше, ніж команд');
  }

  let bestSpread = Infinity;
  const best = new Map<string, Bucket[]>();

  for (let i = 0; i < attempts; i++) {
    const buckets = improveBySwaps(greedyDraft(players, teamCount, rng), rng);
    const spread = spreadOf(buckets);

    if (spread < bestSpread) {
      bestSpread = spread;
      best.clear();
    }
    if (spread === bestSpread) best.set(canonicalKey(buckets), buckets);
  }

  const chosen = shuffle(pickRandom([...best.values()], rng), rng);
  const totals = chosen.map((b) => b.total);
  return {
    teams: chosen.map((b) => b.players.map((p) => p.id)),
    totals,
    spread: bestSpread,
  };
}

function greedyDraft(players: readonly BalanceablePlayer[], teamCount: number, rng: Rng): Bucket[] {
  const buckets: Bucket[] = Array.from({ length: teamCount }, () => ({ players: [], total: 0 }));

  const noisy = (p: BalanceablePlayer) => p.skill + (rng() - 0.5) * SKILL_NOISE;
  const order = players
    .map((p) => ({ p, key: noisy(p) }))
    .sort((a, b) => b.key - a.key)
    .map(({ p }) => p);

  for (const player of order) {
    const target = pickTarget(buckets, rng);
    target.players.push(player);
    target.total += player.skill;
  }
  return buckets;
}

function pickTarget(buckets: Bucket[], rng: Rng): Bucket {
  const minSize = Math.min(...buckets.map((b) => b.players.length));
  const candidates = buckets.filter((b) => b.players.length === minSize);
  const minTotal = Math.min(...candidates.map((b) => b.total));
  return pickRandom(
    candidates.filter((b) => b.total === minTotal),
    rng,
  );
}

/**
 * Локальний пошук: міняємо місцями двох гравців з різних команд, якщо це
 * зменшує різницю їхніх сумарних рівнів. Розміри команд при цьому не змінюються.
 */
function improveBySwaps(buckets: Bucket[], rng: Rng): Bucket[] {
  let improved = true;
  while (improved) {
    improved = false;
    const pairs = shuffle(teamPairs(buckets.length), rng);

    for (const [a, b] of pairs) {
      const A = buckets[a];
      const B = buckets[b];
      const diff = A.total - B.total;
      if (diff === 0) continue;

      for (let i = 0; i < A.players.length && !improved; i++) {
        for (let j = 0; j < B.players.length; j++) {
          const pa = A.players[i];
          const pb = B.players[j];
          const delta = pa.skill - pb.skill;
          // Обмін зсуває суми на delta; корисний, якщо |diff - 2·delta| < |diff|.
          if (Math.abs(diff - 2 * delta) < Math.abs(diff)) {
            A.players[i] = pb;
            B.players[j] = pa;
            A.total -= delta;
            B.total += delta;
            improved = true;
            break;
          }
        }
      }
      if (improved) break;
    }
  }
  return buckets;
}

function teamPairs(n: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) pairs.push([a, b]);
  return pairs;
}

function spreadOf(buckets: Bucket[]): number {
  const totals = buckets.map((b) => b.total);
  return Math.max(...totals) - Math.min(...totals);
}

/** Однаковий ключ для однакових розбиттів незалежно від порядку. */
function canonicalKey(buckets: Bucket[]): string {
  return buckets
    .map((b) => b.players.map((p) => p.id).sort().join(','))
    .sort()
    .join('|');
}

// ——— Статистика для UI ———

export interface TeamStats {
  count: number;
  total: number;
  average: number;
}

export function teamStats(playerIds: readonly PlayerId[], skillOf: (id: PlayerId) => number): TeamStats {
  const total = playerIds.reduce((sum, id) => sum + skillOf(id), 0);
  return {
    count: playerIds.length,
    total,
    average: playerIds.length ? total / playerIds.length : 0,
  };
}

export type BalanceQuality = 'perfect' | 'good' | 'uneven';

/** Оцінка балансу за різницею сумарних рівнів. */
export function balanceQuality(totals: readonly number[]): BalanceQuality {
  if (totals.length === 0) return 'perfect';
  const spread = Math.max(...totals) - Math.min(...totals);
  if (spread === 0) return 'perfect';
  if (spread <= 2) return 'good';
  return 'uneven';
}

export const BALANCE_QUALITY_LABELS: Record<BalanceQuality, string> = {
  perfect: 'Ідеальний баланс',
  good: 'Хороший баланс',
  uneven: 'Помітна різниця сил',
};
