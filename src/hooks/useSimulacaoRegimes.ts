import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { decidirRegime } from '@/lib/tributario';
import { VERSAO_MOTOR_TRIBUTARIO, versaoDesatualizada } from '@/lib/tributario/versao';
import type {
  ParametrosSimulacao,
  ResultadoDecisao,
  ResultadoCenario,
  RegimeTributario,
  FaturamentoMes,
  FolhaMes,
} from '@/lib/tributario/types';
import { useDecidirRegimeServer } from './useDecidirRegimeServer';
import { toast } from 'sonner';

interface UseSimulacaoOptions {
  empresaId?: string;
  anoReferencia?: number;
  mesReferencia?: number;
}

export interface SimulaoHistoricoItem {
  id: string;
  empresa_id: string;
  ano_referencia: number;
  rbt12: number;
  folha_12m: number;
  fator_r: number | null;
  regime_atual: string | null;
  regime_recomendado: string;
  /** Cenários serializados no momento do salvamento (snapshot imutável). */
  cenarios: ResultadoCenario[];
  alertas: string[];
  justificativa: string;
  economia_anual_estimada: number | null;
  /** Parâmetros de entrada usados na simulação — base da reprodutibilidade. */
  parametros: Partial<ParametrosSimulacao>;
  created_by: string | null;
  audit_log_id: string | null;
  data_simulacao: string;
  /** Versão do motor que gerou o snapshot (null em registros legados). */
  versao_motor: string | null;
}

/** Item de histórico enriquecido com a auditoria de drift do motor. */
export interface SimulacaoHistoricoAuditada extends SimulaoHistoricoItem {
  /** Snapshot gerado por versão anterior do motor. */
  motorDesatualizado: boolean;
  /** Regime obtido ao recalcular o snapshot com o motor corrente. */
  regimeRecalculado: RegimeTributario | null;
  /** True quando o recálculo diverge do regime recomendado salvo. */
  divergente: boolean;
}


const REGIMES_VALIDOS: readonly RegimeTributario[] = [
  'simples_nacional',
  'lucro_presumido',
  'lucro_real',
];

