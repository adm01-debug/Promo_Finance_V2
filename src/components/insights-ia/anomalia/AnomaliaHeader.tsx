import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Eye, Search } from "lucide-react";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";
import { useAnomaliasDetectadas } from "@/hooks/useAnomaliasDetectadas";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";
import { useLogAudit } from "@/hooks/useAuditLog";
import { ReabrirAnomaliaDialog } from "./ReabrirAnomaliaDialog";

const TIPO_LABEL: Record<Anomalia["tipo_anomalia"], string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

export function AnomaliaHeader({ anomalia }: { anomalia: Anomalia }) {
  const { atualizarStatus } = useAnomaliasDetectadas();
  const sincronizar = useSincronizarAnomaliaBitrix();
  const audit = useLogAudit();

  const centroCustoId = (anomalia as { centro_custo_id?: string | null }).centro_custo_id ?? null;

  const handleInvestigar = () => {
    atualizarStatus.mutate(
      { id: anomalia.id, status: "investigando" },
      {
        onSuccess: () => {
          audit
            .mutateAsync({
              action: "UPDATE",
              tableName: "anomalias_detectadas",
              recordId: anomalia.id,
              details: `INVESTIGAR_CLICK: status → investigando | severidade=${anomalia.severidade} | tipo=${anomalia.tipo_anomalia} | centro_custo_id=${centroCustoId ?? "—"} | empresa_id=${anomalia.empresa_id ?? "—"}`,
            })
            .catch(() => undefined);
        },
      },
    );
  };

  const revisarComBitrix = (status: "confirmada" | "falso_positivo") => {
    atualizarStatus.mutate(
      { id: anomalia.id, status },
      {
        onSuccess: () =>
          sincronizar.mutate({ anomaliaId: anomalia.id, evento: status }),
      },
    );
  };

  const sevVariant =
    anomalia.severidade === "critica" || anomalia.severidade === "alta"
      ? "destructive"
      : anomalia.severidade === "media"
      ? "secondary"
      : "outline";

  return (
    <Card>
      <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={sevVariant}>{anomalia.severidade}</Badge>
            <Badge variant="outline">{TIPO_LABEL[anomalia.tipo_anomalia]}</Badge>
            <Badge variant="outline" className="capitalize">{anomalia.status}</Badge>
            {anomalia.bitrix_task_id && (
              <Badge variant="secondary" className="text-xs">
                Bitrix24 #{anomalia.bitrix_task_id}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              Detectada em {new Date(anomalia.detectada_em).toLocaleString("pt-BR")}
            </span>
          </div>
          <p className="text-base font-semibold">{anomalia.descricao}</p>
          {anomalia.observacoes && (
            <p className="text-sm text-muted-foreground italic">{anomalia.observacoes}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {anomalia.status === "confirmada" || anomalia.status === "falso_positivo" ? (
            <ReabrirAnomaliaDialog anomaliaId={anomalia.id} />
          ) : (
            <>
              {anomalia.status === "nova" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleInvestigar}
                  disabled={atualizarStatus.isPending}
                  aria-label="Marcar anomalia como em investigação"
                  title="Marcar como investigando"
                >
                  <Search className="h-3 w-3 mr-1" aria-hidden="true" /> Investigar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => revisarComBitrix("falso_positivo")}
                disabled={atualizarStatus.isPending || sincronizar.isPending}
                aria-label="Marcar anomalia como falso positivo"
                title="Falso positivo"
              >
                <Eye className="h-3 w-3 mr-1" aria-hidden="true" /> Falso positivo
              </Button>
              <Button
                size="sm"
                onClick={() => revisarComBitrix("confirmada")}
                disabled={atualizarStatus.isPending || sincronizar.isPending}
                aria-label="Confirmar anomalia"
                title="Confirmar anomalia"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" /> Confirmar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
