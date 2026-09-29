import { Link } from 'react-router-dom';
import { ChevronLeft, Ellipsis } from 'lucide-react';
import { initials } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LineupTeamBar } from '@/features/lineup/LineupTeamBar';
import { LineupToken, SIDE_BG, SIDE_TEXT } from '@/features/lineup/LineupToken';
import { LINEUP_GAME, LINEUP_TEAMS, type LineupTeam } from '@/features/lineup/mockLineup';
import { PITCH_LENGTH, PITCH_WIDTH, PitchMarkings } from '@/features/lineup/PitchMarkings';
import { cn } from '@/lib/cn';

/** Хто де грає: поле з розстановкою обох команд. Поки на статичних даних. */
export default function LineupPage() {
  const [teamA, teamB] = LINEUP_TEAMS;

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
      {/* На десктопі ширину панелі обмежуємо висотою вікна, щоб поле влазило цілком. */}
      <section
        aria-label="Розстановка на полі"
        className="w-full max-w-[520px] rounded-card bg-pitch p-4 text-white shadow-pop sm:p-6 lg:max-w-[min(520px,calc((100dvh_-_18rem)_*_0.6476_+_3rem))]"
      >
        <header className="mb-5 flex items-center gap-3">
          <Link
            to="/"
            aria-label="Назад до календаря"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-base font-semibold">{LINEUP_GAME.title}</h1>
            <p className="truncate text-xs text-white/50">{LINEUP_GAME.subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Ще"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <Ellipsis className="size-5" />
          </button>
        </header>

        <LineupTeamBar team={teamA} />

        <div className="relative my-4" style={{ aspectRatio: `${PITCH_WIDTH} / ${PITCH_LENGTH}` }}>
          <PitchMarkings className="absolute inset-0 size-full" />
          {LINEUP_TEAMS.map((team) =>
            team.slots.map((slot) => <LineupToken key={slot.id} slot={slot} side={team.side} />),
          )}
        </div>

        <LineupTeamBar team={teamB} mirrored />
      </section>

      <aside className="flex w-full max-w-[520px] flex-col gap-4 lg:max-w-sm">
        {LINEUP_TEAMS.map((team) => (
          <RosterCard key={team.side} team={team} />
        ))}
      </aside>
    </div>
  );
}

/** Склад команди списком — дублює поле для швидкого перегляду. */
function RosterCard({ team }: { team: LineupTeam }) {
  const filled = team.slots.flatMap((s) => s.player ?? []);
  const free = team.slots.length - filled.length;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={cn('text-2xl leading-none font-extrabold', SIDE_TEXT[team.side])}>{team.label}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight">{team.name}</h2>
          <p className="text-xs text-muted">
            {filled.length} з {team.slots.length} на полі
          </p>
        </div>
        {free > 0 && <Badge tone="warn">вільно: {free}</Badge>}
      </div>

      <ul className="mt-4 divide-y divide-line">
        {filled.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2">
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white',
                SIDE_BG[team.side],
              )}
            >
              {initials(p.name)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
