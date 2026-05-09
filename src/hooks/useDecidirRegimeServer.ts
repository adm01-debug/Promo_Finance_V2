// ============================================
// HOOK: useDecidirRegimeServer
// Chama a Edge Function `decidir-regime` (orquestração server-side).
// Persiste em regimes_simulados e retorna resultado completo.
// ============================================
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ResultadoDecisao, RegimeTributario, ParametrosSimulacao } from '@/lib/tributario';

export interface DecidirRegimeServerInput {
  empresaId: string;
  anoReferencia?: number;
  mesReferencia?: number;
  regimeAtual?: RegimeTributario;
  parametrosOverride?: Partial<ParametrosSimulacao>;
  persist?: boolean;
}

export interface DecidirRegimeServerOutput extends ResultadoDecisao {
  simulacaoId: string | null;
  params: ParametrosSimulacao;
}

export function useDecidirRegimeServer() {
  return useMutation<DecidirRegimeServerOutput, Error, DecidirRegimeServerInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke('decidir-regime', {
        body: input,
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) {
        throw new Error((data as { error: string }).error);
      }
      return data as DecidirRegimeServerOutput;
    },
    onError: (err) => {
      toast.error('Erro na simulação server-side', { description: err.message });
    },
    onSuccess: (data) => {
      toast.success(`Regime recomendado: ${data.recomendado.nome}`, {
        description: `Carga efetiva: ${data.recomendado.cargaEfetiva.toFixed(2)}%`,
      });
    },
  });
}
