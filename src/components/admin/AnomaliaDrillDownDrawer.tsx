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
import { ExternalLink, X, Microscope } from "lucide-react";
import { Link } from "react-router-dom";
import { useAnomaliaDetalhe } from "@/hooks/useAnomaliaDetalhe";
import { AnomaliaHeader } from "@/components/insights-ia/anomalia/AnomaliaHeader";
import { EntidadeRelacionadaCard } from "@/components/insights-ia/anomalia/EntidadeRelacionadaCard";
import { AcoesSugeridasCard } from "@/components/insights-ia/anomalia/AcoesSugeridasCard";
import { ANOMALIA_DRAWER_EVENT, getEntidadeUrl } from "@/lib/anomalia-routes";

/**
 * Lateral drawer that opens via the global `open-anomalia-drawer` event.
 * Shows a compact drill-down of an anomaly without leaving the current page.
 */
export function AnomaliaDrillDownDrawer() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, error } = useAnomaliaDetalhe(openId ?? undefined);

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
              {data.entidade.encontrada && (
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
            </>
          )}
        </div>

        <SheetFooter className="gap-2 sm:gap-2">
          {openId && (
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
