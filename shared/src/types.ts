export type PlayerId = string;
export type GameId = string;

export type Role = 'admin' | 'player';
/** Рівень гри: 1 — новачок, 5 — найсильніший у компанії. */
export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export interface Player {
  id: PlayerId;
  name: string;
  skill: SkillLevel;
  role: Role;
}

export type AttendanceStatus = 'confirmed' | 'maybe';

export interface Registration {
  playerId: PlayerId;
  status: AttendanceStatus;
  updatedAt: string;
}

/** Хто що приносить на гру. */
export type DutyKind = 'ball' | 'bibs';

export interface GameLocation {
  name: string;
  address: string;
}

export type TeamColor = 'orange' | 'blue' | 'white' | 'yellow';

/**
 * Місце гравця на полі у відсотках від своїх воріт:
 * x — зліва направо (0–100), y — від власної лінії воріт до чужої (0–100).
 */
export interface PitchPoint {
  x: number;
  y: number;
}

export interface Team {
  id: string;
  name: string;
  color: TeamColor;
  playerIds: PlayerId[];
  /** Розстановка на полі; гравець без позиції — у запасі. */
  positions?: Record<PlayerId, PitchPoint>;
}

export interface TeamsDraw {
  teams: Team[];
  /** Чи брали до поділу гравців зі статусом «можливо». */
  includeMaybe: boolean;
  createdAt: string;
  createdBy: PlayerId;
}

export interface Game {
  id: GameId;
  /** ISO-дата і час початку. */
  startsAt: string;
  durationMin: number;
  location: GameLocation;
  maxPlayers: number;
  teamCount: number;
  notes: string;
  registrations: Registration[];
  duties: Record<DutyKind, PlayerId | null>;
  teams: TeamsDraw | null;
}

/** Поля, які адмін задає при створенні/редагуванні гри. */
export type GameInput = Pick<
  Game,
  'startsAt' | 'durationMin' | 'location' | 'maxPlayers' | 'teamCount' | 'notes'
>;

export type PlayerPatch = Partial<Pick<Player, 'skill' | 'role'>>;

/** Поточний користувач: гравець плюс його логін. */
export interface Me extends Player {
  login: string;
}

export interface LoginInput {
  login: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  /** Код із посилання-запрошення; не потрібен лише найпершому користувачу. */
  inviteCode?: string;
}

/** Чи можна зареєструватись з цим кодом (або без коду — на порожній базі). */
export interface RegistrationStatus {
  open: boolean;
}

export interface Invite {
  code: string;
  createdAt: string;
}

/** Що користувач може змінити у своєму профілі. */
export interface ProfilePatch {
  name: string;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

export interface TeamsDrawInput {
  teams: Team[];
  includeMaybe: boolean;
}
