import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseDyn } from "@/lib/supabase-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Database, RefreshCw, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

/** Linha retornada por public.get_retention_history (admin-only). */
interface RetentionRunRow {
  executed_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  success: boolean;
  skipped: boolean;
  error_message: string | null;
  total_deleted: number;
  partitions_dropped: number;
  /** { "<tabela>": <linhas removidas> } — apenas chaves numéricas do resultado. */
  per_table: Record<string, number> | null;
}

const JANELAS = [7, 30, 90] as const;

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDuracao(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Histórico da rotina diária de retenção (cleanup_log_tables). Torna auditável
 * o que foi purgado por tabela — antes essa informação existia apenas dentro de
 * `cron_job_logs.result`, sem qualquer visibilidade operacional.
 */
export function RetentionHistoryPanel() {
  const [dias, setDias] = useState<number>(30);

  const { data = [], isLoading, refetch, isRefetching } = useQuery<RetentionRunRow[]>({
    queryKey: ["retention-history", dias],
    queryFn: async () => {
      const { data, error } = await supabaseDyn.rpc<RetentionRunRow[]>("get_retention_history", {
        p_days: dias,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const resumo = useMemo(() => {
    const totalLinhas = data.reduce((acc, r) => acc + Number(r.total_deleted ?? 0), 0);
    const totalParticoes = data.reduce((acc, r) => acc + Number(r.partitions_dropped ?? 0), 0);
    const falhas = data.filter((r) => !r.success && !r.skipped).length;

    // Ranking de tabelas por volume purgado no período.
    const porTabela = new Map<string, number>();
    for (const run of data) {
      for (const [tabela, linhas] of Object.entries(run.per_table ?? {})) {
        porTabela.set(tabela, (porTabela.get(tabela) ?? 0) + Number(linhas ?? 0));
      }
    }
    const ranking = [...porTabela.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return { totalLinhas, totalParticoes, falhas, ranking };
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4 text-muted-foreground" />
          Retenção de dados
          {resumo.falhas > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {resumo.falhas} falha(s)
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          {JANELAS.map((j) => (
            <Button
              key={j}
              size="sm"
              variant={dias === j ? "secondary" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setDias(j)}
            >
              {j}d
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => void refetch()}
            disabled={isRefetching}
            aria-label="Recarregar histórico de retenção"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Linhas purgadas</p>
            <p className="text-lg font-semibold text-foreground">
              {resumo.totalLinhas.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Partições descartadas</p>
            <p className="text-lg font-semibold text-foreground">{resumo.totalParticoes}</p>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">Execuções</p>
            <p className="text-lg font-semibold text-foreground">{data.length}</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando histórico…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma execução de retenção registrada nos últimos {dias} dias.
          </p>
        ) : (
          <>
            {resumo.ranking.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Maiores volumes por tabela
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {resumo.ranking.map(([tabela, linhas]) => (
                    <Badge key={tabela} variant="outline" className="text-[10px] font-normal">
                      <Trash2 className="mr-1 h-3 w-3" />
                      {tabela}: {linhas.toLocaleString("pt-BR")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
              <TooltipProvider>
                {data.map((run) => {
                  const tabelas = Object.entries(run.per_table ?? {}).filter(
                    ([, v]) => Number(v) > 0,
                  );
                  return (
                    <div
                      key={run.executed_at}
                      className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {run.success ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <span className="text-xs font-medium text-foreground">
                            {formatarData(run.executed_at)}
                          </span>
                          {run.skipped && (
                            <Badge variant="secondary" className="text-[10px]">
                              ignorada (lock)
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {run.error_message
                            ? run.error_message
                            : tabelas.length === 0
                              ? "Nada a purgar nesta execução"
                              : tabelas
                                  .map(([t, v]) => `${t}: ${Number(v).toLocaleString("pt-BR")}`)
                                  .join(" · ")}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-semibold text-foreground">
                              {Number(run.total_deleted).toLocaleString("pt-BR")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatarDuracao(run.duration_ms)}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {Number(run.total_deleted).toLocaleString("pt-BR")} linha(s) removida(s)
                            {run.partitions_dropped > 0
                              ? ` · ${run.partitions_dropped} partição(ões) descartada(s)`
                              : ""}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </TooltipProvider>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
