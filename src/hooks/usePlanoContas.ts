import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanoContaRow {
  id: string;
  empresa_id: string | null;
  codigo: string;
  nome: string | null;
  descricao: string;
  natureza: string;
  tipo: string;
  parent_id: string | null;
  centro_resultado: string | null;
  codigo_referencial: string | null;
  ativo: boolean | null;
}

export function usePlanoContas(empresaId?: string) {
  return useQuery({
    queryKey: ['plano-contas', empresaId || 'all'],
    queryFn: async () => {
      let q = supabase.from('plano_contas').select('*').order('codigo');
      if (empresaId) q = q.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PlanoContaRow[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useUpsertPlanoConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PlanoContaRow> & { codigo: string; descricao: string; natureza: string; tipo: string }) => {
      const payload = { ...input, nome: input.nome || input.descricao, nivel: input.codigo.split('.').length };
      const isUpdate = !!input.id;

      // Snapshot anterior para auditoria (apenas em UPDATE)
      let oldData: Record<string, unknown> | null = null;
      if (isUpdate) {
        const { data: prev } = await supabase.from('plano_contas').select('*').eq('id', input.id!).maybeSingle();
        oldData = prev as Record<string, unknown> | null;
      }

      const { data, error } = isUpdate
        ? await supabase.from('plano_contas').update(payload).eq('id', input.id!).select().maybeSingle()
        : await supabase.from('plano_contas').insert(payload as never).select().maybeSingle();
      if (error) throw error;

      // Registra na trilha de auditoria — não bloqueia a operação principal.
      try {
        const recordId = (data as { id?: string } | null)?.id || input.id;
        if (recordId) {
          const empresaTag = input.empresa_id ? `empresa:${input.empresa_id} ` : '';
          await supabase.rpc('log_audit', {
            _action: isUpdate ? 'UPDATE' : 'INSERT',
            _table_name: 'plano_contas',
            _record_id: recordId,
            _old_data: oldData ? JSON.stringify(oldData) : null,
            _new_data: data ? JSON.stringify(data) : null,
            _details: `${empresaTag}conta ${payload.codigo} — ${payload.descricao}`,
          });
        }
      } catch (auditErr) {
        console.warn('[plano_contas] Falha ao registrar auditoria', auditErr);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plano-contas'] });
      qc.invalidateQueries({ queryKey: ['plano-conta-history'] });
      toast.success('Conta salva');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
