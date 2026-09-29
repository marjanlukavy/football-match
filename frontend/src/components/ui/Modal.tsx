import type { ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Модальне вікно на Radix Dialog: фокус-пастка, Esc, блокування скролу.
 * Вміст монтується лише у відкритому стані — форми щоразу стартують зі свіжих значень.
 * Поповери Radix (Select, TimePicker, DropdownMenu) коректно працюють усередині.
 */
export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[rgb(12_10_30/0.35)] p-4 backdrop-blur-sm">
          <Dialog.Content
            data-app-modal
            className={cn(
              'flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-card bg-panel text-ink shadow-pop outline-none',
              'data-[state=open]:animate-pop-in',
              className,
            )}
          >
            <header className="flex items-start gap-4 px-6 pt-6 pb-4">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-lg font-bold tracking-tight">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
                ) : (
                  <Dialog.Description className="sr-only">{title}</Dialog.Description>
                )}
              </div>
              <Dialog.Close
                aria-label="Закрити"
                className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-ink"
              >
                <X className="size-4" />
              </Dialog.Close>
            </header>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</footer>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
