import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import type {
  DryRunEntry,
  DryRunInput,
  DryRunOutcome,
  Regra,
  RegraFormState,
} from './types';

/**
 * Mutations da aba de Contabilização Automática.
 * Efeitos colaterais de UX (fechar dialogs, resetar forms) ficam a cargo do
 * chamador via `mutate(input, { onSuccess })`. Aqui só validamos, executamos e
 * invalidamos as queries.
 */
export function useContabilizacaoMutations(empresaId: string) {
  const qc = useQueryClient();
  const invalidateRegras = () =>
    qc.invalidateQueries({ queryKey: ['regras_contab', empresaId] });

  const createRegra = useMutation<void, Error, RegraFormState>({
    mutationFn: async (form) => {
      if (!form.nome || !form.conta_debito_id || !form.conta_credito_id) {
        throw new Error('Preencha nome, conta débito e conta crédito');
      }
      if (form.conta_debito_id === form.conta_credito_id) {
        throw new Error('Conta de débito e crédito devem ser diferentes');
      }
      const { error } = await supabaseDyn
        .from('regras_contabilizacao_automatica')
        .insert({ empresa_id: empresaId, ...form });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Regra criada');
      invalidateRegras();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRegra = useMutation<void, Error, Regra>({
    mutationFn: async (regra) => {
      if (!regra.nome || !regra.conta_debito_id || !regra.conta_credito_id) {
        throw new Error('Mapeamento incompleto: preencha nome e contas de D/C');
      }
      if (
        regra.prioridade === undefined ||
        Number.isNaN(regra.prioridade) ||
        regra.prioridade < 0
      ) {
        throw new Error('Prioridade inválida: deve ser um número positivo');
      }
      if (regra.conta_debito_id === regra.conta_credito_id) {
        throw new Error('Contas de débito e crédito devem ser diferentes');
      }
      const { error } = await supabaseDyn
        .from('regras_contabilizacao_automatica')
        .update({ ...regra } as Record<string, unknown>)
        .eq('id', regra.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Regra atualizada');
      invalidateRegras();
    },
    onError: (e) => toast.error(e.message),
  });

  const duplicateRegra = useMutation<void, Error, Regra>({
    mutationFn: async (regra) => {
      const { id: _id, ...data } = regra;
      void _id;
      const { error } = await supabaseDyn
        .from('regras_contabilizacao_automatica')
        .insert({
          ...data,
          nome: `${data.nome} (Cópia)`,
          prioridade: (data.prioridade ?? 0) + 1,
        });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Regra duplicada');
      invalidateRegras();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleAtivo = useMutation<void, Error, { id: string; ativo: boolean }>({
    mutationFn: async ({ id, ativo }) => {
      const { error } = await supabaseDyn
        .from('regras_contabilizacao_automatica')
        .update({ ativo })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidateRegras,
  });

  const deleteRegra = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabaseDyn
        .from('regras_contabilizacao_automatica')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Regra removida');
      invalidateRegras();
    },
  });

  const dryRunSimulation = useMutation<DryRunOutcome, Error, DryRunInput>({
    mutationFn: async ({ simForm, isLote, onBefore }) => {
      const payload = {
        ...simForm,
        categoria_id:
          simForm.categoria_id === 'none' ? null : simForm.categoria_id || null,
        empresa_id: empresaId,
        dry_run: true,
      };

      if (isLote) {
        const results: DryRunEntry[] = [];
        for (let i = 0; i < simForm.lote_quantidade; i++) {
          const { data, error } = await supabase.functions.invoke<DryRunEntry>(
            'contabilizar-evento',
            { body: { ...payload, evento_id: `sim-lote-${i}-${Date.now()}` } },
          );
          if (error) throw error;
          if (data) results.push(data);
        }
        return { type: 'lote', results };
      }

      const { data: before, error: errBefore } =
        await supabase.functions.invoke<DryRunEntry>('contabilizar-evento', {
          body: {
            ...payload,
            evento_id: 'sim-before-' + Date.now(),
            ignore_rules: true,
          },
        });
      if (errBefore) throw errBefore;
      if (before && onBefore) onBefore(before);

      const { data: after, error: errAfter } =
        await supabase.functions.invoke<DryRunEntry>('contabilizar-evento', {
          body: { ...payload, evento_id: 'sim-after-' + Date.now() },
        });
      if (errAfter) throw errAfter;
      if (!after) throw new Error('Sem retorno da simulação');
      return { type: 'single', after };
    },
    onSuccess: (data, variables) => {
      toast.info(
        variables.isLote ? 'Simulação em lote concluída' : 'Simulação concluída',
      );
      void data;
    },
    onError: (e) => toast.error('Falha na simulação: ' + e.message),
  });

  return {
    createRegra,
    updateRegra,
    duplicateRegra,
    toggleAtivo,
    deleteRegra,
    dryRunSimulation,
  };
}

export type ContabilizacaoMutations = ReturnType<typeof useContabilizacaoMutations>;
