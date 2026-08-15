// ainda ausentes em integrations/supabase/types.ts (gerado). Remover após regenerar os types.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ParsedConta } from '@/lib/plano-contas-csv-importer';

export interface ImportPlanoFalha {
  codigo: string;
  erro: string;
}

export interface ImportPlanoResult {
  criadas: number;
  atualizadas: number;
  falhas: ImportPlanoFalha[];
}

export interface ImportPlanoInput {
  empresa_id: string;
  contas: ParsedConta[];
  onProgress?: (done: number, total: number) => void;
}

/**
 * Importa um plano de contas em lote, respeitando a hierarquia.
 *
 * As contas chegam já ordenadas por código (pais antes das filhas), então a
 * importação percorre nível a nível e resolve `parent_id` a partir dos códigos
 * já persistidos — inclusive contas que já existiam na empresa antes da
 * importação (nesse caso são atualizadas, não duplicadas).
 */
export function useImportPlanoContas() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ImportPlanoInput): Promise<ImportPlanoResult> => {
      if (!input.empresa_id) throw new Error('Selecione uma empresa antes de importar.');
      if (input.contas.length === 0) throw new Error('Nenhuma conta válida para importar.');

      const result: ImportPlanoResult = { criadas: 0, atualizadas: 0, falhas: [] };

      // Mapa codigo → id, pré-carregado com o que já existe na empresa para
      // permitir importações incrementais sem quebrar a hierarquia.
      const { data: existentes, error: errExist } = await supabase
        .from('plano_contas')
        .select('id, codigo')
        .eq('empresa_id', input.empresa_id);
      if (errExist) throw errExist;

      const idPorCodigo = new Map<string, string>(
        (existentes ?? []).map((c: { id: string; codigo: string }) => [c.codigo, c.id]),
      );

      const total = input.contas.length;
      let done = 0;

      // Processa por nível para garantir que o pai já tenha id resolvido.
      const niveis = [...new Set(input.contas.map((c) => c.nivel))].sort((a, b) => a - b);

      for (const nivel of niveis) {
        const doNivel = input.contas.filter((c) => c.nivel === nivel);

        for (const conta of doNivel) {
          try {
            const parentId = conta.codigo_pai ? idPorCodigo.get(conta.codigo_pai) ?? null : null;
            if (conta.codigo_pai && !parentId) {
              throw new Error(`Conta superior ${conta.codigo_pai} não foi persistida.`);
            }

            const payload = {
              empresa_id: input.empresa_id,
              codigo: conta.codigo,
              nome: conta.descricao,
              descricao: conta.descricao,
              tipo: conta.tipo,
              natureza: conta.natureza,
              nivel: conta.nivel,
              parent_id: parentId,
              codigo_referencial: conta.codigo_referencial,
              aceita_lancamento: conta.aceita_lancamento,
              ativo: true,
            };

            const existenteId = idPorCodigo.get(conta.codigo);

            if (existenteId) {
              const { error } = await supabase
                .from('plano_contas')
                .update(payload)
                .eq('id', existenteId);
              if (error) throw error;
              result.atualizadas++;
            } else {
              const { data, error } = await supabase
                .from('plano_contas')
                .insert(payload)
                .select('id')
                .maybeSingle();
              if (error || !data) throw error ?? new Error('Falha ao inserir conta.');
              idPorCodigo.set(conta.codigo, data.id);
              result.criadas++;
            }
          } catch (e) {
            result.falhas.push({
              codigo: conta.codigo,
              erro: e instanceof Error ? e.message : 'Erro desconhecido',
            });
          } finally {
            done++;
            input.onProgress?.(done, total);
          }
        }
      }

      return result;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['plano-contas'] });
      const total = res.criadas + res.atualizadas;
      if (res.falhas.length === 0) {
        toast.success(`Plano importado: ${res.criadas} criada(s), ${res.atualizadas} atualizada(s).`);
      } else {
        toast.warning(`${total} conta(s) processada(s), ${res.falhas.length} falha(s).`);
      }
    },
    onError: (e: Error) => toast.error(`Erro na importação: ${e.message}`),
  });
}
