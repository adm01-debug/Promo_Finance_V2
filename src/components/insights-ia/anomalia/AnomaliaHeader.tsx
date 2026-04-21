import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Eye, Search } from "lucide-react";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";
import { useAnomaliasDetectadas } from "@/hooks/useAnomaliasDetectadas";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";
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
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <span className="text-xs text-muted-foreground">
              Detectada em {new Date(anomalia.detectada_em).toLocaleString("pt-BR")}
            </span>
          </div>
          <p className="text-base font-medium">{anomalia.descricao}</p>
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
                  onClick={() =>
                    atualizarStatus.mutate({ id: anomalia.id, status: "investigando" })
                  }
                >
                  <Search className="h-3 w-3 mr-1" /> Investigar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => revisarComBitrix("falso_positivo")}
              >
                <Eye className="h-3 w-3 mr-1" /> Falso positivo
              </Button>
              <Button
                size="sm"
                onClick={() => revisarComBitrix("confirmada")}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
