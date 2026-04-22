import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Clock, RefreshCw, WifiOff } from "lucide-react";
import { useAnomaliaDetalhe } from "@/hooks/useAnomaliaDetalhe";
import { useRefetchAnomaliasOnFocus } from "@/hooks/useRefetchAnomaliasOnFocus";
import { AnomaliaHeader } from "@/components/insights-ia/anomalia/AnomaliaHeader";
import { EntidadeRelacionadaCard } from "@/components/insights-ia/anomalia/EntidadeRelacionadaCard";
import { HistoricoContextualCard } from "@/components/insights-ia/anomalia/HistoricoContextualCard";
import { DetectoresContribuintesCard } from "@/components/insights-ia/anomalia/DetectoresContribuintesCard";
import { AnomaliasRelacionadasCard } from "@/components/insights-ia/anomalia/AnomaliasRelacionadasCard";
import { AcoesSugeridasCard } from "@/components/insights-ia/anomalia/AcoesSugeridasCard";
import { ExportarEvidenciasButton } from "@/components/insights-ia/anomalia/ExportarEvidenciasButton";
import { AnomaliaBreadcrumb } from "@/components/insights-ia/anomalia/AnomaliaBreadcrumb";

const SLOW_THRESHOLD_MS = 2_500;
const VERY_SLOW_THRESHOLD_MS = 8_000;
export const ANOMALIAS_PANEL_RETURN_KEY = "anomalias-panel:last-search";

function buildVoltarUrl(): string {
  if (typeof window === "undefined") return "/admin/insights-ia";
  const search = window.sessionStorage.getItem(ANOMALIAS_PANEL_RETURN_KEY) ?? "";
  return `/admin/insights-ia${search}`;
}

export default function AnomaliaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error, refetch } = useAnomaliaDetalhe(id);
  useRefetchAnomaliasOnFocus(id);
  const [slow, setSlow] = useState(false);
  const [verySlow, setVerySlow] = useState(false);

  useEffect(() => {
    if (!isFetching) {
      setSlow(false);
      setVerySlow(false);
      return;
    }
    setSlow(false);
    setVerySlow(false);
    const t1 = window.setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
    const t2 = window.setTimeout(() => setVerySlow(true), VERY_SLOW_THRESHOLD_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isFetching, id]);

  const voltarUrl = buildVoltarUrl();

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to={voltarUrl}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h1 className="text-xl font-bold font-display">
                Drill-down de anomalia
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <ExportarEvidenciasButton
                anomalia={data.anomalia}
                entidade={data.entidade}
                historico={data.historico}
                relacionadas={data.relacionadas}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(voltarUrl)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para a lista
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-live="polite">
            {slow && !verySlow && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Carregando o detalhe…</AlertTitle>
                <AlertDescription>
                  Estamos buscando histórico, entidade relacionada e anomalias correlatas.
                </AlertDescription>
              </Alert>
            )}
            {verySlow && (
              <Alert variant="error">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>A consulta está demorando mais que o esperado</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    Pode ser uma instabilidade de rede ou um histórico maior. Você pode aguardar,
                    tentar novamente ou voltar à lista.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => refetch()}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Tentar novamente
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={voltarUrl}>
                        <ArrowLeft className="h-3 w-3 mr-1" /> Voltar à lista
                      </Link>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <Skeleton className="h-32 w-full" />
            <div className="grid lg:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-48 w-full" />
            <div className="grid lg:grid-cols-2 gap-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        ) : error || !data ? (
          <Alert variant="error">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar a anomalia</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                {error instanceof Error
                  ? error.message
                  : "A anomalia não foi encontrada ou você não tem permissão para vê-la."}
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Tentar novamente
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to={voltarUrl}>
                    <ArrowLeft className="h-3 w-3 mr-1" /> Voltar à lista
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <AnomaliaBreadcrumb entidadeTipo={data.anomalia.entidade_tipo} />
            <AnomaliaHeader anomalia={data.anomalia} />
            <div className="grid lg:grid-cols-2 gap-4">
              <EntidadeRelacionadaCard entidade={data.entidade} />
              <DetectoresContribuintesCard anomalia={data.anomalia} />
            </div>
            <HistoricoContextualCard pontos={data.historico} />
            <div className="grid lg:grid-cols-2 gap-4">
              <AnomaliasRelacionadasCard lista={data.relacionadas} />
              <AcoesSugeridasCard anomalia={data.anomalia} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
