import { toast } from "sonner";
import type {
  Severidade,
  ToastAcoes,
  DrawerAcoes,
} from "@/hooks/useAnomaliaPreferences";
import { useAnomaliaPreferences } from "@/hooks/useAnomaliaPreferences";
import { useLogAudit } from "@/hooks/useAuditLog";
import { TIPOS } from "./constants";

interface CentroCusto {
  id: string;
  nome: string;
}

interface SaveArgs {
  enabled: boolean;
  severidadesAtivas: Severidade[];
  duracao: number;
  toastAcoes: ToastAcoes;
  drawerAcoes: DrawerAcoes;
  silenciarAte: string | null;
  ccs: string[];
  tipos: string[];
  centrosCusto: CentroCusto[];
  onSuccess: () => void;
}

export function useSaveAnomaliaPreferences() {
  const { preferences, update } = useAnomaliaPreferences();
  const logAudit = useLogAudit();

  const save = async (args: SaveArgs) => {
    const {
      enabled,
      severidadesAtivas,
      duracao,
      toastAcoes,
      drawerAcoes,
      silenciarAte,
      ccs,
      tipos,
      centrosCusto,
      onSuccess,
    } = args;

    if (severidadesAtivas.length === 0) {
      toast.error("Selecione ao menos 1 severidade ou desative os toasts");
      return;
    }

    try {
      const previaSilenciarAte = preferences?.silenciar_ate ?? null;
      const previaCcs = preferences?.centros_custo_silenciados ?? [];
      const previaTipos = preferences?.tipos_silenciados ?? [];

      const ccsSorted = [...ccs].sort();
      const tiposSorted = [...tipos].sort();
      const previaCcsSorted = [...previaCcs].sort();
      const previaTiposSorted = [...previaTipos].sort();

      const silenciarAteMudou = previaSilenciarAte !== silenciarAte;
      const ccsMudou = previaCcsSorted.join("|") !== ccsSorted.join("|");
      const tiposMudou = previaTiposSorted.join("|") !== tiposSorted.join("|");

      await update.mutateAsync({
        toast_enabled: enabled,
        toast_severidades_ativas: severidadesAtivas,
        toast_duracao_segundos: duracao,
        toast_acoes: toastAcoes,
        drawer_acoes: drawerAcoes,
        silenciar_ate: silenciarAte,
        centros_custo_silenciados: ccs,
        tipos_silenciados: tipos,
      });

      if (silenciarAteMudou || ccsMudou || tiposMudou) {
        const agora = new Date();
        const ate = silenciarAte ? new Date(silenciarAte) : null;
        const duracaoMin =
          ate && ate > agora ? Math.round((ate.getTime() - agora.getTime()) / 60000) : 0;

        const acaoLabel =
          ate && ate > agora
            ? "SILENCE_ALERTS"
            : previaSilenciarAte
              ? "UNSILENCE_ALERTS"
              : "UPDATE_SILENCE_FILTERS";

        const ccsNomes = ccs
          .map((id) => centrosCusto.find((c) => c.id === id)?.nome ?? id)
          .sort();
        const tiposLabels = tipos
          .map((t) => TIPOS.find((x) => x.value === t)?.label ?? t)
          .sort();

        const detalhes = [
          `${acaoLabel} em ${agora.toISOString()}`,
          ate && ate > agora
            ? `silenciado_ate=${ate.toISOString()} (${duracaoMin} min)`
            : "silenciamento_ativo=false",
          `centros_custo_silenciados=[${ccsNomes.join(", ")}]`,
          `tipos_silenciados=[${tiposLabels.join(", ")}]`,
        ].join(" | ");

        await logAudit
          .mutateAsync({
            action: "UPDATE",
            tableName: "user_anomalia_preferences",
            recordId: preferences?.id,
            oldData: {
              silenciar_ate: previaSilenciarAte,
              centros_custo_silenciados: previaCcsSorted,
              tipos_silenciados: previaTiposSorted,
            },
            newData: {
              silenciar_ate: silenciarAte,
              duracao_minutos: duracaoMin,
              centros_custo_silenciados: ccsSorted,
              centros_custo_nomes: ccsNomes,
              tipos_silenciados: tiposSorted,
              tipos_labels: tiposLabels,
            },
            details: detalhes,
          })
          .catch(() => undefined);
      }

      toast.success("Preferências salvas");
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar preferências");
    }
  };

  return { save, isSaving: update.isPending, preferences };
}
