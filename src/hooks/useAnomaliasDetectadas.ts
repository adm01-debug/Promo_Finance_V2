import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
