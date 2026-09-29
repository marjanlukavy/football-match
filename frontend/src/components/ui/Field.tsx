import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink placeholder:text-subtle ' +
  'transition-colors outline-none hover:border-black/20 focus:border-accent aria-[invalid=true]:border-danger';

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Підпис + контрол + помилка з правильними aria-зв'язками. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-xs font-semibold text-ink/80">
        {label}
      </label>
      {children(id, error || hint ? messageId : undefined)}
      {error ? (
        <p id={messageId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => <input ref={ref} className={cn(CONTROL, 'h-11', className)} {...rest} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea ref={ref} className={cn(CONTROL, 'min-h-20 resize-y py-3', className)} {...rest} />
  ),
);
Textarea.displayName = 'Textarea';
