import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLogAudit } from "./useAuditLog";

const SEVERIDADE_ORDEM: Record<string, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export interface Anomalia {
  id: string;
  empresa_id: string | null;
  entidade_tipo: string;
  entidade_id: string | null;
  tipo_anomalia:
    | "movimentacao_outlier"
    | "pagamento_duplicado"
    | "conta_pagar_alta"
    | "conciliacao_atrasada"
    | "mudanca_regime_brusca";
  severidade: "baixa" | "media" | "alta" | "critica";
  descricao: string;
  dados: unknown;
  status: "nova" | "investigando" | "falso_positivo" | "confirmada";
  detectada_em: string;
  resolvida_em: string | null;
  resolvida_por: string | null;
  observacoes: string | null;
  bitrix_task_id: string | null;
}

export function useAnomaliasDetectadas(filtroStatus?: Anomalia["status"]) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["anomalias-detectadas", filtroStatus ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("anomalias_detectadas")
        .select("*")
        .order("detectada_em", { ascending: false })
        .limit(200);
      if (filtroStatus) q = q.eq("status", filtroStatus);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Anomalia[];
    },
    refetchInterval: 60_000,
  });

  const atualizarStatus = useMutation({
    mutationFn: async (input: {
      id: string;
      status: Anomalia["status"];
      observacoes?: string;
    }) => {
      const update: Record<string, unknown> = {
        status: input.status,
        observacoes: input.observacoes ?? null,
      };
      if (input.status === "falso_positivo" || input.status === "confirmada") {
        update.resolvida_em = new Date().toISOString();
      }
      const { error } = await supabase
        .from("anomalias_detectadas")
        .update(update)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const detectar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "detectar-anomalias-financeiras"
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (d: unknown) => {
      const r = d as { inseridas?: number };
      toast.success(`Detecção concluída: ${r?.inseridas ?? 0} novas anomalias`);
      qc.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return { ...list, atualizarStatus, detectar };
}

export function usePendingAnomaliasQueue() {
  return useQuery({
    queryKey: ["anomalias-detectadas", "pending-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anomalias_detectadas")
        .select("*")
        .in("status", ["nova", "investigando"])
        .order("detectada_em", { ascending: true })
        .limit(500);
      if (error) throw error;
      const list = (data ?? []) as Anomalia[];
      return list.sort((a, b) => {
        const sa = SEVERIDADE_ORDEM[a.severidade] ?? 9;
        const sb = SEVERIDADE_ORDEM[b.severidade] ?? 9;
        if (sa !== sb) return sa - sb;
        // Dentro da mesma severidade, mais recentes primeiro
        return new Date(b.detectada_em).getTime() - new Date(a.detectada_em).getTime();
      });
    },
    staleTime: 30_000,
  });
}

/**
 * Versão paginada/infinita da fila de pendentes para revisão em lote.
 * Carrega em páginas de 100 itens por requisição usando keyset pagination
 * (`detectada_em` ascendente) para suportar filas grandes sem travar a UI.
 *
 * Mantém a mesma ordenação (severidade desc → data asc) aplicando o sort
 * em memória sobre o conjunto já carregado.
 */
export function usePendingAnomaliasQueueInfinite(pageSize = 100) {
  const query = useInfiniteQuery({
    queryKey: ["anomalias-detectadas", "pending-queue-infinite", pageSize],
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      let q = supabase
        .from("anomalias_detectadas")
        .select("*")
        .in("status", ["nova", "investigando"])
        .order("detectada_em", { ascending: true })
        .order("id", { ascending: true })
        .limit(pageSize);
      if (pageParam) q = q.gt("detectada_em", pageParam);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Anomalia[];
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.length || lastPage.length < pageSize) return undefined;
      return lastPage[lastPage.length - 1].detectada_em;
    },
    staleTime: 30_000,
  });

  // Achatar + ordenar (severidade primeiro, depois data) — O(n log n)
  const items = useMemo(() => {
    const flat = (query.data?.pages ?? []).flat();
    return flat.sort((a, b) => {
      const sa = SEVERIDADE_ORDEM[a.severidade] ?? 9;
      const sb = SEVERIDADE_ORDEM[b.severidade] ?? 9;
      if (sa !== sb) return sa - sb;
      return new Date(b.detectada_em).getTime() - new Date(a.detectada_em).getTime();
    });
  }, [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export class AnomaliaJaRevisadaError extends Error {
  code = "ANOMALIA_JA_REVISADA" as const;
  constructor(message = "Anomalia já foi revisada por outro usuário") {
    super(message);
    this.name = "AnomaliaJaRevisadaError";
  }
}

export function useRevisarAnomalia() {
  const qc = useQueryClient();
  const audit = useLogAudit();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: "confirmada" | "falso_positivo";
      observacoes: string;
    }) => {
      const obs = input.observacoes.trim();
      if (obs.length < 10) {
        throw new Error("Comentário deve ter ao menos 10 caracteres");
      }
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      const { data, error } = await supabase
        .from("anomalias_detectadas")
        .update({
          status: input.status,
          observacoes: obs,
          resolvida_em: new Date().toISOString(),
          resolvida_por: uid,
        })
        .eq("id", input.id)
        .in("status", ["nova", "investigando"])
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new AnomaliaJaRevisadaError();
      }

      await audit
        .mutateAsync({
          action: input.status === "confirmada" ? "APPROVE" : "REJECT",
          tableName: "anomalias_detectadas",
          recordId: input.id,
          details: obs,
        })
        .catch(() => undefined);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
    },
    onError: (e: Error) => {
      // Conflito de concorrência é tratado pelo componente — não mostrar toast genérico
      if (e instanceof AnomaliaJaRevisadaError) return;
      toast.error(e.message);
    },
  });
}

