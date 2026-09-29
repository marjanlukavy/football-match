import type {
  AttendanceStatus,
  DutyKind,
  Game,
  GameId,
  GameInput,
  Invite,
  LoginInput,
  Me,
  PasswordChangeInput,
  Player,
  PlayerId,
  PlayerPatch,
  ProfilePatch,
  RegisterInput,
  RegistrationStatus,
  TeamsDrawInput,
} from '@futbol/shared/types';

export interface GamesQuery {
  /** ISO, включно. */
  from?: string;
  /** ISO, не включно. */
  to?: string;
}

/**
 * Контракт з бекендом (реалізація — `httpApi`).
 * Дії виконуються від імені користувача поточної сесії (cookie).
 */
export interface Api {
  /** null — ніхто не увійшов. */
  getMe(): Promise<Me | null>;
  login(input: LoginInput): Promise<Me>;
  register(input: RegisterInput): Promise<Me>;
  logout(): Promise<void>;
  updateProfile(patch: ProfilePatch): Promise<Me>;
  changePassword(input: PasswordChangeInput): Promise<void>;
  /** Чи відкрита реєстрація з цим кодом запрошення. */
  getRegistrationStatus(inviteCode?: string): Promise<RegistrationStatus>;

  /** Лише для організатора. */
  getInvite(): Promise<Invite>;
  regenerateInvite(): Promise<Invite>;

  listPlayers(): Promise<Player[]>;
  updatePlayer(id: PlayerId, patch: PlayerPatch): Promise<Player>;

  listGames(query?: GamesQuery): Promise<Game[]>;
  getGame(id: GameId): Promise<Game>;
  createGame(input: GameInput): Promise<Game>;
  updateGame(id: GameId, input: GameInput): Promise<Game>;
  deleteGame(id: GameId): Promise<void>;

  setAttendance(gameId: GameId, status: AttendanceStatus): Promise<Game>;
  cancelAttendance(gameId: GameId): Promise<Game>;
  /** playerId = null — звільнити обов'язок. */
  setDuty(gameId: GameId, kind: DutyKind, playerId: PlayerId | null): Promise<Game>;

  saveTeams(gameId: GameId, draw: TeamsDrawInput): Promise<Game>;
  clearTeams(gameId: GameId): Promise<Game>;
}
