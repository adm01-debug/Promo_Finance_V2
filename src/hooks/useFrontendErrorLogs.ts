import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Grupo de erros de frontend agregado por assinatura normalizada.
 * A assinatura remove UUIDs e números da mensagem, de modo que
 * "Falha ao carregar pedido 991" e "... 1042" colapsem no mesmo grupo.
 */
export interface FrontendErrorGroup {
  assinatura: string;
  exemplo_mensagem: string;
  severity: string;
  ocorrencias: number;
  usuarios_afetados: number;
  urls_distintas: number;
  primeira_ocorrencia: string;
  ultima_ocorrencia: string;
}

export interface FrontendErrorOccurrence {
  id: string;
  created_at: string;
  severity: string;
  error_message: string;
  error_stack: string | null;
  url: string | null;
  user_agent: string | null;
  user_id: string | null;
  metadata: unknown;
}

export type ErrorWindow = '24h' | '7d' | '30d';

const WINDOW_HOURS: Record<ErrorWindow, number> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
};

/** Converte a janela relativa em timestamp ISO absoluto para o servidor. */
export function windowToIso(win: ErrorWindow): string {
  return new Date(Date.now() - WINDOW_HOURS[win] * 3_600_000).toISOString();
}

export function useFrontendErrorGroups(win: ErrorWindow, severity: string | null) {
  return useQuery({
    queryKey: ['frontend-error-groups', win, severity],
    queryFn: async (): Promise<FrontendErrorGroup[]> => {
      const { data, error } = await supabase.rpc('get_frontend_error_groups', {
        p_desde: windowToIso(win),
        p_severity: severity,
        p_limit: 100,
      });
      if (error) throw error;
      return (data ?? []) as FrontendErrorGroup[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useFrontendErrorOccurrences(assinatura: string | null, win: ErrorWindow) {
  return useQuery({
    queryKey: ['frontend-error-occurrences', assinatura, win],
    enabled: Boolean(assinatura),
    queryFn: async (): Promise<FrontendErrorOccurrence[]> => {
      const { data, error } = await supabase.rpc('get_frontend_error_occurrences', {
        p_assinatura: assinatura as string,
        p_desde: windowToIso(win),
        p_limit: 50,
      });
      if (error) throw error;
      return (data ?? []) as FrontendErrorOccurrence[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Estado do alerta proativo por assinatura (Gap #24).
 * Alimentado pela Edge Function `monitorar-erros-frontend`, que roda a cada
 * 15 minutos e dispara e-mail/Slack quando uma assinatura ultrapassa o limiar.
 */
export interface FrontendErrorAlertState {
  assinatura: string;
  severity: string;
  exemplo_mensagem: string | null;
  primeiro_alerta_em: string;
  ultimo_alerta_em: string;
  ocorrencias_no_ultimo_alerta: number;
  alertas_enviados: number;
  silenciado_ate: string | null;
}

export function useFrontendErrorAlertState() {
  return useQuery({
    queryKey: ['frontend-error-alert-state'],
    queryFn: async (): Promise<FrontendErrorAlertState[]> => {
      const { data, error } = await supabase
        .from('frontend_error_alert_state')
        .select(
          'assinatura, severity, exemplo_mensagem, primeiro_alerta_em, ultimo_alerta_em, ocorrencias_no_ultimo_alerta, alertas_enviados, silenciado_ate',
        )
        .order('ultimo_alerta_em', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as FrontendErrorAlertState[];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Silencia (ou reativa) os alertas proativos de uma assinatura de erro — Gap #26.
 *
 * A escrita nunca acontece direto na tabela: `frontend_error_alert_state` não
 * concede UPDATE ao cliente. Passamos pela RPC `silenciar_alerta_erro_frontend`,
 * que valida o papel de admin, limita a janela a 720h e grava a ação na trilha
 * de auditoria. `horas = 0` reativa os alertas imediatamente.
 */
export function useSilenciarAlertaErro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { assinatura: string; horas: number; motivo?: string }) => {
      const { data, error } = await supabase.rpc('silenciar_alerta_erro_frontend', {
        p_assinatura: params.assinatura,
        p_horas: params.horas,
        p_motivo: params.motivo ?? null,
      });
      if (error) throw error;
      return data as unknown as FrontendErrorAlertState;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['frontend-error-alert-state'] });
      toast.success(
        vars.horas > 0
          ? `Alertas silenciados por ${vars.horas}h.`
          : 'Alertas reativados para esta assinatura.',
      );
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar o silenciamento.';
      toast.error(msg);
    },
  });
}
