import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExternalDataResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface UseExternalDataOptions {
  tabela: 'clientes' | 'fornecedores';
  search?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useExternalData<T = Record<string, unknown>>({
  tabela,
  search = '',
  page = 1,
  limit = 50,
  enabled = true,
}: UseExternalDataOptions) {
  return useQuery<ExternalDataResponse<T>>({
    queryKey: ['external-data', tabela, search, page, limit],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const params = new URLSearchParams({
        tabela,
        search,
        page: String(page),
        limit: String(limit),
      });

      const { data, error } = await supabase.functions.invoke('external-data', {
        body: null,
        headers: { 'Content-Type': 'application/json' },
      });

      // supabase.functions.invoke doesn't support query params, so we use fetch
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/external-data?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao buscar dados externos');
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