export function useReabrirAnomalia() {
  const qc = useQueryClient();
  const audit = useLogAudit();

  return useMutation({
    mutationFn: async (input: { id: string; motivo: string }) => {
      const motivo = input.motivo.trim();
      if (motivo.length < 10) {
        throw new Error("Motivo deve ter ao menos 10 caracteres");
      }

      const { data, error } = await supabase
        .from("anomalias_detectadas")
        .update({
          status: "investigando",
          observacoes: motivo,
          resolvida_em: null,
          resolvida_por: null,
        })
        .eq("id", input.id)
        .in("status", ["confirmada", "falso_positivo"])
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("Anomalia não está em estado reabrível");
      }

      await audit
        .mutateAsync({
          action: "UPDATE",
          tableName: "anomalias_detectadas",
          recordId: input.id,
          details: `REOPEN: ${motivo}`,
        })
        .catch(() => undefined);

      return data;
    },
    onSuccess: () => {
      toast.success("Anomalia reaberta para investigação");
      qc.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface ReabrirLoteResultado {
  total: number;
  reabertas: number;
  ids_reabertos: string[];
  ignoradas: number;
}

export function useReabrirAnomaliasLote() {
  const qc = useQueryClient();
  const audit = useLogAudit();

  return useMutation<ReabrirLoteResultado, Error, { ids: string[]; motivo: string }>({
    mutationFn: async (input) => {
      const motivo = input.motivo.trim();
      if (motivo.length < 10) {
        throw new Error("Motivo deve ter ao menos 10 caracteres");
      }
      const ids = Array.from(new Set(input.ids.filter(Boolean)));
      if (ids.length === 0) {
        throw new Error("Selecione ao menos uma anomalia para reabrir");
      }
      if (ids.length > 100) {
        throw new Error("Máximo de 100 anomalias por lote");
      }

      const { data, error } = await supabase
        .from("anomalias_detectadas")
        .update({
          status: "investigando",
          observacoes: motivo,
          resolvida_em: null,
          resolvida_por: null,
        })
        .in("id", ids)
        .in("status", ["confirmada", "falso_positivo"])
        .select("id");

      if (error) throw error;
      const reabertas = (data ?? []) as { id: string }[];

      await audit
        .mutateAsync({
          action: "UPDATE",
          tableName: "anomalias_detectadas",
          recordId: reabertas.map((r) => r.id).join(","),
          details: `REOPEN_BATCH (${reabertas.length}/${ids.length}): ${motivo}`,
        })
        .catch(() => undefined);

      return {
        total: ids.length,
        reabertas: reabertas.length,
        ids_reabertos: reabertas.map((r) => r.id),
        ignoradas: ids.length - reabertas.length,
      };
    },
    onSuccess: (res) => {
      if (res.reabertas === 0) {
        toast.error("Nenhuma anomalia foi reaberta (já podem ter sido alteradas)");
      } else if (res.ignoradas > 0) {
        toast.success(
          `${res.reabertas} anomalia(s) reaberta(s) — ${res.ignoradas} ignorada(s) por já não estarem em estado reabrível`,
        );
      } else {
        toast.success(`${res.reabertas} anomalia(s) reaberta(s) para investigação`);
      }
      qc.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
