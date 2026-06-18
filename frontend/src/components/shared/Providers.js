'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Toaster } from '../ui/Toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1, refetchOnWindowFocus: false },
  },
});

function AuthInit({ children }) {
  const { initialize } = useAuthStore();
  useEffect(() => { initialize(); }, []);
  return <>{children}</>;
}

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>
        {children}
        <Toaster />
      </AuthInit>
    </QueryClientProvider>
  );
}
