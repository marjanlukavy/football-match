import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ApiError, isUnauthorized } from './api';
import { queryKeys } from './api/hooks';
import { App } from './App';
import './index.css';

/** Сесія закінчилась або її видалили — показуємо сторінку входу. */
function onAuthError(error: unknown) {
  if (isUnauthorized(error)) queryClient.setQueryData(queryKeys.me, null);
}

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onAuthError }),
  mutationCache: new MutationCache({ onError: onAuthError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 401/403/404 повторювати марно — лише збої мережі.
      retry: (failureCount, error) => failureCount < 1 && !(error instanceof ApiError),
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'rounded-2xl! border-0! bg-ink! text-white! shadow-pop! font-sans!',
            description: 'text-white/70!',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
