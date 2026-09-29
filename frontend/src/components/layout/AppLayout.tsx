import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, LandPlot, Users, type LucideIcon } from 'lucide-react';
import { MiniCalendar } from '@/features/calendar/MiniCalendar';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Календар', icon: CalendarDays, end: true },
  { to: '/lineup', label: 'Розстановка', icon: LandPlot },
  { to: '/players', label: 'Гравці', icon: Users },
];

function NavItems({ variant }: { variant: 'rail' | 'top' }) {
  return (
    <nav className={cn('flex gap-1', variant === 'rail' ? 'flex-col' : 'items-center')}>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-2xl text-sm font-medium transition-colors',
              variant === 'rail' ? 'px-3.5 py-2.5' : 'px-3 py-2',
              isActive ? 'bg-white text-ink' : 'text-rail-text hover:bg-rail-2 hover:text-white',
            )
          }
        >
          <Icon className="size-[18px]" />
          <span className={cn(variant === 'top' && 'max-sm:sr-only')}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Каркас як на референсі: чорна рамка, темна бічна панель
 * і світле градієнтне полотно з заокругленими кутами.
 */
export function AppLayout() {
  return (
    <div className="flex h-full gap-3 p-2 sm:p-3">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 rounded-card bg-rail p-4 lg:flex">
        <div className="px-1.5 pt-1">
          <Logo />
        </div>
        <NavItems variant="rail" />
        <MiniCalendar />
        <div className="mt-auto">
          <UserMenu />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
        <header className="flex items-center justify-between gap-3 rounded-card bg-rail px-3 py-2 lg:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <NavItems variant="top" />
            <UserMenu compact />
          </div>
        </header>

        <main className="canvas-gradient scrollbar-thin relative min-h-0 flex-1 overflow-y-auto rounded-card">
          <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}



