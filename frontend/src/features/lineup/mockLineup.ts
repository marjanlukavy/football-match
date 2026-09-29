/**
 * Статичні дані для сторінки розстановки — поки без зв'язку з грою.
 * Координати слотів — у відсотках від ширини/висоти поля (команда A зверху).
 */

export type LineupSide = 'a' | 'b';

export interface LineupPlayer {
  id: string;
  name: string;
}

export interface LineupSlot {
  id: string;
  x: number;
  y: number;
  player?: LineupPlayer;
}

export interface LineupTeam {
  side: LineupSide;
  label: string;
  name: string;
  slots: LineupSlot[];
}

export const LINEUP_GAME = {
  title: 'Розстановка',
  subtitle: 'Чт, 24 вересня · 19:30 · Манеж «Арена»',
};

const player = (id: string, name: string): LineupPlayer => ({ id, name });

/** Схема 1-3-2-2 (8 на 8), дзеркальна для команди B. */
const FORMATION: { x: number; y: number }[] = [
  { x: 50, y: 4 },
  { x: 19, y: 15 },
  { x: 50, y: 15 },
  { x: 81, y: 15 },
  { x: 30, y: 25 },
  { x: 70, y: 25 },
  { x: 37, y: 40 },
  { x: 63, y: 40 },
];

function place(side: LineupSide, players: (LineupPlayer | undefined)[]): LineupSlot[] {
  return FORMATION.map(({ x, y }, i) => ({
    id: `${side}${i}`,
    x: side === 'a' ? x : 100 - x,
    y: side === 'a' ? y : 100 - y,
    player: players[i],
  }));
}

export const LINEUP_TEAMS: [LineupTeam, LineupTeam] = [
  {
    side: 'a',
    label: 'A',
    name: 'Сині',
    slots: place('a', [
      player('p2', 'Богдан Шевчук'),
      player('p6', 'Олег Кравчук'),
      undefined,
      player('p3', 'Віталій Бондар'),
      player('p1', 'Андрій Коваленко'),
      undefined,
      undefined,
      player('p4', 'Дмитро Ткаченко'),
    ]),
  },
  {
    side: 'b',
    label: 'B',
    name: 'Червоні',
    slots: place('b', [
      player('p11', 'Роман Олійник'),
      player('p13', 'Тарас Литвин'),
      player('p12', 'Сергій Мороз'),
      player('p9', 'Назар Лисенко'),
      player('p8', 'Максим Поліщук'),
      undefined,
      player('p10', 'Остап Гнатюк'),
      player('p7', 'Ігор Савчук'),
    ]),
  },
];
