import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
        return new Date(a.detectada_em).getTime() - new Date(b.detectada_em).getTime();
      });
    },
    staleTime: 30_000,
  });
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
