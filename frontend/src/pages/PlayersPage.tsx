import { useMemo, useState, type ReactNode } from 'react';
import { Info, SearchX } from 'lucide-react';
import { useIsAdmin, useMe, usePlayers } from '@/api/hooks';
import { getErrorMessage } from '@/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkillMeter } from '@/components/ui/SkillMeter';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/States';
import { SKILL_LABELS } from '@futbol/shared/constants';
import type { Player, SkillLevel } from '@futbol/shared/types';
import {
  applyPlayerFilters,
  INITIAL_FILTERS,
  PlayerFilters,
  type PlayerFilterState,
} from '@/features/players/PlayerFilters';
import { InviteCard } from '@/features/players/InviteCard';
import { PlayerRow, playerGridClass } from '@/features/players/PlayerRow';
import { SkillDistribution } from '@/features/players/SkillDistribution';
import { useGamesPlayed } from '@/features/players/useGamesPlayed';
import { cn } from '@/lib/cn';
import { plural, PLAYER_FORMS } from '@/lib/plural';

const ORGANIZER_FORMS = ['організатор', 'організатори', 'організаторів'] as const;

export default function PlayersPage() {
  const { data: players, isPending, isError, error, refetch } = usePlayers();
  const { data: me } = useMe();
  const isAdmin = useIsAdmin();
  const gamesPlayed = useGamesPlayed();
  const [filters, setFilters] = useState<PlayerFilterState>(INITIAL_FILTERS);

  const visible = useMemo(() => applyPlayerFilters(players ?? [], filters), [players, filters]);

  if (isPending) return <PageLoader />;
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <div className="flex animate-fade-up flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Гравці</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          {players.length} {plural(players.length, PLAYER_FORMS)} у компанії. Рівень гри враховується під час
          поділу на команди, щоб склади виходили рівними.
        </p>
      </header>

      {isAdmin && <InviteCard />}

      <SummaryCards players={players} />

      {isAdmin && (
        <p className="flex items-start gap-2.5 rounded-2xl bg-white/55 px-4 py-3 text-sm text-ink/75 ring-1 ring-black/5 backdrop-blur">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" />
          Рівень і права гравців змінюються прямо в списку.
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-line p-4 sm:px-6">
          <PlayerFilters value={filters} onChange={setFilters} />
        </div>

        {visible.length > 0 ? (
          <>
            <div
              className={cn(
                'hidden px-6 py-2.5 text-[11px] font-semibold tracking-wide text-subtle uppercase',
                playerGridClass(isAdmin),
              )}
            >
              <span>Гравець</span>
              <span>Рівень</span>
              <span>Зіграно</span>
              {isAdmin && <span className="text-right">Права</span>}
            </div>
            <ul className="divide-y divide-line">
              {visible.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isMe={player.id === me?.id}
                  editable={isAdmin}
                  gamesPlayed={gamesPlayed.get(player.id) ?? 0}
                />
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="Нікого не знайдено"
            description="Спробуйте інше ім'я."
            action={
              <Button size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
                Очистити пошук
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
}

function SummaryCards({ players }: { players: readonly Player[] }) {
  const organizers = players.filter((p) => p.role === 'admin').length;
  const average = players.length ? players.reduce((sum, p) => sum + p.skill, 0) / players.length : 0;
  const roundedAverage = Math.min(5, Math.max(1, Math.round(average))) as SkillLevel;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.6fr]">
      <StatCard label="Усього в складі" value={players.length}>
        {organizers} {plural(organizers, ORGANIZER_FORMS)}
      </StatCard>
      <StatCard
        label="Середній рівень"
        value={average.toLocaleString('uk-UA', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      >
        {players.length > 0 && <SkillMeter value={roundedAverage} />}
        <span>{players.length > 0 ? SKILL_LABELS[roundedAverage] : '—'}</span>
      </StatCard>
      <Card className="p-5 sm:col-span-2 lg:col-span-1">
        <SkillDistribution players={players} />
      </Card>
    </section>
  );
}

function StatCard({ label, value, children }: { label: string; value: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col p-5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="mt-2 text-4xl font-bold tracking-tight text-ink tabular-nums">{value}</span>
      <span className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted">{children}</span>
    </Card>
  );
}
