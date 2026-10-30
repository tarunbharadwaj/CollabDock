import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

function isTemporaryConnectionError(error) {
  const status = error?.response?.status;

  return !status || status === 408 || status === 429 || status >= 500;
}

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/me', { timeout: 30_000 })).data.data,
    enabled,
    retry: (failureCount, error) => isTemporaryConnectionError(error) && failureCount < 3,
    retryDelay: (attempt) => Math.min(2_000 * (2 ** attempt), 8_000),
    refetchInterval: (query) => (
      query.state.status === 'error' && isTemporaryConnectionError(query.state.error)
        ? 15_000
        : false
    ),
    refetchOnWindowFocus: false,
  });
}
