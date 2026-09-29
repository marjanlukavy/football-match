import { useState } from 'react';
import { Dices, RotateCcw, Save, Shuffle, Swords, TriangleAlert, X } from 'lucide-react';
import { useClearTeams, useSaveTeams } from '@/api/hooks';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { areTeamsOutdated, getAttendees, getPhase } from '@futbol/shared/game';
import type { Game, Player, PlayerId, Team } from '@futbol/shared/types';
import { ConfirmModal } from '@/features/games/ConfirmModal';
import { cn } from '@/lib/cn';
import { fmt } from '@/lib/date';
import { PLAYER_FORMS, plural } from '@/lib/plural';
import { BalanceSummary } from './BalanceSummary';
import { DrawSettings } from './DrawSettings';
import { TeamCard } from './TeamCard';
import { useTeamsDraft, type TeamsDraft } from './useTeamsDraft';

interface TeamsSectionProps {
  game: Game;
  meId: PlayerId | undefined;
  isAdmin: boolean;
  playersById: ReadonlyMap<PlayerId, Player>;
}

const GRID_COLS: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 xl:grid-cols-3',
  4: 'md:grid-cols-2 xl:grid-cols-4',
};

export function TeamsSection({ game, meId, isAdmin, playersById }: TeamsSectionProps) {
  const draft = useTeamsDraft(game, playersById);
  const save = useSaveTeams(game.id);
  const clear = useClearTeams(game.id);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const canManage = isAdmin && getPhase(game) !== 'finished';
  const saved = game.teams;
  const isDraft = draft.draft !== null;
  const shown = draft.draft ?? saved?.teams ?? null;
  const outdated = !isDraft && areTeamsOutdated(game);
  const maybeCount = getAttendees(game, 'maybe').length;

  const saveDraft = () => {
    if (!draft.draft) return;
    save.mutate({ teams: draft.draft, includeMaybe: draft.includeMaybe }, { onSuccess: draft.discard });
  };

  const clearSaved = () => clear.mutate(undefined, { onSuccess: () => setConfirmingClear(false) });

  return (
    <section aria-labelledby="teams-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="teams-title" className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-ink">
            Команди
            {isDraft && <Badge tone="pink">Чернетка</Badge>}
          </h2>
          <p className="mt-1 text-sm text-ink/60">{subtitle(isDraft, game)}</p>
        </div>

        {canManage && saved && !isDraft && (
          <div className="flex gap-2">
            {/* При застарілому складі ця кнопка є в банері нижче. */}
            {!outdated && (
              <Button size="sm" variant="primary" icon={<Shuffle className="size-3.5" />} onClick={draft.draw}>
                Поділити заново
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw className="size-3.5" />}
              onClick={() => setConfirmingClear(true)}
            >
              Скинути
            </Button>
          </div>
        )}
      </div>

      {isDraft && canManage && (
        <DraftToolbar
          draft={draft}
          maybeCount={maybeCount}
          saving={save.isPending}
          onSave={saveDraft}
          hasSaved={Boolean(saved)}
        />
      )}

      {outdated && (
        <div className="flex flex-wrap items-center gap-3 rounded-tile bg-warn/15 px-4 py-3 text-sm text-[#7a5408] ring-1 ring-warn/30">
          <TriangleAlert className="size-4 shrink-0" />
          <p className="flex-1">
            <span className="font-semibold">Склад змінився після поділу.</span> Хтось записався або відписався.
          </p>
          {canManage && (
            <Button size="sm" variant="primary" icon={<Shuffle className="size-3.5" />} onClick={draft.draw}>
              Поділити заново
            </Button>
          )}
        </div>
      )}

      {shown ? (
        <div className={cn('space-y-4', isDraft && 'rounded-card border-2 border-dashed border-accent/30 p-2 sm:p-3')}>
          <BalanceSummary teams={shown} playersById={playersById} />
          <TeamsGrid
            teams={shown}
            animationKey={isDraft ? draft.drawVersion : 0}
            playersById={playersById}
            meId={meId}
            onMove={isDraft ? draft.movePlayer : undefined}
          />
        </div>
      ) : canManage ? (
        <SetupCard draft={draft} maybeCount={maybeCount} />
      ) : (
        <Card>
          <EmptyState
            icon={<Swords className="size-6" />}
            title={getPhase(game) === 'finished' ? 'На цю гру команди не ділили' : 'Команд ще немає'}
            description={
              getPhase(game) === 'finished'
                ? undefined
                : 'Організатор поділить команди перед грою — з урахуванням рівня кожного гравця.'
            }
          />
        </Card>
      )}

      <ConfirmModal
        open={confirmingClear}
        onClose={() => setConfirmingClear(false)}
        onConfirm={clearSaved}
        loading={clear.isPending}
        title="Скинути склади?"
        description="Поточний поділ на команди буде видалено. Потім можна поділити заново."
        confirmLabel="Скинути"
      />
    </section>
  );
}

function subtitle(isDraft: boolean, game: Game): string {
  if (isDraft) return 'Перегляньте склади, за потреби перемістіть гравців і збережіть.';
  if (game.teams) {
    const maybe = game.teams.includeMaybe ? ' · з урахуванням «можливо»' : '';
    return `Поділено ${fmt(game.teams.createdAt, 'd MMMM, HH:mm')}${maybe}`;
  }
  return 'Рандомний поділ з урахуванням рівня кожного гравця';
}

interface TeamsGridProps {
  teams: readonly Team[];
  animationKey: number;
  playersById: ReadonlyMap<PlayerId, Player>;
  meId: PlayerId | undefined;
  onMove?: (playerId: PlayerId, toTeamId: string) => void;
}

function TeamsGrid({ teams, animationKey, playersById, meId, onMove }: TeamsGridProps) {
  return (
    <div className={cn('grid gap-4', GRID_COLS[teams.length] ?? GRID_COLS[4])}>
      {teams.map((team, i) => (
        <TeamCard
          key={`${animationKey}-${team.id}`}
          team={team}
          allTeams={teams}
          playersById={playersById}
          meId={meId}
          onMove={onMove}
          className="animate-fade-up"
          style={{ animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  );
}

interface DraftToolbarProps {
  draft: TeamsDraft;
  maybeCount: number;
  saving: boolean;
  hasSaved: boolean;
  onSave: () => void;
}

function DraftToolbar({ draft, maybeCount, saving, hasSaved, onSave }: DraftToolbarProps) {
  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <DrawSettings draft={draft} maybeCount={maybeCount} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" icon={<X className="size-3.5" />} onClick={draft.discard} disabled={saving}>
          {hasSaved ? 'Залишити як було' : 'Скасувати'}
        </Button>
        <Button size="sm" icon={<Shuffle className="size-3.5" />} onClick={draft.draw} disabled={saving}>
          Перемішати ще раз
        </Button>
        <Button size="sm" variant="accent" icon={<Save className="size-3.5" />} onClick={onSave} loading={saving}>
          Зберегти склади
        </Button>
      </div>
    </Card>
  );
}

function SetupCard({ draft, maybeCount }: { draft: TeamsDraft; maybeCount: number }) {
  const needed = draft.playersNeeded;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-5 px-6 py-10 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-lavender-soft text-accent">
          <Dices className="size-7" />
        </span>
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">Поділимо на рівні команди?</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Алгоритм перемішає записаних і розкладе їх так, щоб сумарний рівень команд був максимально близьким.
            Воротарі — порівну в кожну команду.
          </p>
        </div>

        <DrawSettings draft={draft} maybeCount={maybeCount} />

        {needed > 0 ? (
          <p className="rounded-full bg-warn/15 px-4 py-2 text-sm font-medium text-[#7a5408]">
            Для {draft.teamCount} команд потрібно ще {needed} {plural(needed, PLAYER_FORMS)}
          </p>
        ) : (
          <Button size="lg" variant="accent" icon={<Shuffle className="size-4" />} onClick={draft.draw}>
            Поділити на команди
          </Button>
        )}
      </div>
    </Card>
  );
}
