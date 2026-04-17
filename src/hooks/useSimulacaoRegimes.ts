// ============================================
// HOOK: Simulação Comparativa de Regimes
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { decidirRegime } from '@/lib/tributario';
import type {
  ParametrosSimulacao,
  ResultadoDecisao,
  RegimeTributario,
  FaturamentoMes,
  FolhaMes,
} from '@/lib/tributario';
import { toast } from 'sonner';

interface UseSimulacaoOptions {
  empresaId?: string;
  anoReferencia?: number;
  mesReferencia?: number;
}

const DEFAULT_PARAMS: ParametrosSimulacao = {
  faturamentoAnual: 1_000_000,
  margemLucro: 15,
  percentualServicos: 30,
  folhaAnual: 200_000,
  comprasComCredito: 300_000,
  despesasOperacionais: 100_000,
};

export function useSimulacaoRegimes(options: UseSimulacaoOptions = {}) {
  const { empresaId, anoReferencia = new Date().getFullYear(), mesReferencia = new Date().getMonth() + 1 } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [parametros, setParametros] = useState<ParametrosSimulacao>(DEFAULT_PARAMS);
  const [regimeAtual, setRegimeAtual] = useState<RegimeTributario | undefined>();

  // Histórico de faturamento
  const { data: faturamentoMensal = [] } = useQuery({
    queryKey: ['faturamento-mensal', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('faturamento_mensal')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data || []) as FaturamentoMes[];
    },
    enabled: !!empresaId,
    staleTime: 5 * 60_000,
  });

  // Histórico de folha
  const { data: folhaMensal = [] } = useQuery({
    queryKey: ['folha-pagamento', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('folha_pagamento')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data || []) as FolhaMes[];
    },
    enabled: !!empresaId,
    staleTime: 5 * 60_000,
  });

  // Histórico de simulações salvas
  const { data: historicoSimulacoes = [] } = useQuery({
    queryKey: ['regimes-simulados', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('regimes_simulados')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_simulacao', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
    staleTime: 60_000,
  });

  // Mescla parâmetros manuais com histórico real
  const parametrosCompletos: ParametrosSimulacao = useMemo(
    () => ({
      ...parametros,
      faturamentoMensal: faturamentoMensal.length > 0 ? faturamentoMensal : undefined,
      folhaMensal: folhaMensal.length > 0 ? folhaMensal : undefined,
    }),
    [parametros, faturamentoMensal, folhaMensal],
  );

  // Resultado da simulação (computado em memória)
  const resultado: ResultadoDecisao = useMemo(
    () =>
      decidirRegime(parametrosCompletos, {
        anoReferencia,
        mesReferencia,
        regimeAtual,
      }),
    [parametrosCompletos, anoReferencia, mesReferencia, regimeAtual],
  );

  // Salvar simulação no histórico
  const salvarSimulacao = useMutation({
    mutationFn: async () => {
      if (!empresaId) throw new Error('Selecione uma empresa para salvar a simulação.');
      const { error } = await supabase.from('regimes_simulados').insert({
        empresa_id: empresaId,
        ano_referencia: anoReferencia,
        rbt12: resultado.recomendado.rbt12 || parametros.faturamentoAnual,
        folha_12m: parametros.folhaAnual || 0,
        fator_r: resultado.recomendado.fatorR ?? null,
        regime_atual: regimeAtual ?? null,
        regime_recomendado: resultado.recomendado.regime,
        cenarios: resultado.cenarios as never,
        alertas: resultado.alertas as never,
        justificativa: resultado.justificativa,
        economia_anual_estimada: resultado.economiaAnualVsAtual ?? null,
        parametros: parametros as never,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Simulação salva no histórico');
      queryClient.invalidateQueries({ queryKey: ['regimes-simulados', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    parametros,
    setParametros,
    regimeAtual,
    setRegimeAtual,
    resultado,
    faturamentoMensal,
    folhaMensal,
    historicoSimulacoes,
    salvarSimulacao,
    temHistoricoSuficiente: faturamentoMensal.length >= 12,
  };
}
