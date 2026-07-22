import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blingAction } from './client';

export function useBlingOAuth() {
  const queryClient = useQueryClient();

  const getAuthUrl = () => {
    const clientId = import.meta.env.VITE_BLING_CLIENT_ID || '';
    const redirectUri = `${window.location.origin}/bling`;
    return `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=bling_auth&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const exchangeCode = useMutation({
    mutationFn: (code: string) =>
      blingAction('oauth_callback', { code, redirect_uri: `${window.location.origin}/bling` }),
    onSuccess: () => {
      toast.success('Bling conectado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['bling-status'] });
    },
    onError: (err: Error) => toast.error(`Erro ao conectar Bling: ${err.message}`),
  });

  return { getAuthUrl, exchangeCode };
}

export function useBlingStatus() {
  return useQuery({
    queryKey: ['bling-status'],
    queryFn: async () => {
      try {
        const result = await blingAction('dados_empresa');
        return { connected: true, empresa: result?.data };
      } catch {
        return { connected: false, empresa: null };
      }
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}
