import type { Player } from '@futbol/shared/types';
import { cn } from '@/lib/cn';

/** Пастельні пари «фон / текст» у стилі референсу. */
const PALETTE = [
  ['#e4defc', '#4c3fc4'],
  ['#f9d3ee', '#a13a82'],
  ['#e3f1a6', '#566316'],
  ['#d5e5ee', '#355466'],
  ['#fde1c8', '#9a4d12'],
  ['#d3f0e2', '#1f7050'],
] as const;

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const SIZES = {
  xs: 'size-6 text-[9px]',
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-xs',
  lg: 'size-14 text-base',
} as const;

interface AvatarProps {
  player: Pick<Player, 'id' | 'name'>;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ player, size = 'sm', className }: AvatarProps) {
  const [bg, fg] = PALETTE[hash(player.id) % PALETTE.length];
  return (
    <span
      title={player.name}
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-bold select-none', SIZES[size], className)}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials(player.name)}
    </span>
  );
}

interface AvatarStackProps {
  players: Pick<Player, 'id' | 'name'>[];
  max?: number;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Аватарки, що перекривають одна одну (як на картках подій). */
export function AvatarStack({ players, max = 3, size = 'sm', className }: AvatarStackProps) {
  const visible = players.slice(0, max);
  const rest = players.length - visible.length;
  return (
    <div className={cn('flex items-center', size === 'xs' ? '-space-x-1' : '-space-x-2', className)}>
      {visible.map((p) => (
        <Avatar key={p.id} player={p} size={size} className="ring-2 ring-white" />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            'inline-grid shrink-0 place-items-center rounded-full bg-ink font-bold text-white ring-2 ring-white',
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
