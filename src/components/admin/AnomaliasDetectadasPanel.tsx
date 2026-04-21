import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Eye,
  Loader2,
  RefreshCw,
  Microscope,
  ListChecks,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useAnomaliasDetectadas,
  type Anomalia,
} from "@/hooks/useAnomaliasDetectadas";
import { usePendingAnomaliasQueue } from "@/hooks/useAnomaliasDetectadas";
import { AnomaliasReviewQueue } from "./AnomaliasReviewQueue";
import { Link } from "react-router-dom";
import {
  useAnomaliasDetectadas,
  type Anomalia,
} from "@/hooks/useAnomaliasDetectadas";

function severidadeBadge(s: Anomalia["severidade"]) {
  if (s === "critica") return "destructive";
  if (s === "alta") return "destructive";
  if (s === "media") return "secondary";
  return "outline";
}

const TIPO_LABEL: Record<Anomalia["tipo_anomalia"], string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

export function AnomaliasDetectadasPanel() {
  const [filtro, setFiltro] = useState<Anomalia["status"] | "todas">("nova");
  const { data, isLoading, atualizarStatus, detectar } = useAnomaliasDetectadas(
    filtro === "todas" ? undefined : filtro
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Anomalias detectadas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nova">Novas</SelectItem>
                <SelectItem value="investigando">Investigando</SelectItem>
                <SelectItem value="confirmada">Confirmadas</SelectItem>
                <SelectItem value="falso_positivo">Falsos positivos</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => detectar.mutate()}
              disabled={detectar.isPending}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${detectar.isPending ? "animate-spin" : ""}`} />
              Detectar agora
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              ✓ Nenhuma anomalia neste filtro.
            </p>
          ) : (
            <div className="space-y-2">
              {(data ?? []).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-md border bg-card flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={severidadeBadge(a.severidade)}>
                        {a.severidade}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {TIPO_LABEL[a.tipo_anomalia]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.detectada_em).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm">{a.descricao}</p>
                    {a.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {a.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/admin/insights-ia/anomalia/${a.id}`}>
                        <Microscope className="h-3 w-3 mr-1" /> Drill-down
                      </Link>
                    </Button>
                  </div>
                  {a.status === "nova" && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          atualizarStatus.mutate({ id: a.id, status: "investigando" })
                        }
                        disabled={atualizarStatus.isPending}
                      >
                        <Search className="h-3 w-3 mr-1" /> Investigar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          atualizarStatus.mutate({ id: a.id, status: "falso_positivo" })
                        }
                      >
                        <Eye className="h-3 w-3 mr-1" /> Falso +
                      </Button>
                    </div>
                  )}
                  {a.status === "investigando" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        atualizarStatus.mutate({ id: a.id, status: "confirmada" })
                      }
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
