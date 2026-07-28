import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { STALE_TIMES } from '@/lib/queryClient';
import type {
  CentroCusto,
  ContaBancaria,
  ContaBancariaComRegras,
  Empresa,
  RegraRoteamento,
} from './types';

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('ativo', true)
        .order('razao_social');
      if (error) throw error;
      return data as Empresa[];
    },
    staleTime: STALE_TIMES.static,
  });
}

export function useCentrosCusto(empresaId?: string) {
  return useQuery({
    queryKey: ['centros-custo', empresaId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('centros_custo')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (empresaId && empresaId !== 'all') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CentroCusto[];
    },
    staleTime: STALE_TIMES.static,
  });
}

export function useContasBancarias(empresaId?: string) {
  return useQuery({
    queryKey: ['contas-bancarias', empresaId],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const queryParams = new URLSearchParams({
        select: '*,empresas:empresa_id(razao_social,nome_fantasia)',
        ativo: 'eq.true',
        order: 'banco',
      });

      if (empresaId && empresaId !== 'all') {
        queryParams.append('empresa_id', `eq.${empresaId}`);
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/rest/v1/contas_bancarias?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        },
      );

      if (!response.ok) throw new Error('Erro ao buscar contas bancárias');
      const data = await response.json();

      const { data: rules } = await supabaseDyn
        .from<RegraRoteamento>('regras_roteamento_financeiro')
        .select('*')
        .eq('ativo', true);

      return ((data || []) as ContaBancaria[]).map((conta) => ({
        ...conta,
        regras: (rules || []).filter((r) => r.conta_bancaria_id === conta.id),
      })) as ContaBancariaComRegras[];
    },
    staleTime: STALE_TIMES.config,
  });
}
