import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarX } from 'lucide-react';
import { ApiError, getErrorMessage } from '@/api';
import { useGame, useIsAdmin, useMe, usePlayers, usePlayersById } from '@/api/hooks';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/States';
import { DutiesCard } from '@/features/games/DutiesCard';
import { GameHero } from '@/features/games/GameHero';
import { MyParticipationCard } from '@/features/games/MyParticipationCard';
import { ParticipantsCard } from '@/features/games/ParticipantsCard';
import { TeamsSection } from '@/features/teams/TeamsSection';

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3.5 py-1.5 text-sm font-semibold text-ink/70 ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white hover:text-ink"
    >
      <ArrowLeft className="size-4" />
      Календар
    </Link>
  );
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const gameQuery = useGame(gameId);
  const playersQuery = usePlayers();
  const playersById = usePlayersById();
  const meId = useMe().data?.id;
  const isAdmin = useIsAdmin();

  if (gameQuery.isPending || playersQuery.isPending) return <PageLoader />;

  if (gameQuery.isError || playersQuery.isError) {
    const error = gameQuery.error ?? playersQuery.error;
    const notFound = error instanceof ApiError && error.code === 'NOT_FOUND';
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          {notFound ? (
            <EmptyState
              icon={<CalendarX className="size-6" />}
              title="Гру не знайдено"
              description="Можливо, її скасували або посилання застаріло."
              action={
                <Link to="/" className="text-sm font-semibold text-accent hover:underline">
                  До календаря
                </Link>
              }
            />
          ) : (
            <ErrorState
              message={getErrorMessage(error)}
              onRetry={() => {
                void gameQuery.refetch();
                void playersQuery.refetch();
              }}
            />
          )}
        </Card>
      </div>
    );
  }

  const game = gameQuery.data;

  return (
    <div className="space-y-8">
      <BackLink />

      {/* Мобільний порядок: hero → моя участь і обов'язки → учасники. */}
      <div className="grid gap-5 [grid-template-areas:'hero'_'aside'_'people'] lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'hero_aside'_'people_aside']">
        <div className="[grid-area:hero]">
          <GameHero game={game} isAdmin={isAdmin} />
        </div>
        <aside className="space-y-5 [grid-area:aside] lg:self-start">
          <MyParticipationCard game={game} meId={meId} />
          <DutiesCard game={game} meId={meId} isAdmin={isAdmin} playersById={playersById} />
        </aside>
        <div className="[grid-area:people]">
          <ParticipantsCard game={game} meId={meId} playersById={playersById} />
        </div>
      </div>

      <TeamsSection key={game.id} game={game} meId={meId} isAdmin={isAdmin} playersById={playersById} />
    </div>
  );
}
