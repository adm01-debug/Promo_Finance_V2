/**
 * Hook de auditoria das rejeições dos overlays de catálogo fiscal.
 *
 * Leitura: direta na tabela `overlay_rejeicoes_auditoria` (RLS libera SELECT
 * para autenticados). Escrita: sempre via Edge Function, que valida o papel
 * do usuário no servidor — o cliente nunca decide sobre permissão.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CatalogoOverlay, RejeicaoAuditavel, SeveridadeRejeicao } from '@/lib/tributario/catalogos/rejeicoes-auditoria';

export interface RejeicaoAuditoriaRegistro {
  id: string;
  catalogo: CatalogoOverlay;
  identificador: string;
  descricao: string | null;
  campo: string;
  motivo: string;
  valor_recebido: string | null;
  severidade: SeveridadeRejeicao;
  referencia: string;
  ocorrencias: number;
  primeira_deteccao: string;
  ultima_deteccao: string;
  resolvido_em: string | null;
  observacao: string | null;
}

export interface FiltrosAuditoriaOverlay {
  catalogo?: CatalogoOverlay | 'todos';
  situacao?: 'todas' | 'abertas' | 'resolvidas';
  busca?: string;
}

const CHAVE = ['overlay-rejeicoes-auditoria'] as const;

export function useOverlayRejeicoesAuditoria(filtros: FiltrosAuditoriaOverlay = {}) {
  const { catalogo = 'todos', situacao = 'abertas', busca = '' } = filtros;

  return useQuery<RejeicaoAuditoriaRegistro[]>({
    queryKey: [...CHAVE, catalogo, situacao, busca],
    staleTime: 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('overlay_rejeicoes_auditoria')
        .select(
          'id, catalogo, identificador, descricao, campo, motivo, valor_recebido, severidade, referencia, ocorrencias, primeira_deteccao, ultima_deteccao, resolvido_em, observacao',
        )
        .order('ultima_deteccao', { ascending: false })
        .limit(500);

      if (catalogo !== 'todos') query = query.eq('catalogo', catalogo);
      if (situacao === 'abertas') query = query.is('resolvido_em', null);
      if (situacao === 'resolvidas') query = query.not('resolvido_em', 'is', null);
      if (busca.trim()) {
        const termo = `%${busca.trim()}%`;
        query = query.or(
          `identificador.ilike.${termo},descricao.ilike.${termo},motivo.ilike.${termo},campo.ilike.${termo}`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as RejeicaoAuditoriaRegistro[];
    },
  });
}

/** Envia o lote de rejeições detectadas em runtime para a API de auditoria. */
export function useRegistrarRejeicoesOverlay() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { referencia: string; rejeicoes: RejeicaoAuditavel[] }) => {
      const { data, error } = await supabase.functions.invoke('overlay-rejeicoes-auditoria', {
        body: { acao: 'registrar', ...payload },
      });
      if (error) throw error;
      return data as { inseridos: number; atualizados: number };
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: CHAVE });
    },
  });
}

/** Marca (ou reabre) uma rejeição como corrigida na origem. */
export function useResolverRejeicaoOverlay() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; resolvido: boolean; observacao?: string | null }) => {
      const { data, error } = await supabase.functions.invoke('overlay-rejeicoes-auditoria', {
        body: { acao: 'resolver', ...payload },
      });
      if (error) throw error;
      return data as { ok: boolean };
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: CHAVE });
    },
  });
}
