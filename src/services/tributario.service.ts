
import { supabase } from "@/integrations/supabase/client";
import type { ParametrosSimulacao, ResultadoCenario, ResultadoDecisao } from "@/lib/tributario/types";

export class TributarioService {
  /**
   * Simula o Simples Nacional chamando a Edge Function
   */
  static async simularSimples(params: ParametrosSimulacao & { rbt12?: number, folha12m?: number, anexoForcado?: string }): Promise<ResultadoCenario> {
    const { data, error } = await supabase.functions.invoke('simular-simples', {
      body: {
        faturamentoAnual: params.faturamentoAnual,
        rbt12: params.rbt12 || params.faturamentoAnual,
        folha12m: params.folha12m || params.folhaAnual || 0,
        percentualServicos: params.percentualServicos,
        anexoForcado: params.anexoForcado
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Simula o Lucro Presumido chamando a Edge Function
   */
  static async simularPresumido(params: ParametrosSimulacao): Promise<ResultadoCenario> {
    const { data, error } = await supabase.functions.invoke('simular-presumido', {
      body: params
    });

    if (error) throw error;
    return data;
  }

  /**
   * Simula o Lucro Real chamando a Edge Function
   */
  static async simularReal(params: ParametrosSimulacao): Promise<ResultadoCenario> {
    const { data, error } = await supabase.functions.invoke('simular-real', {
      body: params
    });

    if (error) throw error;
    return data;
  }

  /**
   * Decide o regime tributário chamando a Edge Function decidir-regime
   */
  static async decidirRegime(params: ParametrosSimulacao): Promise<ResultadoDecisao> {
    const { data, error } = await supabase.functions.invoke('decidir-regime', {
      body: params
    });

    if (error) throw error;
    return data;
  }
}
