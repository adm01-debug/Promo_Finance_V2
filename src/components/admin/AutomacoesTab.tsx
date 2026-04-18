// ============================================
// COMPONENT: AutomacoesTab (P13)
// Status dos cron jobs ativos
// ============================================
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, CheckCircle2, XCircle, Clock, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  command: string;
}

interface CronRun {
  jobid: number;
  jobname: string;
  runid: number;
  status: string;
  return_message: string | null;
  start_time: string;
  end_time: string | null;
}

const P13_JOB_NAMES = [
  "p13-health-score-diario",
  "p13-detectar-anomalias",
  "p13-resumo-executivo-semanal",
  "p13-refresh-benchmark",
  "p13-gerar-acoes-recomendadas",
  "p13-cleanup-acoes-expiradas",
];

const JOB_LABELS: Record<string, { label: string; description: string }> = {
  "p13-health-score-diario": { label: "Health Score diário", description: "Calcula score 360° das empresas (07:00)" },
  "p13-detectar-anomalias": { label: "Detector de anomalias", description: "Análise estatística (a cada 30 min)" },
  "p13-resumo-executivo-semanal": { label: "Resumo executivo semanal", description: "Domingos 18:00" },
  "p13-refresh-benchmark": { label: "Refresh benchmark setorial", description: "Segundas 03:00" },
  "p13-gerar-acoes-recomendadas": { label: "Gerar ações recomendadas", description: "Top 5 ações por IA (06:00)" },
  "p13-cleanup-acoes-expiradas": { label: "Limpeza ações expiradas", description: "Remove ações >24h (05:55)" },
};

export function AutomacoesTab() {
  const [running, setRunning] = useState<string | null>(null);

  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["p13-cron-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cron_jobs");
      if (error) throw error;
      return ((data ?? []) as CronJob[]).filter((j) => P13_JOB_NAMES.includes(j.jobname));
    },
    refetchInterval: 60_000,
  });

  const { data: runs, isLoading: loadingRuns, refetch } = useQuery({
    queryKey: ["p13-cron-runs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cron_run_history", {
        p_job_name: undefined as never,
        p_limit: 100,
      } as never);
      if (error) throw error;
      return ((data ?? []) as unknown as CronRun[]).filter((r) => P13_JOB_NAMES.includes(r.jobname));
    },
    refetchInterval: 60_000,
  });

  const triggerNow = async (jobname: string) => {
    setRunning(jobname);
    try {
      const map: Record<string, string> = {
        "p13-health-score-diario": "calcular-health-score-operacional",
        "p13-detectar-anomalias": "detectar-anomalias-financeiras",
        "p13-resumo-executivo-semanal": "gerar-resumo-executivo-semanal",
        "p13-gerar-acoes-recomendadas": "gerar-acoes-recomendadas",
      };
      const fn = map[jobname];
      if (!fn) {
        toast.info("Esta automação roda apenas dentro do banco");
        return;
      }
      const { error } = await supabase.functions.invoke(fn);
      if (error) throw error;
      toast.success(`${JOB_LABELS[jobname]?.label ?? jobname} executado`);
      refetch();
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : "erro"}`);
    } finally {
      setRunning(null);
    }
  };

  if (loadingJobs || loadingRuns) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const lastRunByJob = new Map<string, CronRun>();
  (runs ?? []).forEach((r) => {
    if (!lastRunByJob.has(r.jobname)) lastRunByJob.set(r.jobname, r);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <CardTitle>Automações Programadas (P13)</CardTitle>
            <CardDescription>
              Cron jobs que mantêm o sistema operando 24/7
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5" role="list">
          {(jobs ?? []).map((job) => {
            const meta = JOB_LABELS[job.jobname] ?? { label: job.jobname, description: job.schedule };
            const lastRun = lastRunByJob.get(job.jobname);
            const succeeded = lastRun?.status === "succeeded";

            return (
              <li
                key={job.jobid}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/50 p-3"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {lastRun ? (
                    succeeded ? (
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" aria-label="Sucesso" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" aria-label="Falha" />
                    )
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{meta.label}</p>
                      <Badge variant={job.active ? "secondary" : "outline"} className="text-[10px] h-4 px-1.5">
                        {job.active ? "Ativo" : "Pausado"}
                      </Badge>
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{job.schedule}</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
                    {lastRun && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Última execução:{" "}
                        {formatDistanceToNow(new Date(lastRun.start_time), { locale: ptBR, addSuffix: true })}
                        {!succeeded && lastRun.return_message && ` · ${lastRun.return_message.slice(0, 80)}`}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerNow(job.jobname)}
                  disabled={running === job.jobname}
                  className="shrink-0"
                >
                  {running === job.jobname ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  <span className="ml-1">Executar</span>
                </Button>
              </li>
            );
          })}
        </ul>

        {(jobs ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma automação P13 encontrada.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
