import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { getErrorMessage } from '@/api';
import { ErrorState, PageLoader } from '@/components/ui/States';

/** Пускає далі лише користувача з активною сесією, інакше — на сторінку входу. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: me, isPending, isError, error, refetch } = useMe();
  const location = useLocation();

  if (isPending) return <FullScreen><PageLoader /></FullScreen>;
  if (isError) {
    return (
      <FullScreen>
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      </FullScreen>
    );
  }
  if (!me) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="h-full p-2 sm:p-3">
      <div className="canvas-gradient grid h-full place-items-center rounded-card">{children}</div>
    </div>
  );
}
