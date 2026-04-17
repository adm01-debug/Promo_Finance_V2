// ============================================
// HOOK: Oportunidades de Elisão Fiscal
// ============================================

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  analisarOportunidadesElisao,
  type ContextoEmpresa,
  type RelatorioElisao,
  type RegimeAplicavel,
} from '@/lib/tributario/elisao';
import { toast } from 'sonner';

interface UseElisaoOptions {
  empresaId?: string;
  contexto?: Partial<ContextoEmpresa>;
}

export function useOportunidadesElisao({ empresaId, contexto }: UseElisaoOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Catálogo de estratégias (referência)
  const { data: catalogo = [] } = useQuery({
    queryKey: ['estrategias-elisao-catalogo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estrategias_elisao_catalogo')
        .select('*')
        .eq('ativo', true)
        .order('codigo');
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60_000,
  });

  // Oportunidades já persistidas para essa empresa
  const { data: oportunidadesSalvas = [], isLoading } = useQuery({
    queryKey: ['oportunidades-elisao', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('oportunidades_elisao')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('economia_estimada', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
    staleTime: 60_000,
  });

  // Histórico de faturamento + folha (alimentam o contexto)
  const { data: historicoFat = [] } = useQuery({
    queryKey: ['faturamento-mensal', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('faturamento_mensal')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  const { data: historicoFolha = [] } = useQuery({
    queryKey: ['folha-pagamento', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('folha_pagamento')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });

  // Monta contexto a partir do histórico + overrides do usuário
  const contextoCalculado: ContextoEmpresa = useMemo(() => {
    const rbt12 = historicoFat.reduce((acc, f) => acc + Number(f.receita_bruta || 0), 0);
    const folhaAnual = historicoFolha.reduce((acc, f) => acc + Number(f.total_folha || 0), 0);
    const receitaExp = historicoFat.reduce((acc, f) => acc + Number(f.receita_exportacao || 0), 0);

    return {
      empresa_id: empresaId ?? '',
      regime_atual: (contexto?.regime_atual ?? 'simples') as RegimeAplicavel,
      rbt12: contexto?.rbt12 ?? rbt12,
      faturamento_anual: contexto?.faturamento_anual ?? rbt12,
      receita_exportacao: contexto?.receita_exportacao ?? receitaExp,
      receita_importacao: contexto?.receita_importacao ?? 0,
      patrimonio_liquido: contexto?.patrimonio_liquido ?? 0,
      lucro_liquido: contexto?.lucro_liquido ?? 0,
      folha_total_anual: contexto?.folha_total_anual ?? folhaAnual,
      despesas_pd: contexto?.despesas_pd ?? 0,
      beneficio_icms_anual: contexto?.beneficio_icms_anual ?? 0,
      dividendos_pf_anual: contexto?.dividendos_pf_anual ?? 0,
      carga_tributaria_atual: contexto?.carga_tributaria_atual,
      cnae: contexto?.cnae,
    };
  }, [historicoFat, historicoFolha, empresaId, contexto]);

  // Análise em memória (sempre fresca)
  const relatorio: RelatorioElisao = useMemo(
    () => analisarOportunidadesElisao(contextoCalculado),
    [contextoCalculado],
  );

  // Persiste oportunidades aplicáveis na tabela oportunidades_elisao
  const persistirOportunidades = useMutation({
    mutationFn: async () => {
      if (!empresaId) throw new Error('Selecione uma empresa antes de salvar.');

      // Limpa oportunidades anteriores em status "identificada" para evitar duplicatas
      await supabase
        .from('oportunidades_elisao')
        .delete()
        .eq('empresa_id', empresaId)
        .eq('status', 'identificada');

      const aplicaveis = relatorio.oportunidades.filter((o) => o.aplicavel);
      if (aplicaveis.length === 0) return 0;

      const linhas = aplicaveis.map((o) => ({
        empresa_id: empresaId,
        estrategia: o.estrategia,
        categoria: o.nome,
        aplicavel: o.aplicavel,
        economia_estimada: o.economia_estimada,
        base_legal: o.base_legal,
        risco: o.risco,
        observacoes: `${o.justificativa}\n\nPróximos passos:\n- ${o.proximos_passos.join('\n- ')}${o.observacoes ? `\n\nNota: ${o.observacoes}` : ''}`,
        status: 'identificada',
        data_identificacao: new Date().toISOString().slice(0, 10),
        created_by: user?.id ?? null,
      }));

      const { error } = await supabase.from('oportunidades_elisao').insert(linhas);
      if (error) throw error;
      return aplicaveis.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} oportunidade(s) salva(s) no histórico da empresa`);
      queryClient.invalidateQueries({ queryKey: ['oportunidades-elisao', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('oportunidades_elisao')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado');
      queryClient.invalidateQueries({ queryKey: ['oportunidades-elisao', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    catalogo,
    contextoCalculado,
    relatorio,
    oportunidadesSalvas,
    isLoading,
    persistirOportunidades,
    atualizarStatus,
    temHistoricoSuficiente: historicoFat.length >= 12,
  };
}
