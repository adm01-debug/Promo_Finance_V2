/**
 * Etapa K — Persistência do histórico do Score de Conformidade Fiscal.
 *
 * Cada linha de `public.conformidade_snapshots` é a fotografia do score de uma
 * empresa em uma competência (`AAAA-MM`). O upsert usa a constraint única
 * (empresa_id, competencia), garantindo idempotência ao recalcular.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaScope } from '@/contexts/EmpresaScopeContext';
import { toast } from 'sonner';
import { paraSnapshot, type PontoHistorico } from '@/lib/tributario/obrigacoes';

export interface ConformidadeSnapshot {
  id: string;
  empresa_id: string;
  competencia: string;
  score: number;
  nivel: 'critico' | 'atencao' | 'bom' | 'excelente';
  total_obrigacoes: number;
  entregues: number;
  vencidas_pendentes: number;
  entregues_com_atraso: number;
  pontualidade: number;
  multa_registrada: number;
  gerado_por: string | null;
  created_at: string;
  updated_at: string;
}

const COLUNAS =
  'id,empresa_id,competencia,score,nivel,total_obrigacoes,entregues,vencidas_pendentes,entregues_com_atraso,pontualidade,multa_registrada,gerado_por,created_at,updated_at';

/**
 * Lista os snapshots persistidos de uma empresa explícita (ordem cronológica).
 * Usado por telas que escolhem a empresa localmente, como o Dashboard Tributário.
 */
export function useConformidadeSnapshotsDaEmpresa(empresaId?: string, limite = 24) {
  return useQuery({
    queryKey: ['conformidade-snapshots', empresaId, limite],
    enabled: Boolean(empresaId),
    queryFn: async (): Promise<ConformidadeSnapshot[]> => {
      const { data, error } = await supabase
        .from('conformidade_snapshots')
        .select(COLUNAS)
        .eq('empresa_id', empresaId as string)
        .order('competencia', { ascending: false })
        .limit(limite);

      if (error) throw error;
      const linhas = (data ?? []) as unknown as ConformidadeSnapshot[];
      return [...linhas].sort((a, b) => (a.competencia < b.competencia ? -1 : 1));
    },
    staleTime: 30_000,
  });
}

/** Lista os snapshots persistidos da empresa em escopo, do mais antigo ao mais recente. */
export function useConformidadeSnapshots(limite = 24) {
  const { currentEmpresaId: empresaId } = useEmpresaScope();
  return useConformidadeSnapshotsDaEmpresa(empresaId ?? undefined, limite);
}


/**
 * Grava (ou regrava) os snapshots das competências informadas.
 * Recebe pontos já calculados pelo motor determinístico — nenhuma regra de
 * negócio é reimplementada aqui.
 */
export function useSalvarConformidadeSnapshots() {
  const queryClient = useQueryClient();
  const { currentEmpresaId: empresaId } = useEmpresaScope();

  return useMutation({
    mutationFn: async (pontos: readonly PontoHistorico[]): Promise<number> => {
      if (!empresaId) throw new Error('Selecione uma empresa para salvar o histórico.');
      if (pontos.length === 0) return 0;

      const { data: sessao } = await supabase.auth.getUser();
      const linhas = pontos.map((ponto) => ({
        ...paraSnapshot(ponto),
        empresa_id: empresaId,
        gerado_por: sessao.user?.id ?? null,
      }));

      const { error } = await supabase
        .from('conformidade_snapshots')
        .upsert(linhas, { onConflict: 'empresa_id,competencia' });

      if (error) throw error;
      return linhas.length;
    },
    onSuccess: (quantidade) => {
      queryClient.invalidateQueries({ queryKey: ['conformidade-snapshots'] });
      if (quantidade > 0) {
        toast.success(`${quantidade} competência(s) registradas no histórico de conformidade.`);
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar o histórico.');
    },
  });
}
