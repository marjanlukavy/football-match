import { useEffect, useEffectEvent, useId, useRef, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, Shirt, X } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { BallIcon } from '@/components/ui/icons';
import { AttendanceControls } from '@/features/games/AttendanceControls';
import { confirmedCount } from '@futbol/shared/game';
import type { Game, Player, PlayerId } from '@futbol/shared/types';
import { cn } from '@/lib/cn';
import { capitalize, fmt, formatTimeRange } from '@/lib/date';
import { EVENT_TONE_LABELS, getEventTone, type EventTone } from './calendarUtils';
import { useAnchoredPosition } from './useAnchoredPosition';

interface GamePopoverProps {
  game: Game;
  anchor: HTMLElement;
  meId: PlayerId | undefined;
  playersById: ReadonlyMap<PlayerId, Player>;
  onClose: () => void;
}

const TONE_BADGE: Record<EventTone, BadgeTone> = {
  confirmed: 'lavender',
  maybe: 'pink',
  open: 'mist',
  finished: 'neutral',
};

/** Коротка картка гри поверх календаря: коли, де, хто що несе, і запис. */
export function GamePopover({ game, anchor, meId, playersById, onClose }: GamePopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const position = useAnchoredPosition(anchor, ref);
  const tone = getEventTone(game, meId);
  const nameOf = (id: PlayerId | null) => (id ? playersById.get(id)?.name.split(' ')[0] : undefined);

  useFocusAndDismiss(ref, anchor, onClose);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={cn(
        'fixed z-50 w-[min(340px,calc(100vw-24px))] rounded-card bg-white p-5 shadow-pop ring-1 ring-black/5 outline-none',
        position ? 'animate-pop-in' : 'invisible',
      )}
      style={position ?? { top: 0, left: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-lg leading-snug font-semibold tracking-tight">
            {game.location.name}
          </h2>
          <p className="mt-0.5 text-sm text-muted tabular-nums">
            {capitalize(fmt(game.startsAt, 'EEEEEE, d MMMM'))} · {formatTimeRange(game.startsAt, game.durationMin)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="-mt-1 -mr-1 grid size-8 place-items-center rounded-full text-subtle transition-colors hover:bg-black/5 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/70">
        <MapPin className="size-3.5 shrink-0 text-subtle" />
        <span className="truncate">{game.location.address}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Badge tone={TONE_BADGE[tone]}>{EVENT_TONE_LABELS[tone]}</Badge>
        <Badge tone="dark">
          {confirmedCount(game)} з {game.maxPlayers}
        </Badge>
        <Badge title="М'яч">
          <BallIcon className="size-3" /> {nameOf(game.duties.ball) ?? '—'}
        </Badge>
        <Badge title="Манішки">
          <Shirt className="size-3" /> {nameOf(game.duties.bibs) ?? '—'}
        </Badge>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <AttendanceControls game={game} meId={meId} size="sm" />
      </div>

      <Link
        to={`/games/${game.id}`}
        className="mt-4 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
      >
        Відкрити гру
        <ArrowUpRight className="size-4" />
      </Link>
    </div>,
    document.body,
  );
}

/**
 * Фокус переходить у поповер; Esc і клік поза ним закривають його
 * (клік по самому якорю обробляє календар — там це перемикач).
 */
function useFocusAndDismiss(ref: RefObject<HTMLDivElement | null>, anchor: HTMLElement, onClose: () => void) {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      close();
      anchor.focus({ preventScroll: true });
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || anchor.contains(target)) return;
      // Тости, модалки й меню живуть поза поповером — клік по них не закриває його.
      if ((target as Element).closest?.('[data-sonner-toaster], [data-app-modal], [data-radix-popper-content-wrapper]')) return;
      close();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [ref, anchor]);
}
