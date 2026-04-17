// ============================================
// COMPONENT: CronJobsStatus
// Observabilidade do cron tributário (admin-only)
// ============================================
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CronRun {
  jobid: number;
  jobname: string;
  runid: number;
  status: string;
  return_message: string | null;
  start_time: string;
  end_time: string | null;
}

const TRIBUTARIO_JOB = 'gerar-alertas-tributarios-diario';

export function CronJobsStatus() {
  const { isAdmin } = useAuth();

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['cron-run-history', TRIBUTARIO_JOB],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_run_history' as never, {
        p_job_name: TRIBUTARIO_JOB,
        p_limit: 10,
      } as never);
      if (error) throw error;
      return (data ?? []) as unknown as CronRun[];
    },
    enabled: isAdmin,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  if (!isAdmin) return null;

  const ultima = history?.[0];
  const sucessos24h = (history ?? []).filter(
    (r) =>
      r.status === 'succeeded' &&
      new Date(r.start_time).getTime() > Date.now() - 24 * 3600_000,
  ).length;
  const falhas24h = (history ?? []).filter(
    (r) =>
      r.status === 'failed' &&
      new Date(r.start_time).getTime() > Date.now() - 24 * 3600_000,
  ).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          <div>
            <CardTitle>Status do Cron Tributário</CardTitle>
            <CardDescription>
              Geração diária de alertas — execução automática via {TRIBUTARIO_JOB}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-2" aria-label="Carregando histórico">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <span>Não foi possível carregar o histórico do cron.</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatusTile
                icon={<Clock className="h-4 w-4" aria-hidden />}
                label="Última execução"
                value={
                  ultima
                    ? formatDistanceToNow(new Date(ultima.start_time), {
                        locale: ptBR,
                        addSuffix: true,
                      })
                    : 'Nunca'
                }
              />
              <StatusTile
                icon={<CheckCircle2 className="h-4 w-4 text-success" aria-hidden />}
                label="Sucessos (24h)"
                value={String(sucessos24h)}
              />
              <StatusTile
                icon={<XCircle className="h-4 w-4 text-destructive" aria-hidden />}
                label="Falhas (24h)"
                value={String(falhas24h)}
              />
            </div>

            {history && history.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Últimas 10 execuções</h4>
                <ScrollArea className="h-48 rounded-md border">
                  <ul className="divide-y" role="list">
                    {history.map((run) => (
                      <li
                        key={run.runid}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {run.status === 'succeeded' ? (
                            <CheckCircle2
                              className="h-4 w-4 text-success shrink-0"
                              aria-label="Sucesso"
                            />
                          ) : (
                            <XCircle
                              className="h-4 w-4 text-destructive shrink-0"
                              aria-label="Falha"
                            />
                          )}
                          <span className="truncate">
                            {new Date(run.start_time).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <Badge variant={run.status === 'succeeded' ? 'secondary' : 'destructive'}>
                          {run.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {(!history || history.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Nenhuma execução registrada ainda. O job roda diariamente às 06:00.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatusTile({ icon, label, value }: StatusTileProps) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold truncate">{value}</p>
    </div>
  );
}
