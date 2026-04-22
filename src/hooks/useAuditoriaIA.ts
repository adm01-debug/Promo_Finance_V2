import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditoriaIARow {
  id: string;
  created_at: string;
  acao: 'aprovado' | 'rejeitado';
  tipo_lancamento: 'pagar' | 'receber';
  score_ia: number;
  confianca: 'alta' | 'media' | 'baixa';
  motivos: Array<{ tipo: string; peso: number; detalhe: string }>;
  analise_ia: string | null;
  transacao_bancaria_id: string | null;
  conta_pagar_id: string | null;
  conta_receber_id: string | null;
  aprovado_por: string | null;
  // Enriched
  user_email: string | null;
  user_full_name: string | null;
  empresa_id: string | null;
  empresa_cnpj: string | null;
  empresa_razao_social: string | null;
  transacao_descricao: string | null;
  transacao_valor: number | null;
  transacao_data: string | null;
  motivo_rejeicao: string | null;
}

interface RawHistorico {
  id: string;
  created_at: string;
  acao: string;
  tipo_lancamento: string;
  score_ia: number;
  confianca: string;
  motivos: unknown;
  analise_ia: string | null;
  transacao_bancaria_id: string | null;
  conta_pagar_id: string | null;
  conta_receber_id: string | null;
  aprovado_por: string | null;
}

export function useAuditoriaIA() {
  return useQuery({
    queryKey: ['auditoria-ia'],
    queryFn: async (): Promise<AuditoriaIARow[]> => {
      const { data: historico, error } = await supabase
        .from('historico_conciliacao_ia')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      const rows = (historico ?? []) as RawHistorico[];
      if (rows.length === 0) return [];

      const userIds = Array.from(new Set(rows.map((r) => r.aprovado_por).filter(Boolean) as string[]));
      const txIds = Array.from(new Set(rows.map((r) => r.transacao_bancaria_id).filter(Boolean) as string[]));

      const [profilesRes, txsRes, feedbackRes] = await Promise.all([
        userIds.length
          ? supabase.from('profiles').select('id,email,full_name').in('id', userIds)
          : Promise.resolve({ data: [], error: null } as { data: Array<{ id: string; email: string | null; full_name: string | null }> | null; error: null }),
        txIds.length
          ? supabase
              .from('transacoes_bancarias')
              .select('id,descricao,valor,data,conta_bancaria_id')
              .in('id', txIds)
          : Promise.resolve({ data: [], error: null } as { data: Array<{ id: string; descricao: string | null; valor: number | null; data: string | null; conta_bancaria_id: string | null }> | null; error: null }),
        txIds.length
          ? supabase
              .from('feedback_conciliacao_ia')
              .select('transacao_bancaria_id,motivo_rejeicao,acao,created_at')
              .in('transacao_bancaria_id', txIds)
              .eq('acao', 'rejeitado')
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null } as { data: Array<{ transacao_bancaria_id: string | null; motivo_rejeicao: string | null; acao: string; created_at: string }> | null; error: null }),
      ]);

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
      const txMap = new Map((txsRes.data ?? []).map((t) => [t.id, t]));

      const contaIds = Array.from(
        new Set((txsRes.data ?? []).map((t) => t.conta_bancaria_id).filter(Boolean) as string[]),
      );

      const contasRes = contaIds.length
        ? await supabase.from('contas_bancarias').select('id,empresa_id').in('id', contaIds)
        : { data: [] as Array<{ id: string; empresa_id: string | null }> };
      const contaMap = new Map((contasRes.data ?? []).map((c) => [c.id, c]));

      const empresaIds = Array.from(
        new Set((contasRes.data ?? []).map((c) => c.empresa_id).filter(Boolean) as string[]),
      );
      const empresasRes = empresaIds.length
        ? await supabase.from('empresas').select('id,cnpj,razao_social').in('id', empresaIds)
        : { data: [] as Array<{ id: string; cnpj: string | null; razao_social: string | null }> };
      const empresaMap = new Map((empresasRes.data ?? []).map((e) => [e.id, e]));

      // Mais recente motivo de rejeição por transação
      const motivoMap = new Map<string, string | null>();
      (feedbackRes.data ?? []).forEach((f) => {
        if (f.transacao_bancaria_id && !motivoMap.has(f.transacao_bancaria_id)) {
          motivoMap.set(f.transacao_bancaria_id, f.motivo_rejeicao);
        }
      });

      return rows.map((r) => {
        const profile = r.aprovado_por ? profileMap.get(r.aprovado_por) : undefined;
        const tx = r.transacao_bancaria_id ? txMap.get(r.transacao_bancaria_id) : undefined;
        const conta = tx?.conta_bancaria_id ? contaMap.get(tx.conta_bancaria_id) : undefined;
        const empresa = conta?.empresa_id ? empresaMap.get(conta.empresa_id) : undefined;
        return {
          id: r.id,
          created_at: r.created_at,
          acao: r.acao as 'aprovado' | 'rejeitado',
          tipo_lancamento: r.tipo_lancamento as 'pagar' | 'receber',
          score_ia: r.score_ia,
          confianca: r.confianca as 'alta' | 'media' | 'baixa',
          motivos: Array.isArray(r.motivos) ? (r.motivos as AuditoriaIARow['motivos']) : [],
          analise_ia: r.analise_ia,
          transacao_bancaria_id: r.transacao_bancaria_id,
          conta_pagar_id: r.conta_pagar_id,
          conta_receber_id: r.conta_receber_id,
          aprovado_por: r.aprovado_por,
          user_email: profile?.email ?? null,
          user_full_name: profile?.full_name ?? null,
          empresa_id: empresa?.id ?? null,
          empresa_cnpj: empresa?.cnpj ?? null,
          empresa_razao_social: empresa?.razao_social ?? null,
          transacao_descricao: tx?.descricao ?? null,
          transacao_valor: tx?.valor ?? null,
          transacao_data: tx?.data ?? null,
          motivo_rejeicao: r.transacao_bancaria_id ? motivoMap.get(r.transacao_bancaria_id) ?? null : null,
        } satisfies AuditoriaIARow;
      });
    },
  });
}
