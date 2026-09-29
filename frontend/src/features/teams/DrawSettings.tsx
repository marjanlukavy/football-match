import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Switch } from '@/components/ui/Switch';
import { MAX_TEAMS, MIN_TEAMS } from '@futbol/shared/constants';
import { PLAYER_FORMS, plural } from '@/lib/plural';
import type { TeamsDraft } from './useTeamsDraft';

const TEAM_COUNTS = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => String(MIN_TEAMS + i));

interface DrawSettingsProps {
  draft: TeamsDraft;
  /** Скільки гравців зі статусом «можливо» — якщо 0, перемикач не потрібен. */
  maybeCount: number;
}

/** Налаштування жеребкування: кількість команд і чи брати «можливо». */
export function DrawSettings({ draft, maybeCount }: DrawSettingsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-ink/70">Команд</span>
        <SegmentedControl
          size="sm"
          ariaLabel="Кількість команд"
          value={String(draft.teamCount)}
          onChange={(value) => draft.setTeamCount(Number(value))}
          options={TEAM_COUNTS.map((value) => ({
            value,
            label: value,
            disabled: !draft.isCountAvailable(Number(value)),
          }))}
        />
      </div>

      <Switch
        checked={draft.includeMaybe}
        disabled={maybeCount === 0}
        onCheckedChange={draft.setIncludeMaybe}
        label={`Враховувати «можливо»${maybeCount ? ` (${maybeCount})` : ''}`}
      />

      <span className="text-xs text-muted">
        У жеребкуванні {draft.pool.length} {plural(draft.pool.length, PLAYER_FORMS)}
      </span>
    </div>
  );
}