/** Narrowing defensivo: o jsonb do banco não tem garantia de forma. */
function normalizarParametros(bruto: unknown): Partial<ParametrosSimulacao> | null {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null;
  const registro = bruto as Record<string, unknown>;
  if (typeof registro.faturamentoAnual !== 'number') return null;
  return registro as Partial<ParametrosSimulacao>;
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
  const decidirRegimeServer = useDecidirRegimeServer();

  const [parametros, setParametros] = useState<ParametrosSimulacao>(DEFAULT_PARAMS);
  const [regimeAtual, setRegimeAtual] = useState<RegimeTributario | undefined>();
  const [serverResult, setServerResult] = useState<ResultadoDecisao | null>(null);

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
      return (data ?? []) as unknown as SimulaoHistoricoItem[];
    },
    enabled: !!empresaId,
    staleTime: 60_000,
  });

  /**
   * Auditoria de drift: recalcula cada snapshot com o motor corrente e marca
   * divergências de recomendação. Erros de recálculo (snapshots corrompidos ou
   * incompletos) degradam para "não auditável" em vez de quebrar a página.
   */
  const historicoAuditado: SimulacaoHistoricoAuditada[] = useMemo(
    () =>
      historicoSimulacoes.map((item) => {
        const parametrosSnapshot = normalizarParametros(item.parametros);
        let regimeRecalculado: RegimeTributario | null = null;
        if (parametrosSnapshot) {
          try {
            const recalculo = decidirRegime(
              { ...DEFAULT_PARAMS, ...parametrosSnapshot },
              {
                anoReferencia: item.ano_referencia,
                mesReferencia,
                regimeAtual: REGIMES_VALIDOS.find((r) => r === item.regime_atual),
              },
            );
            regimeRecalculado = recalculo.recomendado.regime;
          } catch {
            regimeRecalculado = null;
          }
        }
        return {
          ...item,
          motorDesatualizado: versaoDesatualizada(item.versao_motor),
          regimeRecalculado,
          divergente: regimeRecalculado !== null && regimeRecalculado !== item.regime_recomendado,
        };
      }),
    [historicoSimulacoes, mesReferencia],
  );



  // Mescla parâmetros manuais com histórico real
  const parametrosCompletos: ParametrosSimulacao = useMemo(
    () => ({
      ...parametros,
      faturamentoMensal: faturamentoMensal.length > 0 ? faturamentoMensal : undefined,
      folhaMensal: folhaMensal.length > 0 ? folhaMensal : undefined,
    }),
    [parametros, faturamentoMensal, folhaMensal],
  );

  // Resultado da simulação (computado em memória ou retornado do server)
  const resultado: ResultadoDecisao = useMemo(() => {
    if (serverResult) return serverResult;
    return decidirRegime(parametrosCompletos, {
      anoReferencia,
      mesReferencia,
      regimeAtual,
    });
  }, [parametrosCompletos, anoReferencia, mesReferencia, regimeAtual, serverResult]);

  const isRecomendacaoIA = !!resultado.justificativaIA;

  const sincronizarComServer = async () => {
    if (!empresaId) return;
    try {
      const res = await decidirRegimeServer.mutateAsync({
        empresaId,
        anoReferencia,
        mesReferencia,
        regimeAtual,
        parametrosOverride: parametros,
        persist: false,
      });
      setServerResult(res);
    } catch (e) {
      console.error('Erro ao sincronizar com servidor:', e);
    }
  };

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
        cenarios: resultado.cenarios as unknown as Json,
        alertas: resultado.alertas as unknown as Json,
        justificativa: resultado.justificativa,
        economia_anual_estimada: resultado.economiaAnualVsAtual ?? null,
        parametros: parametros as unknown as Json,
        created_by: user?.id ?? null,
        audit_log_id: resultado.auditLogId ?? null,
        versao_motor: VERSAO_MOTOR_TRIBUTARIO,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Simulação salva no histórico');
      queryClient.invalidateQueries({ queryKey: ['regimes-simulados', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Restaura uma simulação salva: repõe os parâmetros de entrada e o regime
   * atual do snapshot, permitindo reproduzir e auditar o resultado histórico
   * com o motor corrente (detecta divergências causadas por mudanças de tabela).
   */
  const restaurarSimulacao = (item: SimulaoHistoricoItem) => {
    const parametrosSnapshot = normalizarParametros(item.parametros);
    if (!parametrosSnapshot) {
      toast.error('Snapshot sem parâmetros válidos — não é possível restaurar.');
      return;
    }
    setParametros((atual) => ({ ...atual, ...parametrosSnapshot }));
    const regimeSnapshot = REGIMES_VALIDOS.find((r) => r === item.regime_atual);
    setRegimeAtual(regimeSnapshot);
    setServerResult(null);
    toast.success('Parâmetros restaurados a partir do histórico');
  };

  return {

    parametros,
    setParametros: (p: ParametrosSimulacao | ((prev: ParametrosSimulacao) => ParametrosSimulacao)) => {
      setParametros(p);
      setServerResult(null);
    },
    regimeAtual,
    setRegimeAtual: (r: RegimeTributario | undefined) => {
      setRegimeAtual(r);
      setServerResult(null);
    },
    resultado,
    faturamentoMensal,
    folhaMensal,
    historicoSimulacoes: historicoAuditado,
    versaoMotor: VERSAO_MOTOR_TRIBUTARIO,
    restaurarSimulacao,
    salvarSimulacao,
    sincronizarComServer,
    isSincronizando: decidirRegimeServer.isPending,
    isRecomendacaoIA,
    temHistoricoSuficiente: faturamentoMensal.length >= 12,
  };
}

export default useSimulacaoRegimes;