import { useQuery } from "@tanstack/react-query";
import { supabaseDyn } from "@/lib/supabase-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, RefreshCw, Scale } from "lucide-react";

type Severidade = "critical" | "warning" | "info";

/** Achado individual retornado por public.get_catalogos_tributarios_health. */
interface AchadoCatalogo {
  invariante: string;
  severidade: Severidade;
  afetados: number;
  detalhe: string;
}

/** Payload agregado da RPC (admin-only). */
interface CatalogoHealth {
  gerado_em: string;
  ultima_verificacao: string | null;
  criticos: number;
  avisos: number;
  infos: number;
  /** Alertas tributários encerrados automaticamente nas últimas 24h. */
  auto_resolvidos_24h: number;
  /** Alertas tributários ainda em aberto. */
  alertas_abertos: number;
  saudavel: boolean;
  achados: AchadoCatalogo[];
}

const ESTILO_SEVERIDADE: Record<Severidade, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  info: "bg-muted text-muted-foreground border-border",
};

const ROTULO_SEVERIDADE: Record<Severidade, string> = {
  critical: "Crítico",
  warning: "Aviso",
  info: "Informativo",
};

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Saúde dos catálogos fiscais (UFs, NCM, CNAE, Simples Nacional, ISS, ST).
 * Consome a RPC `get_catalogos_tributarios_health`, protegida por papel admin,
 * expondo em tempo real as invariantes violadas nos seeds tributários.
 */
export function CatalogosTributariosHealthPanel() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<CatalogoHealth>({
    queryKey: ["catalogos-tributarios-health"],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc<CatalogoHealth>(
        "get_catalogos_tributarios_health",
        {},
      );
      if (error) throw error;
      return data as CatalogoHealth;
    },
    staleTime: 120_000,
  });

  const achados = data?.achados ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-base">Saúde dos catálogos tributários</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isRefetching}
          aria-label="Revalidar catálogos tributários"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} aria-hidden="true" />
          <span className="ml-2">Revalidar</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a auditoria dos catálogos. Esta visão é restrita a administradores.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Críticos</p>
                <p className="text-2xl font-semibold text-destructive">{data?.criticos ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Avisos</p>
                <p className="text-2xl font-semibold text-warning">{data?.avisos ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Informativos</p>
                <p className="text-2xl font-semibold text-foreground">{data?.infos ?? 0}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Última gravação de alerta fiscal: {formatarData(data?.ultima_verificacao ?? null)} · Verificado em{" "}
              {formatarData(data?.gerado_em ?? null)}
            </p>

            {achados.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Todos os catálogos fiscais estão íntegros.
              </div>
            ) : (
              <ul className="space-y-2">
                {achados.map((achado) => (
                  <li
                    key={achado.invariante}
                    className="flex flex-col gap-1 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate font-medium">{achado.invariante}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{achado.detalhe}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={ESTILO_SEVERIDADE[achado.severidade]}>
                        {ROTULO_SEVERIDADE[achado.severidade]}
                      </Badge>
                      <Badge variant="secondary">{achado.afetados} ocorrência(s)</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
