import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useAnomaliaDetalhe } from "@/hooks/useAnomaliaDetalhe";
import { AnomaliaHeader } from "@/components/insights-ia/anomalia/AnomaliaHeader";
import { EntidadeRelacionadaCard } from "@/components/insights-ia/anomalia/EntidadeRelacionadaCard";
import { HistoricoContextualCard } from "@/components/insights-ia/anomalia/HistoricoContextualCard";
import { DetectoresContribuintesCard } from "@/components/insights-ia/anomalia/DetectoresContribuintesCard";
import { AnomaliasRelacionadasCard } from "@/components/insights-ia/anomalia/AnomaliasRelacionadasCard";
import { AcoesSugeridasCard } from "@/components/insights-ia/anomalia/AcoesSugeridasCard";

export default function AnomaliaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useAnomaliaDetalhe(id);

  return (
    <MainLayout>
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/insights-ia">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h1 className="text-xl font-bold font-display">Drill-down de anomalia</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid lg:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : error || !data ? (
          <div className="text-center py-12 text-muted-foreground">
            Anomalia não encontrada ou sem permissão.
          </div>
        ) : (
          <>
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
