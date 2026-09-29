import type { ComponentProps, ReactNode } from 'react';
import { DropdownMenu as RadixMenu } from 'radix-ui';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Меню дій на Radix DropdownMenu. Використання:
 *   <DropdownMenu trigger={<Button …/>}>
 *     <DropdownMenuLabel>…</DropdownMenuLabel>
 *     <DropdownMenuItem onSelect={…}>…</DropdownMenuItem>
 *   </DropdownMenu>
 */
interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  /** Темне меню — для темних панелей (сайдбар, поле). */
  tone?: 'light' | 'dark';
  className?: string;
}

export function DropdownMenu({ trigger, children, align = 'end', tone = 'light', className }: DropdownMenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={6}
          data-tone={tone}
          className={cn(
            'group/menu z-[60] max-h-[min(360px,var(--radix-dropdown-menu-content-available-height))] min-w-48 overflow-y-auto',
            'scrollbar-thin rounded-2xl p-1 shadow-pop data-[state=open]:animate-pop-in',
            tone === 'dark' ? 'bg-rail-2 text-white ring-1 ring-white/10' : 'bg-white text-ink ring-1 ring-black/5',
            className,
          )}
        >
          {children}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}

const ITEM =
  'relative flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none select-none ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40 ' +
  'data-[highlighted]:bg-lavender-soft group-data-[tone=dark]/menu:data-[highlighted]:bg-white/10';

export function DropdownMenuItem({ className, ...rest }: ComponentProps<typeof RadixMenu.Item>) {
  return <RadixMenu.Item className={cn(ITEM, className)} {...rest} />;
}

interface CheckItemProps extends ComponentProps<typeof RadixMenu.Item> {
  checked: boolean;
}

/** Пункт з галочкою для поточного вибору (напр. «під ким я зайшов»). */
export function DropdownMenuCheckItem({ checked, className, children, ...rest }: CheckItemProps) {
  return (
    <RadixMenu.Item className={cn(ITEM, 'pr-9', checked && 'font-semibold', className)} {...rest}>
      {children}
      {checked && <Check className="absolute right-3 size-4 text-accent" />}
    </RadixMenu.Item>
  );
}

export function DropdownMenuLabel({ className, ...rest }: ComponentProps<typeof RadixMenu.Label>) {
  return (
    <RadixMenu.Label
      className={cn('px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase', className)}
      {...rest}
    />
  );
}

export function DropdownMenuSeparator({ className, ...rest }: ComponentProps<typeof RadixMenu.Separator>) {
  return (
    <RadixMenu.Separator
      className={cn('mx-2 my-1 h-px bg-line group-data-[tone=dark]/menu:bg-white/10', className)}
      {...rest}
    />
  );
}
