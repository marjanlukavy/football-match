import type { AttendanceStatus, DutyKind, SkillLevel, TeamColor } from './types';

export const SKILL_LEVELS: readonly SkillLevel[] = [1, 2, 3, 4, 5];

export const SKILL_LABELS: Record<SkillLevel, string> = {
  1: 'Новачок',
  2: 'Аматор',
  3: 'Середній',
  4: 'Сильний',
  5: 'Профі',
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  confirmed: 'Точно буду',
  maybe: 'Можливо не зможу',
};

export const DUTY_LABELS: Record<DutyKind, string> = {
  ball: "М'яч",
  bibs: 'Манішки',
};

export const DUTY_KINDS: readonly DutyKind[] = ['ball', 'bibs'];

export interface TeamPreset {
  color: TeamColor;
  name: string;
  /** Колір манішки для UI. */
  hex: string;
}

export const TEAM_PRESETS: readonly TeamPreset[] = [
  { color: 'orange', name: 'Помаранчеві', hex: '#fb923c' },
  { color: 'blue', name: 'Сині', hex: '#60a5fa' },
  { color: 'white', name: 'Білі', hex: '#e5e7eb' },
  { color: 'yellow', name: 'Жовті', hex: '#facc15' },
];

export const TEAM_HEX: Record<TeamColor, string> = Object.fromEntries(
  TEAM_PRESETS.map((p) => [p.color, p.hex]),
) as Record<TeamColor, string>;

export const MIN_TEAMS = 2;
export const MAX_TEAMS = TEAM_PRESETS.length;
/** Мінімум гравців у команді, щоб поділ мав сенс. */
export const MIN_PLAYERS_PER_TEAM = 2;

export const DEFAULT_GAME_DURATION_MIN = 90;
export const DEFAULT_MAX_PLAYERS = 14;

export const LOGIN_MIN = 3;
export const LOGIN_MAX = 32;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 60;
/** Рівень, з яким новий гравець з'являється в компанії; далі його змінює організатор. */
export const DEFAULT_SKILL: SkillLevel = 3;

export const GAME_DURATION_MIN = 30;
export const GAME_DURATION_MAX = 240;
export const MAX_PLAYERS_LIMIT = 40;
export const NOTES_MAX_LENGTH = 300;
export const LOCATION_NAME_MAX = 80;
export const LOCATION_ADDRESS_MAX = 120;
