import { Scale } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { TEAM_HEX } from '@futbol/shared/constants';
import type { Player, PlayerId, Team } from '@futbol/shared/types';
import { BALANCE_QUALITY_LABELS, balanceQuality, teamStats, type BalanceQuality } from './balanceTeams';

const QUALITY_TONE: Record<BalanceQuality, BadgeTone> = {
  perfect: 'success',
  good: 'lavender',
  uneven: 'warn',
};

interface BalanceSummaryProps {
  teams: readonly Team[];
  playersById: ReadonlyMap<PlayerId, Player>;
}

/** Оцінка балансу + порівняння сумарних рівнів команд смужками. */
export function BalanceSummary({ teams, playersById }: BalanceSummaryProps) {
  const skillOf = (id: PlayerId) => playersById.get(id)?.skill ?? 0;
  const totals = teams.map((t) => teamStats(t.playerIds, skillOf).total);
  const quality = balanceQuality(totals);
  const spread = totals.length ? Math.max(...totals) - Math.min(...totals) : 0;
  const max = Math.max(1, ...totals);

  return (
    <div className="flex flex-col gap-4 rounded-tile bg-white/60 p-4 ring-1 ring-black/5 backdrop-blur sm:flex-row sm:items-center sm:gap-6">
      <div className="flex shrink-0 items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-white text-accent-ink shadow-sm">
          <Scale className="size-5" />
        </span>
        <div>
          <Badge tone={QUALITY_TONE[quality]}>{BALANCE_QUALITY_LABELS[quality]}</Badge>
          <p className="mt-1 text-xs text-muted">
            Різниця сил: <span className="font-semibold text-ink">{spread}</span>
          </p>
        </div>
      </div>

      <div className="grid flex-1 gap-1.5" aria-label="Сумарний рівень команд">
        {teams.map((team, i) => (
          <div key={team.id} className="flex items-center gap-3 text-xs">
            <span className="w-24 truncate font-medium text-ink/70">{team.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full ring-1 ring-black/10 transition-[width] duration-500"
                style={{ width: `${(totals[i] / max) * 100}%`, backgroundColor: TEAM_HEX[team.color] }}
              />
            </div>
            <span className="w-6 text-right font-bold text-ink tabular-nums">{totals[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
