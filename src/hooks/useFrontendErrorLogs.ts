import { useQuery } from '@tanstack/react-query';
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
