import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type EventoContaTipo = 'receber' | 'pagar';

export interface RegistrarEventoParams {
  /** Conta financeira alvo (contas_receber.id ou contas_pagar.id) */
  contaId: string;
  /** Tipo do evento (ex.: 'conciliacao', 'envio_boleto', 'baixa_automatica') */
  tipo: string;
  /** Mensagem humana registrada na trilha de auditoria */
  mensagem: string;
  /** Metadados estruturados adicionais */
  metadata?: Json;
}

export interface RegistrarEventoResult {
  ok: boolean;
  /** Mensagem de erro já normalizada para exibição ao usuário */
  error?: string;
}

/**
 * Registra um evento na trilha de auditoria financeira.
 *
 * As RPCs `registrar_evento_receber` / `registrar_evento_pagar` são SECURITY DEFINER
 * e validam sessão + acesso à empresa da conta. Antes essas chamadas eram feitas com
 * `await` sem inspeção de `error`, o que fazia falhas de autorização passarem
 * silenciosamente. Esta função centraliza o tratamento.
 *
 * Nunca lança: retorna um resultado explícito para o chamador decidir se o erro é
 * fatal (abortar a mutação) ou apenas degradação (avisar via toast).
 */
export async function registrarEventoFinanceiro(
  destino: EventoContaTipo,
  params: RegistrarEventoParams,
): Promise<RegistrarEventoResult> {
  const { contaId, tipo, mensagem, metadata } = params;

  if (!contaId) {
    return { ok: false, error: 'Conta financeira não informada para o registro de evento.' };
  }

  const fn = destino === 'receber' ? 'registrar_evento_receber' : 'registrar_evento_pagar';

  try {
    const { error } = await supabase.rpc(fn, {
      p_conta_id: contaId,
      p_tipo: tipo,
      p_mensagem: mensagem,
      p_metadata: (metadata ?? {}) as Json,
    });

    if (error) {
      if (import.meta.env.DEV) {
        console.error(`[registrarEventoFinanceiro:${fn}]`, error);
      }
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha inesperada ao registrar evento.';
    if (import.meta.env.DEV) {
      console.error(`[registrarEventoFinanceiro:${fn}]`, err);
    }
    return { ok: false, error: message };
  }
}

/**
 * Variante que propaga o erro — usar dentro de `mutationFn` quando a trilha de
 * auditoria for parte indissociável da operação (ex.: conciliação manual).
 */
export async function registrarEventoFinanceiroOrThrow(
  destino: EventoContaTipo,
  params: RegistrarEventoParams,
): Promise<void> {
  const result = await registrarEventoFinanceiro(destino, params);
  if (!result.ok) {
    throw new Error(result.error ?? 'Falha ao registrar evento financeiro.');
  }
}
