import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { subDays } from 'date-fns';
import { ArrowUpRight, LandPlot, Pencil, Plus } from 'lucide-react';
import { useGames, useIsAdmin, usePlayers, usePlayersById } from '@/api/hooks';
import { getErrorMessage } from '@/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/States';
import { confirmedCount, gameEnd, sortByStart } from '@futbol/shared/game';
import type { Game } from '@futbol/shared/types';
import { GameFormModal } from '@/features/games/GameFormModal';
import { LineupBoard } from '@/features/lineup/LineupBoard';
import { capitalize, fmt } from '@/lib/date';

/** Ігри за останній місяць і всі майбутні. */
const FROM = subDays(new Date(), 30).toISOString();

const gameLabel = (game: Game) => `${capitalize(fmt(game.startsAt, 'EEEEEE, d MMMM · HH:mm'))} · ${game.location.name}`;

/** Найближча гра, що ще не закінчилась; якщо таких немає — остання. */
function defaultGame(games: readonly Game[]): Game | undefined {
  const now = Date.now();
  return games.find((g) => gameEnd(g.startsAt, g.durationMin).getTime() > now) ?? games.at(-1);
}

/** Хто де грає: вибір гри, склади команд і розстановка на полі. */
export default function LineupPage() {
  const [params, setParams] = useSearchParams();
  const gamesQuery = useGames({ from: FROM });
  const playersQuery = usePlayers();
  const playersById = usePlayersById();
  const isAdmin = useIsAdmin();
  const [form, setForm] = useState<'create' | 'edit' | null>(null);

  const games = useMemo(() => sortByStart(gamesQuery.data ?? []), [gamesQuery.data]);
  const game = games.find((g) => g.id === params.get('game')) ?? defaultGame(games);
  const selectGame = (id: string) => setParams({ game: id }, { replace: true });

  if (gamesQuery.isPending || playersQuery.isPending) return <PageLoader />;
  if (gamesQuery.isError || playersQuery.isError) {
    const error = gamesQuery.error ?? playersQuery.error;
    return (
      <ErrorState
        message={getErrorMessage(error)}
        onRetry={() => {
          void gamesQuery.refetch();
          void playersQuery.refetch();
        }}
      />
    );
  }

  const pitchHeader = game && (
    <header className="mb-5 text-center">
      <h1 className="text-base font-semibold">Розстановка</h1>
      <p className="truncate text-xs text-white/50">{gameLabel(game)}</p>
    </header>
  );

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
        {games.length > 0 && game ? (
          <>
            <Select
              ariaLabel="Гра"
              value={game.id}
              onValueChange={selectGame}
              options={games.map((g) => ({ value: g.id, label: gameLabel(g) }))}
              className="max-w-full min-w-0 flex-1 basis-64 sm:flex-none"
            />
            <span className="px-1 text-sm text-muted">
              Записались {confirmedCount(game)} з {game.maxPlayers}
            </span>
          </>
        ) : (
          <p className="px-1 text-sm text-muted">Ігор ще немає</p>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {game && (
            <Link
              to={`/games/${game.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-ink/70 transition-colors hover:bg-black/5 hover:text-ink"
            >
              <ArrowUpRight className="size-3.5" />
              Сторінка гри
            </Link>
          )}
          {isAdmin && game && (
            <Button size="sm" variant="soft" icon={<Pencil className="size-3.5" />} onClick={() => setForm('edit')}>
              Учасники й гра
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" variant="primary" icon={<Plus className="size-3.5" />} onClick={() => setForm('create')}>
              Нова гра
            </Button>
          )}
        </div>
      </Card>

      {game ? (
        <LineupBoard
          key={`${game.id}-${game.teamCount}`}
          game={game}
          players={playersQuery.data}
          playersById={playersById}
          editable={isAdmin}
          pitchHeader={pitchHeader}
          onEditGame={() => setForm('edit')}
        />
      ) : (
        <Card>
          <EmptyState
            icon={<LandPlot className="size-6" />}
            title="Немає гри для розстановки"
            description={isAdmin ? 'Створіть гру — і розставте команди на полі.' : 'Організатор ще не створив жодної гри.'}
          />
        </Card>
      )}

      <GameFormModal
        open={form !== null}
        onClose={() => setForm(null)}
        game={form === 'edit' ? game : undefined}
        onSaved={(saved) => selectGame(saved.id)}
      />
    </div>
  );
}
