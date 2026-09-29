import { addMinutes, isAfter, isBefore, isSameDay, parseISO } from 'date-fns';
import type { AttendanceStatus, Game, PlayerId, Registration } from './types';

export function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function gameEnd(startsAt: string, durationMin: number): Date {
  return addMinutes(toDate(startsAt), durationMin);
}

export type GamePhase = 'upcoming' | 'live' | 'finished';

export function getPhase(game: Game, now: Date = new Date()): GamePhase {
  const start = toDate(game.startsAt);
  if (isBefore(now, start)) return 'upcoming';
  if (isBefore(now, gameEnd(game.startsAt, game.durationMin))) return 'live';
  return 'finished';
}

/** Записуватись / змінювати статус можна лише до початку гри. */
export function isRegistrationOpen(game: Game, now: Date = new Date()): boolean {
  return getPhase(game, now) === 'upcoming';
}

export function isToday(game: Game, now: Date = new Date()): boolean {
  return isSameDay(toDate(game.startsAt), now);
}

export function getRegistration(game: Game, playerId: PlayerId | undefined): Registration | undefined {
  if (!playerId) return undefined;
  return game.registrations.find((r) => r.playerId === playerId);
}

export function getAttendees(game: Game, status: AttendanceStatus): Registration[] {
  return game.registrations
    .filter((r) => r.status === status)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}

export function confirmedCount(game: Game): number {
  return game.registrations.filter((r) => r.status === 'confirmed').length;
}

export function spotsLeft(game: Game): number {
  return Math.max(0, game.maxPlayers - confirmedCount(game));
}

export function isFull(game: Game): boolean {
  return spotsLeft(game) === 0;
}

/**
 * Чи може гравець поставити «точно буду».
 * Якщо він уже підтверджений — місце за ним і так зайняте.
 */
export function canConfirm(game: Game, playerId: PlayerId | undefined): boolean {
  if (!isRegistrationOpen(game)) return false;
  return getRegistration(game, playerId)?.status === 'confirmed' || !isFull(game);
}

/** Гравці, з яких формуються команди. */
export function getTeamPool(game: Game, includeMaybe: boolean): PlayerId[] {
  return game.registrations
    .filter((r) => r.status === 'confirmed' || (includeMaybe && r.status === 'maybe'))
    .map((r) => r.playerId);
}

/**
 * Склад записаних змінився після поділу на команди:
 * хтось новий записався або хтось із поділених відписався.
 */
export function areTeamsOutdated(game: Game): boolean {
  if (!game.teams) return false;
  const pool = new Set(getTeamPool(game, game.teams.includeMaybe));
  const drawn = game.teams.teams.flatMap((t) => t.playerIds);
  return drawn.length !== pool.size || drawn.some((id) => !pool.has(id));
}

export function sortByStart(games: readonly Game[]): Game[] {
  return [...games].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function upcomingGames(games: readonly Game[], now: Date = new Date()): Game[] {
  return sortByStart(games).filter((g) => isAfter(gameEnd(g.startsAt, g.durationMin), now));
}
