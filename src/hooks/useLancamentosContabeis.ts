import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ParsedLancamento } from '@/lib/lancamentos-csv-importer';

export interface LancamentoContabilInput {
  empresa_id: string;
  data_lancamento: string;
  historico: string;
  origem?: string;
  partidas: Array<{ conta_id: string; tipo: 'D' | 'C'; valor: number; historico_complementar?: string }>;
}

export function useLancamentosContabeis(empresaId?: string, ano?: number) {
  return useQuery({
    queryKey: ['lancamentos-contabeis', empresaId, ano],
    queryFn: async () => {
      if (!empresaId) return [];
      const inicio = `${ano || new Date().getFullYear()}-01-01`;
      const fim = `${ano || new Date().getFullYear()}-12-31`;
      const { data, error } = await supabase
        .from('lancamentos_contabeis')
        .select('*, partidas:partidas_contabeis(*, conta:plano_contas(codigo, descricao, nome))')
        .eq('empresa_id', empresaId)
        .gte('data_lancamento', inicio)
        .lte('data_lancamento', fim)
        .order('data_lancamento', { ascending: true })
        .limit(5000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

export function useCriarLancamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LancamentoContabilInput) => {
      const totalD = input.partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
      const totalC = input.partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
      if (Math.abs(totalD - totalC) > 0.01) {
        throw new Error(`Débitos (${totalD.toFixed(2)}) ≠ Créditos (${totalC.toFixed(2)})`);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: lanc, error } = await supabase
        .from('lancamentos_contabeis')
        .insert({
          empresa_id: input.empresa_id,
          data_lancamento: input.data_lancamento,
          historico: input.historico,
          origem: input.origem || 'manual',
          valor_total: totalD,
          created_by: user?.id,
        })
        .select()
        .maybeSingle();
      if (error || !lanc) throw error || new Error('Falha ao criar lançamento');

      const { error: errPart } = await supabase.from('partidas_contabeis').insert(
        input.partidas.map(p => ({ ...p, lancamento_id: lanc.id })),
      );
      if (errPart) throw errPart;
      return lanc;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lancamentos-contabeis'] });
      toast.success('Lançamento contábil registrado');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
