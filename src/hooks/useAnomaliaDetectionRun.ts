import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AnomaliaDetectionRun {
  id: string;
  triggered_by: string | null;
  trigger_source: "manual" | "cron";
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  current_step: string | null;
  step_index: number;
  total_steps: number;
  candidatas: number;
  inseridas: number;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

const ACTIVE_STATUSES = ["queued", "running"] as const;

export function useAnomaliaDetectionRun() {
  const qc = useQueryClient();
  const lastCompletedRef = useRef<string | null>(null);

  const activeRunQuery = useQuery({
    queryKey: ["anomalia-runs", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anomalia_detection_runs")
        .select("*")
        .in("status", ACTIVE_STATUSES as unknown as string[])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as AnomaliaDetectionRun | null;
    },
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  // Realtime: atualiza progresso e dispara invalidações em conclusão
  useEffect(() => {
    const channel = supabase
      .channel("anomalia_detection_runs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anomalia_detection_runs",
        },
        (payload) => {
          const newRow = payload.new as AnomaliaDetectionRun | undefined;
          qc.invalidateQueries({ queryKey: ["anomalia-runs"] });

          if (
            newRow &&
            newRow.status === "completed" &&
            lastCompletedRef.current !== newRow.id
          ) {
            lastCompletedRef.current = newRow.id;
            qc.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
            toast.success(
              `Detecção concluída: ${newRow.inseridas ?? 0} novas anomalias`,
            );
          }

          if (newRow && newRow.status === "failed") {
            toast.error(
              `Detecção falhou: ${newRow.error_message ?? "erro desconhecido"}`,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const disparar = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      // Cria registro queued
      const { data: runRow, error: insertErr } = await supabase
        .from("anomalia_detection_runs")
        .insert({
          status: "queued",
          triggered_by: uid,
          trigger_source: "manual",
        })
        .select("id")
        .single();

      if (insertErr || !runRow) {
        throw new Error(insertErr?.message ?? "Falha ao criar execução");
      }

      const { data, error } = await supabase.functions.invoke(
        "detectar-anomalias-financeiras",
        { body: { run_id: runRow.id } },
      );

      // FunctionsHttpError: a edge respondeu non-2xx (ex.: 409 already_running)
      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx) {
          try {
            const json = await ctx.json();
            if (json?.reason === "already_running") {
              return { alreadyRunning: true, current_run_id: json.current_run_id };
            }
          } catch {
            /* ignore */
          }
        }
        throw error;
      }

      return { alreadyRunning: false, ...data };
    },
    onSuccess: (result) => {
      if (result?.alreadyRunning) {
        toast.info("Já existe uma detecção em andamento");
      }
      qc.invalidateQueries({ queryKey: ["anomalia-runs"] });
    },
    onError: (e: Error) => {
      toast.error(`Erro ao iniciar detecção: ${e.message}`);
    },
  });

  return {
    activeRun: activeRunQuery.data ?? null,
    isLoadingRun: activeRunQuery.isLoading,
    disparar: disparar.mutate,
    disparando: disparar.isPending,
  };
}
