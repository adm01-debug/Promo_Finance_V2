import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSpedContabilHistorico(empresaId?: string) {
  return useQuery({
    queryKey: ['sped-contabil-historico', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('sped_contabil_arquivos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

export function useGerarSpedContabil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ empresaId, anoCalendario, tipo }: { empresaId: string; anoCalendario: number; tipo: 'ECD' | 'ECF' }) => {
      const fnName = tipo === 'ECD' ? 'gerar-sped-ecd' : 'gerar-sped-ecf';
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { empresa_id: empresaId, ano_calendario: anoCalendario },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as {
        url: string;
        file_name: string;
        total_linhas: number;
        total_lancamentos: number;
        hash_sha256: string;
        validacoes: { erros: string[]; avisos: string[] };
      };
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['sped-contabil-historico'] });
      if (data.validacoes.erros.length > 0) {
        toast.error(`SPED ${vars.tipo} gerado com ${data.validacoes.erros.length} erro(s)`);
      } else {
        toast.success(`SPED ${vars.tipo} gerado com sucesso (${data.total_lancamentos} lançamentos)`);
      }
      window.open(data.url, '_blank');
    },
    onError: (e: Error) => toast.error(`Falha ao gerar SPED: ${e.message}`),
  });
}
