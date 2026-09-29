import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react';
import { useLogout, useMe } from '@/api/hooks';
import { Avatar } from '@/components/ui/Avatar';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/cn';

/** Поточний користувач у сайдбарі: перехід у профіль і вихід. */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { data: me } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  if (!me) return <div className="h-14 animate-pulse rounded-2xl bg-rail-2" />;

  return (
    <DropdownMenu
      tone="dark"
      align={compact ? 'end' : 'start'}
      className="w-56"
      trigger={
        <button
          type="button"
          aria-label="Мій профіль"
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl text-left text-white transition-colors outline-none',
            'hover:bg-rail-2 focus-visible:ring-2 focus-visible:ring-white/40 data-[state=open]:bg-rail-2',
            compact ? 'p-1' : 'bg-rail-2/60 p-2.5',
          )}
        >
          <Avatar player={me} size={compact ? 'sm' : 'md'} />
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{me.name}</span>
                <span className="block truncate text-[11px] text-rail-text">
                  {me.role === 'admin' ? 'Організатор' : 'Гравець'}
                </span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-rail-text" />
            </>
          )}
        </button>
      }
    >
      <DropdownMenuItem onSelect={() => navigate('/profile')}>
        <UserRound className="size-4" />
        Профіль
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
        <LogOut className="size-4" />
        Вийти
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
