import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLogAudit } from "./useAuditLog";

export type EventoBitrix = "confirmada" | "falso_positivo" | "parecer" | "reaberta";

interface SyncResponse {
  success?: boolean;
  skipped?: boolean;
  reason?: string;
  taskId?: string;
  taskUrl?: string;
  action?: "created" | "updated";
}

const SKIPPED_FLAG = "bitrix24-anomalia-skipped-warned";

export function useSincronizarAnomaliaBitrix() {
  const audit = useLogAudit();

  return useMutation<SyncResponse, Error, { anomaliaId: string; evento: EventoBitrix }>({
    mutationFn: async ({ anomaliaId, evento }) => {
      const { data, error } = await supabase.functions.invoke<SyncResponse>(
        "sincronizar-anomalia-bitrix24",
        { body: { anomaliaId, evento } },
      );
      if (error) throw error;
      const result = data ?? {};

      if (result.skipped) {
        if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(SKIPPED_FLAG)) {
          toast.info("Bitrix24 não configurado — sincronização pulada");
          sessionStorage.setItem(SKIPPED_FLAG, "1");
        }
        return result;
      }

      if (result.success && result.taskId) {
        toast.success(
          result.action === "created"
            ? `Tarefa criada no Bitrix24 (#${result.taskId})`
            : `Tarefa atualizada no Bitrix24 (#${result.taskId})`,
        );
        audit
          .mutateAsync({
            action: "UPDATE",
            tableName: "anomalias_detectadas",
            recordId: anomaliaId,
            details: `BITRIX24_SYNC: evento=${evento} task=${result.taskId} action=${result.action}`,
          })
          .catch(() => undefined);
      }

      return result;
    },
    onError: (e) => {
      // Não bloqueia a UX — apenas avisa
      toast.error(`Falha ao sincronizar com Bitrix24: ${e.message}`);
    },
  });
}
