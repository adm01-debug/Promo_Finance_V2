/**
 * Hook de persistência das entregas de obrigações acessórias (Etapa I).
 *
 * Cada registro representa o controle de uma obrigação (`obrigacao_id` do
 * catálogo em `src/lib/tributario/obrigacoes/catalogo.ts`) para uma
 * competência (`YYYY-MM`) de uma empresa. O upsert usa a constraint única
 * (empresa_id, obrigacao_id, competencia) para garantir idempotência.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaScope } from '@/contexts/useEmpresaScope';
import { toast } from 'sonner';

export type StatusEntrega = 'pendente' | 'entregue' | 'dispensada' | 'retificada';

export interface EntregaObrigacao {
  id: string;
  empresa_id: string;
  obrigacao_id: string;
  competencia: string;
  prazo: string;
  data_entrega: string | null;
  status: StatusEntrega;
  protocolo: string | null;
  valor_multa: number;
  observacoes: string | null;
  registrado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrarEntregaInput {
  obrigacaoId: string;
  competencia: string;
  prazo: string;
  status: StatusEntrega;
  dataEntrega?: string | null;
  protocolo?: string | null;
  valorMulta?: number;
  observacoes?: string | null;
}

const COLUNAS =
  'id,empresa_id,obrigacao_id,competencia,prazo,data_entrega,status,protocolo,valor_multa,observacoes,registrado_por,created_at,updated_at';

/** Chave estável usada para indexar entregas na UI. */
export const chaveEntrega = (obrigacaoId: string, competencia: string) =>
  `${obrigacaoId}::${competencia}`;

/**
 * Lista as entregas registradas da empresa em escopo, restrita ao intervalo
 * de competências exibido no calendário (evita varredura desnecessária).
 */
export function useEntregasObrigacoes(competencias: readonly string[]) {
  const { currentEmpresaId: empresaId } = useEmpresaScope();
  const inicio = competencias.length ? competencias.reduce((a, b) => (a < b ? a : b)) : null;
  const fim = competencias.length ? competencias.reduce((a, b) => (a > b ? a : b)) : null;

  return useQuery({
    queryKey: ['entregas-obrigacoes', empresaId, inicio, fim],
    enabled: Boolean(empresaId) && Boolean(inicio),
    queryFn: async (): Promise<EntregaObrigacao[]> => {
      const { data, error } = await supabase
        .from('entregas_obrigacoes')
        .select(COLUNAS)
        .eq('empresa_id', empresaId as string)
        .gte('competencia', inicio as string)
        .lte('competencia', fim as string)
        .order('competencia', { ascending: false });

      if (error) throw error;
      return (data ?? []) as EntregaObrigacao[];
    },
    staleTime: 30_000,
  });
}

/** Registra (ou atualiza) a entrega de uma obrigação de forma idempotente. */
export function useRegistrarEntregaObrigacao() {
  const queryClient = useQueryClient();
  const { currentEmpresaId: empresaId } = useEmpresaScope();

  return useMutation({
    mutationFn: async (input: RegistrarEntregaInput): Promise<EntregaObrigacao> => {
      if (!empresaId) throw new Error('Selecione uma empresa para registrar a entrega.');

      const { data: sessao } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('entregas_obrigacoes')
        .upsert(
          {
            empresa_id: empresaId,
            obrigacao_id: input.obrigacaoId,
            competencia: input.competencia,
            prazo: input.prazo,
            status: input.status,
            data_entrega: input.status === 'entregue' ? (input.dataEntrega ?? null) : null,
            protocolo: input.protocolo ?? null,
            valor_multa: input.valorMulta ?? 0,
            observacoes: input.observacoes ?? null,
            registrado_por: sessao.user?.id ?? null,
          },
          { onConflict: 'empresa_id,obrigacao_id,competencia' }
        )
        .select(COLUNAS)
        .single();

      if (error) throw error;
      return data as EntregaObrigacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregas-obrigacoes'] });
    },
    onError: (error: unknown) => {
      const mensagem = error instanceof Error ? error.message : 'Falha ao registrar a entrega.';
      toast.error(mensagem);
    },
  });
}
