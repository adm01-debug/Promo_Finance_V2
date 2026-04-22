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

export interface ImportLoteResult {
  sucesso: number;
  falhas: { ref: string; error: string }[];
}

export interface ImportLoteInput {
  empresa_id: string;
  lancamentos: ParsedLancamento[];
  origem?: string;
  onProgress?: (done: number, total: number) => void;
}

const CHUNK_SIZE = 10; // lançamentos processados em paralelo

export function useImportLancamentosLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ImportLoteInput): Promise<ImportLoteResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      const result: ImportLoteResult = { sucesso: 0, falhas: [] };
      const total = input.lancamentos.length;
      let processados = 0;

      const processarLancamento = async (l: ParsedLancamento) => {
        let lancId: string | null = null;
        try {
          if (!l.balanceado || l.partidas.length < 2) {
            throw new Error('Lançamento não balanceado ou com menos de 2 partidas');
          }
          const { data: lanc, error } = await supabase
            .from('lancamentos_contabeis')
            .insert({
              empresa_id: input.empresa_id,
              data_lancamento: l.data,
              historico: l.historico,
              origem: input.origem || 'importacao_csv',
              valor_total: l.total_debito,
              created_by: user?.id,
            })
            .select('id')
            .maybeSingle();
          if (error || !lanc) throw error || new Error('Falha ao criar cabeçalho');
          lancId = lanc.id;

          const { error: errPart } = await supabase.from('partidas_contabeis').insert(
            l.partidas.map((p) => ({
              lancamento_id: lanc.id,
              conta_id: p.conta_id,
              tipo: p.tipo,
              valor: p.valor,
              historico_complementar: p.historico_complementar,
            })),
          );
          if (errPart) throw errPart;
          result.sucesso++;
        } catch (e) {
          // Compensação: remove cabeçalho órfão
          if (lancId) {
            await supabase.from('lancamentos_contabeis').delete().eq('id', lancId);
          }
          result.falhas.push({ ref: l.ref, error: e instanceof Error ? e.message : 'Erro desconhecido' });
        } finally {
          processados++;
          input.onProgress?.(processados, total);
        }
      };

      // Processa em chunks paralelos para reduzir tempo total
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = input.lancamentos.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(processarLancamento));
      }

      return result;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['lancamentos-contabeis'] });
      if (res.falhas.length === 0) {
        toast.success(`${res.sucesso} lançamento(s) importado(s) com sucesso`);
      } else {
        toast.warning(`Importação concluída: ${res.sucesso} sucesso(s), ${res.falhas.length} falha(s)`);
      }
    },
    onError: (e: Error) => toast.error(`Erro na importação: ${e.message}`),
  });
}
