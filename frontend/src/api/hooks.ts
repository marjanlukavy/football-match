import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  AttendanceStatus,
  DutyKind,
  Game,
  GameId,
  GameInput,
  LoginInput,
  Me,
  PasswordChangeInput,
  Player,
  PlayerId,
  PlayerPatch,
  ProfilePatch,
  RegisterInput,
  TeamsDrawInput,
} from '@futbol/shared/types';
import { api, getErrorMessage, type GamesQuery } from './index';

export const queryKeys = {
  me: ['me'] as const,
  players: ['players'] as const,
  games: ['games'] as const,
  gameList: (query: GamesQuery = {}) => ['games', 'list', query] as const,
  game: (id: GameId) => ['games', 'detail', id] as const,
  registration: (inviteCode: string | undefined) => ['registration', inviteCode ?? ''] as const,
  invite: ['invite'] as const,
};

// ——— Запити ———

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: api.getMe, staleTime: Infinity });
}

export function usePlayers() {
  return useQuery({ queryKey: queryKeys.players, queryFn: api.listPlayers, staleTime: 60_000 });
}

/** Map id → гравець; порожня мапа, поки дані вантажаться. */
export function usePlayersById(): ReadonlyMap<PlayerId, Player> {
  const { data } = usePlayers();
  return useMemo(() => new Map((data ?? []).map((p) => [p.id, p])), [data]);
}

export function useGames(query: GamesQuery = {}) {
  return useQuery({
    queryKey: queryKeys.gameList(query),
    queryFn: () => api.listGames(query),
    placeholderData: keepPreviousData,
  });
}

export function useGame(id: GameId | undefined) {
  return useQuery({
    queryKey: queryKeys.game(id ?? ''),
    queryFn: () => api.getGame(id!),
    enabled: Boolean(id),
  });
}

/** Чи поточний гравець — організатор. */
export function useIsAdmin(): boolean {
  return useMe().data?.role === 'admin';
}

// ——— Мутації ———

/**
 * Кладемо свіжу гру в кеш деталей і одразу підміняємо її в усіх списках,
 * щоб календар оновився без очікування; потім списки перезапитуються у фоні.
 */
function syncGame(client: QueryClient, game: Game) {
  client.setQueryData(queryKeys.game(game.id), game);
  client.setQueriesData<Game[]>({ queryKey: ['games', 'list'] }, (list) =>
    list?.map((g) => (g.id === game.id ? game : g)),
  );
  void client.invalidateQueries({ queryKey: ['games', 'list'] });
}

const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function useSetAttendance(gameId: GameId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (status: AttendanceStatus) => api.setAttendance(gameId, status),
    onSuccess: (game, status) => {
      syncGame(client, game);
      toast.success(status === 'confirmed' ? 'Чекаємо на полі!' : 'Відмітили як «можливо»');
    },
    onError,
  });
}

export function useCancelAttendance(gameId: GameId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.cancelAttendance(gameId),
    onSuccess: (game) => {
      syncGame(client, game);
      toast('Ви відписались від гри');
    },
    onError,
  });
}

export function useSetDuty(gameId: GameId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, playerId }: { kind: DutyKind; playerId: PlayerId | null }) =>
      api.setDuty(gameId, kind, playerId),
    onSuccess: (game) => syncGame(client, game),
    onError,
  });
}

export function useSaveTeams(gameId: GameId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draw: TeamsDrawInput) => api.saveTeams(gameId, draw),
    onSuccess: (game) => {
      syncGame(client, game);
      toast.success('Склади збережено');
    },
    onError,
  });
}

export function useClearTeams(gameId: GameId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.clearTeams(gameId),
    onSuccess: (game) => syncGame(client, game),
    onError,
  });
}

export function useCreateGame() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: GameInput) => api.createGame(input),
    onSuccess: (game) => {
      syncGame(client, game);
      toast.success('Гру створено');
    },
    onError,
  });
}

export function useUpdateGame(gameId: GameId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: GameInput) => api.updateGame(gameId, input),
    onSuccess: (game) => {
      syncGame(client, game);
      toast.success('Зміни збережено');
    },
    onError,
  });
}

export function useDeleteGame() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: GameId) => api.deleteGame(id),
    onSuccess: (_void, id) => {
      // Кеш деталей не чистимо: сторінка гри ще змонтована і блимнула б «не знайдено»
      // перед переходом. Списки ж оновлюємо одразу.
      client.setQueriesData<Game[]>({ queryKey: ['games', 'list'] }, (list) => list?.filter((g) => g.id !== id));
      void client.invalidateQueries({ queryKey: ['games', 'list'] });
      toast('Гру видалено');
    },
    onError,
  });
}

export function useUpdatePlayer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: PlayerId; patch: PlayerPatch }) => api.updatePlayer(id, patch),
    onSuccess: (player) => {
      client.setQueryData<Player[]>(queryKeys.players, (list) =>
        list?.map((p) => (p.id === player.id ? player : p)),
      );
      client.setQueryData<Me | null>(queryKeys.me, (me) => (me && me.id === player.id ? { ...me, ...player } : me));
    },
    onError,
  });
}

// ——— Авторизація ———

/**
 * Вхід під іншим користувачем: кеш попереднього (ігри, гравці) більше не актуальний.
 * Скидаємо все, крім щойно отриманого «я».
 */
function startSession(client: QueryClient, me: Me | null) {
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.me[0] });
  client.setQueryData(queryKeys.me, me);
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.login(input),
    onSuccess: (me) => startSession(client, me),
  });
}

export function useRegister() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => api.register(input),
    onSuccess: (me) => {
      startSession(client, me);
      toast.success(`Вітаємо в команді, ${me.name}!`);
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      startSession(client, null);
      // Сам на /login і без «звідки прийшов»: наступний, хто увійде, почне з календаря.
      navigate('/login', { replace: true });
    },
    onError,
  });
}

export function useRegistrationStatus(inviteCode: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.registration(inviteCode),
    queryFn: () => api.getRegistrationStatus(inviteCode),
    enabled,
  });
}

export function useInvite() {
  return useQuery({ queryKey: queryKeys.invite, queryFn: api.getInvite, staleTime: Infinity });
}

export function useRegenerateInvite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.regenerateInvite(),
    onSuccess: (invite) => {
      client.setQueryData(queryKeys.invite, invite);
      toast.success('Нове посилання готове, старе більше не працює');
    },
    onError,
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => api.updateProfile(patch),
    onSuccess: (me) => {
      client.setQueryData(queryKeys.me, me);
      client.setQueryData<Player[]>(queryKeys.players, (list) =>
        list?.map((p) => (p.id === me.id ? { ...p, name: me.name } : p)),
      );
      toast.success('Профіль збережено');
    },
    onError,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordChangeInput) => api.changePassword(input),
    onSuccess: () => toast.success('Пароль змінено. На інших пристроях потрібно увійти знову'),
  });
}
