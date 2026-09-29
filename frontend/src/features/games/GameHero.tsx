import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Clock, MapPin, Pencil, StickyNote, Trash2 } from 'lucide-react';
import { useDeleteGame } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { confirmedCount, getAttendees, spotsLeft } from '@futbol/shared/game';
import type { Game } from '@futbol/shared/types';
import { capitalize, fmt, formatLongDate, formatTimeRange } from '@/lib/date';
import { plural } from '@/lib/plural';
import { ConfirmModal } from './ConfirmModal';
import { GameFormModal } from './GameFormModal';
import { GamePhaseBadge } from './GamePhaseBadge';

function mapsUrl(game: Game): string {
  const query = `${game.location.name}, ${game.location.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function DateTile({ startsAt }: { startsAt: string }) {
  return (
    <div className="canvas-gradient flex w-24 shrink-0 flex-col items-center justify-center rounded-tile py-4 ring-1 ring-black/5 sm:w-28">
      <span className="text-xs font-semibold text-ink/60">{fmt(startsAt, 'EEEEEE')}</span>
      <span className="text-5xl leading-none font-extrabold tracking-tighter text-accent-ink sm:text-6xl">
        {fmt(startsAt, 'd')}
      </span>
      <span className="mt-1 text-xs font-semibold text-ink/60">{fmt(startsAt, 'LLL')}</span>
    </div>
  );
}

function Capacity({ game }: { game: Game }) {
  const confirmed = confirmedCount(game);
  const left = spotsLeft(game);
  const maybe = getAttendees(game, 'maybe').length;
  const percent = Math.min(100, Math.round((confirmed / game.maxPlayers) * 100));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">
          {confirmed} з {game.maxPlayers} місць
          {maybe > 0 && <span className="font-medium text-muted"> · ще {maybe} під питанням</span>}
        </span>
        <span className={left === 0 ? 'font-semibold text-danger' : 'text-muted'}>
          {left === 0 ? 'Усі місця зайняті' : `ще ${left} ${plural(left, ['вільне', 'вільних', 'вільних'])}`}
        </span>
      </div>
      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={game.maxPlayers}
        aria-valuenow={confirmed}
        aria-label="Заповненість гри"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-lavender to-accent transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

interface GameHeroProps {
  game: Game;
  isAdmin: boolean;
}

export function GameHero({ game, isAdmin }: GameHeroProps) {
  const navigate = useNavigate();
  const deleteGame = useDeleteGame();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const remove = () =>
    deleteGame.mutate(game.id, {
      onSuccess: () => navigate('/', { replace: true }),
    });

  return (
    <Card className="p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GamePhaseBadge game={game} />
        {isAdmin && (
          <div className="flex gap-2">
            <Button size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(true)}>
              Редагувати
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setConfirmingDelete(true)}
            >
              Видалити
            </Button>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-5 sm:gap-7">
        <DateTile startsAt={game.startsAt} />
        <div className="flex min-w-0 flex-col justify-center gap-2.5">
          <p className="text-sm font-medium text-muted">{capitalize(formatLongDate(game.startsAt))}</p>
          <h1 className="text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl">{game.location.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink/70">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-accent" />
              {formatTimeRange(game.startsAt, game.durationMin)}
              <span className="text-muted">· {game.durationMin} хв</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-accent" />
              <span className="truncate">{game.location.address}</span>
            </span>
            <a
              href={mapsUrl(game)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 font-semibold text-accent hover:text-accent-ink"
            >
              Маршрут
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Capacity game={game} />
      </div>

      {game.notes && (
        <p className="mt-5 flex gap-2.5 rounded-tile bg-lime/40 px-4 py-3 text-sm text-ink/80">
          <StickyNote className="mt-0.5 size-4 shrink-0 text-[#566316]" />
          {game.notes}
        </p>
      )}

      {isAdmin && (
        <>
          <GameFormModal open={editing} game={game} onClose={() => setEditing(false)} />
          <ConfirmModal
            open={confirmingDelete}
            onClose={() => setConfirmingDelete(false)}
            onConfirm={remove}
            loading={deleteGame.isPending}
            title="Видалити гру?"
            description={`${capitalize(formatLongDate(game.startsAt))}, ${game.location.name}. Записи й склади команд теж зникнуть.`}
            confirmLabel="Видалити"
          />
        </>
      )}
    </Card>
  );
}
