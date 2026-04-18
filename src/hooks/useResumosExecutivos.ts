import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ResumoExecutivo {
  id: string;
  empresa_id: string;
  semana_inicio: string;
  semana_fim: string;
  resumo_md: string;
  kpis: Record<string, number>;
  destinatarios: string[];
  enviado_em: string | null;
  erro_envio: string | null;
  created_at: string;
}

export function useResumosExecutivos(empresaId?: string) {
  const qc = useQueryClient();

  const lista = useQuery({
    queryKey: ['resumos-executivos', empresaId],
    queryFn: async (): Promise<ResumoExecutivo[]> => {
      let q = supabase.from('resumos_executivos_semanais' as never)
        .select('*').order('semana_inicio', { ascending: false }).limit(20);
      if (empresaId) q = (q as any).eq('empresa_id', empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ResumoExecutivo[];
    },
    staleTime: 60_000,
  });

  const gerarAgora = useMutation({
    mutationFn: async (empresa_id?: string) => {
      const { data, error } = await supabase.functions.invoke('gerar-resumo-executivo-semanal', {
        body: empresa_id ? { empresa_id } : {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Resumo executivo gerado');
      qc.invalidateQueries({ queryKey: ['resumos-executivos'] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return { lista, gerarAgora };
}
