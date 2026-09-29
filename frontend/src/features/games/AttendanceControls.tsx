import { Check, HelpCircle, LogOut } from 'lucide-react';
import { useCancelAttendance, useSetAttendance } from '@/api/hooks';
import { Button } from '@/components/ui/Button';
import { ATTENDANCE_LABELS } from '@futbol/shared/constants';
import { canConfirm, getRegistration, isRegistrationOpen } from '@futbol/shared/game';
import type { AttendanceStatus, Game, PlayerId } from '@futbol/shared/types';
import { cn } from '@/lib/cn';

interface AttendanceControlsProps {
  game: Game;
  meId: PlayerId | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Запис на гру: «точно буду» / «можливо не зможу» / відписатись.
 * Поточний статус підсвічений, повторне натискання нічого не робить.
 */
export function AttendanceControls({ game, meId, size = 'md', className }: AttendanceControlsProps) {
  const setAttendance = useSetAttendance(game.id);
  const cancel = useCancelAttendance(game.id);
  const current = getRegistration(game, meId)?.status;
  const open = isRegistrationOpen(game);
  const confirmAllowed = canConfirm(game, meId);
  const busy = setAttendance.isPending || cancel.isPending;
  const pendingStatus = setAttendance.isPending ? setAttendance.variables : undefined;

  if (!open) {
    return (
      <p className={cn('text-sm text-muted', className)}>
        {current ? `Ваш статус: ${ATTENDANCE_LABELS[current].toLowerCase()}. ` : ''}Запис закрито — гра вже почалась.
      </p>
    );
  }

  const choose = (status: AttendanceStatus) => {
    if (status !== current) setAttendance.mutate(status);
  };

  const btnSize = size === 'sm' ? 'sm' : 'md';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        size={btnSize}
        variant={current === 'confirmed' ? 'accent' : 'soft'}
        icon={<Check className="size-4" />}
        aria-pressed={current === 'confirmed'}
        disabled={busy || !confirmAllowed}
        loading={pendingStatus === 'confirmed'}
        title={confirmAllowed ? undefined : 'Усі місця зайняті'}
        onClick={() => choose('confirmed')}
      >
        {ATTENDANCE_LABELS.confirmed}
      </Button>
      <Button
        size={btnSize}
        variant="soft"
        icon={<HelpCircle className="size-4" />}
        aria-pressed={current === 'maybe'}
        className={cn(current === 'maybe' && 'bg-pink text-pink-ink ring-pink-ink/20 hover:bg-pink')}
        disabled={busy}
        loading={pendingStatus === 'maybe'}
        onClick={() => choose('maybe')}
      >
        {ATTENDANCE_LABELS.maybe}
      </Button>
      {current && (
        <Button
          size={btnSize}
          variant="ghost"
          icon={<LogOut className="size-4" />}
          disabled={busy}
          loading={cancel.isPending}
          onClick={() => cancel.mutate()}
        >
          Відписатись
        </Button>
      )}
      {!confirmAllowed && !current && (
        <span className="text-xs font-medium text-muted">Місць немає — можна лише «можливо»</span>
      )}
    </div>
  );
}
