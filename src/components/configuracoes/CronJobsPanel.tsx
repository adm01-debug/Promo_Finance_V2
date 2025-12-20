import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CronJob {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
}

// Função para interpretar expressões cron
function parseCronExpression(schedule: string): string {
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;

  const [minute, hour, dayMonth, month, dayWeek] = parts;

  // Padrões comuns
  if (schedule === '* * * * *') return 'A cada minuto';
  if (schedule === '0 * * * *') return 'A cada hora';
  if (schedule === '0 0 * * *') return 'Diariamente à meia-noite';
  if (minute !== '*' && hour !== '*' && dayMonth === '*' && month === '*' && dayWeek === '*') {
    return `Diariamente às ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} UTC`;
  }
  if (dayWeek !== '*' && dayMonth === '*') {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dia = dias[parseInt(dayWeek)] || dayWeek;
    return `${dia} às ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} UTC`;
  }
  if (dayMonth !== '*' && month === '*') {
    return `Dia ${dayMonth} de cada mês às ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} UTC`;
  }

  return schedule;
}

// Extrair nome amigável do job
function getJobDisplayName(jobname: string, command: string): string {
  if (jobname && jobname !== '') return jobname;
  
  // Tentar extrair do comando
  const functionMatch = command.match(/functions\/v1\/([^'"]+)/);
  if (functionMatch) {
    return functionMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return 'Job sem nome';
}

export function CronJobsPanel() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Buscar cron jobs
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['cron-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_jobs' as any);
      
      if (error) {
        // Se a função não existir, tentar query direta
        console.error('Erro ao buscar cron jobs:', error);
        throw error;
      }
      
      return data as CronJob[];
    },
    retry: false,
  });

  // Ativar/desativar job
  const toggleJobMutation = useMutation({
    mutationFn: async ({ jobId, active }: { jobId: number; active: boolean }) => {
      const action = active ? 'cron.schedule' : 'cron.unschedule';
      
      // Para ativar/desativar, precisamos usar uma edge function ou SQL direto
      const { error } = await supabase.rpc('toggle_cron_job' as any, { 
        job_id: jobId, 
        is_active: active 
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.success('Job atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao atualizar job:', error);
      toast.error('Erro ao atualizar job');
    },
  });

  // Deletar job
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const { error } = await supabase.rpc('delete_cron_job' as any, { job_id: jobId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.success('Job removido com sucesso');
      setDeletingId(null);
    },
    onError: (error) => {
      console.error('Erro ao remover job:', error);
      toast.error('Erro ao remover job');
      setDeletingId(null);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tarefas Agendadas (Cron Jobs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tarefas Agendadas (Cron Jobs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar os cron jobs.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tarefas Agendadas (Cron Jobs)
            </CardTitle>
            <CardDescription>
              Gerencie as tarefas automáticas do sistema
            </CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!jobs || jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma tarefa agendada encontrada.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.jobid}>
                    <TableCell>
                      <div className="font-medium">
                        {getJobDisplayName(job.jobname, job.command)}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px] cursor-help">
                              {job.command.substring(0, 50)}...
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <pre className="text-xs whitespace-pre-wrap">{job.command}</pre>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{parseCronExpression(job.schedule)}</p>
                          <p className="text-xs text-muted-foreground font-mono">{job.schedule}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.active ? 'default' : 'secondary'}>
                        {job.active ? (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pausado
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Switch
                                checked={job.active}
                                onCheckedChange={(checked) => 
                                  toggleJobMutation.mutate({ jobId: job.jobid, active: checked })
                                }
                                disabled={toggleJobMutation.isPending}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {job.active ? 'Pausar job' : 'Ativar job'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <AlertDialog open={deletingId === job.jobid} onOpenChange={(open) => !open && setDeletingId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeletingId(job.jobid)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover tarefa agendada?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A tarefa "{getJobDisplayName(job.jobname, job.command)}" 
                                será removida permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteJobMutation.mutate(job.jobid)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteJobMutation.isPending ? 'Removendo...' : 'Remover'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Sobre as tarefas agendadas</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• As tarefas são executadas automaticamente conforme o agendamento definido</li>
            <li>• O horário é baseado em UTC (Brasília = UTC-3)</li>
            <li>• Pausar uma tarefa não a remove, apenas interrompe a execução</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
