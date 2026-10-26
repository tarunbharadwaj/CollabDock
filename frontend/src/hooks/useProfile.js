import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useProfile(enabled = true) {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/me')).data.data,
    enabled,
    retry: (failureCount, error) => Boolean(error.response?.status >= 500 && failureCount < 1),
    refetchOnWindowFocus: false,
  });
}
