import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { env } from '@/config/env';
import type { ExternalListResponse } from './types';

type Empresa = {
  id: string;
  nome: string;
  cnpj?: string;
  ativa: boolean;
  eh_principal: boolean;
  supabase_project_id?: string;
  supabase_anon_key?: string;
};

export function useEmpresasConfig() {
  return useQuery({
    queryKey: ['empresas-config'],
    queryFn: async (): Promise<Empresa[]> => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome, cnpj, ativa, eh_principal, supabase_project_id, supabase_anon_key')
        .eq('ativa', true)
        .order('eh_principal', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export async function fetchEmpresaExternalData<T>(params: {
  empresa: Empresa;
  tabela: string;
  limit: number;
  page?: number;
  search?: string;
}): Promise<ExternalListResponse<T>> {
  const { empresa } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  // Se a empresa tem projeto externo configurado, usa esse; caso contrário usa o projeto principal
  const projectId = empresa.supabase_project_id ?? env.SUPABASE_PROJECT_ID;
  const apiKey = empresa.supabase_anon_key ?? env.SUPABASE_PUBLISHABLE_KEY;

  const queryParams = new URLSearchParams({
    tabela: params.tabela,
    limit: String(params.limit),
    ...(params.page ? { page: String(params.page) } : {}),
    ...(params.search ? { search: params.search } : {}),
  });

  const client = empresa.supabase_project_id ? supabaseDyn(projectId, apiKey) : supabase;
  void client; // usado abaixo via fetch direto para manter headers corretos

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/external-data?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: apiKey,
      },
    },
  );

  const payload = (await response.json().catch(() => null)) as ExternalListResponse<T> | null;

  if (!response.ok) {
    return { data: [], total: 0, total_pages: 0, fallback: true };
  }

  return payload ?? { data: [], total: 0, total_pages: 0 };
}
