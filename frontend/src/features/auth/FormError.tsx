import { getErrorMessage } from '@/api';

/**
 * Помилка від сервера під формою (невірний пароль, зайнятий логін…).
 * Щоб струс повторювався на кожну невдалу спробу, давайте компоненту key={mutation.submittedAt}.
 */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="animate-shake rounded-2xl [animation-delay:0ms] bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
      {getErrorMessage(error)}
    </p>
  );
}
