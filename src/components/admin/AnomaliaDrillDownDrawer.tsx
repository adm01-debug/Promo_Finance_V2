import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, X, Microscope, Copy, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAnomaliaDetalhe } from "@/hooks/useAnomaliaDetalhe";
import { useAnomaliaPreferences } from "@/hooks/useAnomaliaPreferences";
import { useLogAudit } from "@/hooks/useAuditLog";
import { AnomaliaHeader } from "@/components/insights-ia/anomalia/AnomaliaHeader";
import { EntidadeRelacionadaCard } from "@/components/insights-ia/anomalia/EntidadeRelacionadaCard";
import { AcoesSugeridasCard } from "@/components/insights-ia/anomalia/AcoesSugeridasCard";
import { AnomaliaHistoricoSection } from "@/components/admin/AnomaliaHistoricoSection";
import { ANOMALIA_DRAWER_EVENT, getEntidadeUrl } from "@/lib/anomalia-routes";

/**
 * Lateral drawer that opens via the global `open-anomalia-drawer` event.
 * Footer actions are filtered by user preferences (`drawer_acoes`).
 */
export function AnomaliaDrillDownDrawer() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, error } = useAnomaliaDetalhe(openId ?? undefined);
  const { preferences } = useAnomaliaPreferences();
  const queryClient = useQueryClient();
  const audit = useLogAudit();
  const [autoPromovidos] = useState<Set<string>>(() => new Set());

  // Auto-promove anomalia "nova" para "investigando" ao abrir o drawer
  useEffect(() => {
    if (!data?.anomalia) return;
    const a = data.anomalia;
    if (a.status !== "nova") return;
    if (autoPromovidos.has(a.id)) return;
    autoPromovidos.add(a.id);

    (async () => {
      const { data: updated, error: err } = await supabase
        .from("anomalias_detectadas")
        .update({ status: "investigando" })
        .eq("id", a.id)
        .eq("status", "nova")
        .select("id")
        .maybeSingle();
      if (err || !updated) return;
      await audit
        .mutateAsync({
          action: "UPDATE",
          tableName: "anomalias_detectadas",
          recordId: a.id,
          details: "AUTO_REVIEW_OPEN: status nova → investigando ao abrir drawer",
        })
        .catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
      queryClient.invalidateQueries({ queryKey: ["anomalia-detalhe", a.id] });
    })();
  }, [data?.anomalia, audit, queryClient, autoPromovidos]);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (detail?.id) setOpenId(detail.id);
    }
    window.addEventListener(ANOMALIA_DRAWER_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(
        ANOMALIA_DRAWER_EVENT,
        handler as EventListener,
      );
  }, []);

  const close = () => setOpenId(null);

  const acoes = preferences?.drawer_acoes ?? {
    abrir_entidade: true,
    pagina_completa: true,
    copiar_id: false,
    marcar_lida: false,
  };

  const handleCopiarId = async () => {
    if (!openId) return;
    try {
      await navigator.clipboard.writeText(openId);
      toast.success("ID copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleMarcarLida = async () => {
    if (!openId) return;
    const { error: err } = await supabase
      .from("anomalias_detectadas")
      .update({ status: "investigando" })
      .eq("id", openId)
      .eq("status", "nova");
    if (err) {
      toast.error("Falha ao marcar como lida");
      return;
    }
    toast.success("Marcada como lida");
    queryClient.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
  };

  return (
    <Sheet open={!!openId} onOpenChange={(o) => !o && close()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Microscope className="h-5 w-5" />
            Drill-down de anomalia
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </>
          ) : error || !data ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Anomalia não encontrada ou já removida.
            </p>
          ) : (
            <>
              <AnomaliaHeader anomalia={data.anomalia} />
              <EntidadeRelacionadaCard entidade={data.entidade} />
              {acoes.abrir_entidade && data.entidade.encontrada && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link
                    to={getEntidadeUrl(
                      data.anomalia.entidade_tipo,
                      data.anomalia.entidade_id,
                      data.anomalia.id,
                    )}
                    onClick={close}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir transação completa
                  </Link>
                </Button>
              )}
              <AcoesSugeridasCard anomalia={data.anomalia} />
              <AnomaliaHistoricoSection anomaliaId={data.anomalia.id} />
            </>
          )}
        </div>

        <SheetFooter className="gap-2 sm:gap-2 flex-wrap">
          {acoes.copiar_id && openId && (
            <Button variant="outline" size="sm" onClick={handleCopiarId}>
              <Copy className="h-3 w-3 mr-1" /> Copiar ID
            </Button>
          )}
          {acoes.marcar_lida && openId && (
            <Button variant="outline" size="sm" onClick={handleMarcarLida}>
              <CheckCheck className="h-3 w-3 mr-1" /> Marcar lida
            </Button>
          )}
          {acoes.pagina_completa && openId && (
            <Button asChild variant="secondary" size="sm">
              <Link to={`/admin/insights-ia/anomalia/${openId}`} onClick={close}>
                <ExternalLink className="h-3 w-3 mr-1" /> Página completa
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={close}>
            <X className="h-3 w-3 mr-1" /> Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
