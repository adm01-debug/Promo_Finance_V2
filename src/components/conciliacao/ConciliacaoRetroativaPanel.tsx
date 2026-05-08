import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, History, PlayCircle, AlertCircle, CheckCircle2, Loader2, RefreshCw, Layers, Filter } from 'lucide-react';
import { useConciliacaoRetroativa } from '@/hooks/useConciliacaoRetroativa';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Props {
  contaBancariaId?: string;
}

export function ConciliacaoRetroativaPanel({ contaBancariaId }: Props) {
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const { agendar, reprocessar } = useConciliacaoRetroativa();
  
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['logs-conciliacao-retroativa', contaBancariaId, showAllBanks],
    queryFn: async () => {
      let query = supabase
        .from('logs_conciliacao_retroativa')
        .select(`
          *,
          contas_bancarias(nome, banco)
        `)
        .order('created_at', { ascending: false });
      
      if (!showAllBanks && contaBancariaId) {
        query = query.eq('conta_bancaria_id', contaBancariaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: (data) => {
      // Poll if any job is processing
      return data?.some(log => log.status === 'processando') ? 3000 : false;
    }
  });

  const handleAgendar = () => {
    if (!contaBancariaId) return;
    agendar.mutate({
      contaBancariaId,
      dataInicio: format(dateRange.from, 'yyyy-MM-dd'),
      dataFim: format(dateRange.to, 'yyyy-MM-dd')
    });
  };

  const handleReprocessar = (id: string) => {
    reprocessar.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Conciliação Retroativa</h2>
          <p className="text-muted-foreground">Processe períodos antigos para encontrar matches e validar integridade.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={showAllBanks ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowAllBanks(!showAllBanks)}
            className="gap-2"
          >
            <Layers className="h-4 w-4" /> {showAllBanks ? "Mostrando Tudo" : "Filtro por Banco Ativo"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()} className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" /> Novo Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!contaBancariaId && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning-foreground mb-4">
                Selecione uma conta bancária no topo da página para agendar um novo processamento.
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Período Retroativo</Label>
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={!contaBancariaId}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        <span>Selecione as datas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range: any) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                      locale={ptBR as any}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
                O motor de IA irá reanalisar todos os lançamentos bancários e do sistema no período selecionado, aplicando regras de tolerância e matching automático.
              </p>
            </div>
            <Button 
              className="w-full gap-2 shadow-lg shadow-primary/20" 
              onClick={handleAgendar} 
              disabled={!contaBancariaId || agendar.isPending}
            >
              {agendar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Iniciar Processamento
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Fila de Status de Processamento
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              {logs?.length || 0} TAREFAS
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
            ) : !logs || logs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/10">
                <History className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p className="font-medium text-lg">Nenhuma tarefa na fila</p>
                <p className="text-sm">Agende um processamento para começar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-300",
                      log.status === 'processando' ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : "bg-card hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={log.status === 'concluido' ? 'default' : log.status === 'erro' ? 'destructive' : 'secondary'} 
                            className="gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          >
                            {log.status === 'concluido' ? (
                              <><CheckCircle2 className="h-3 w-3" /> Concluído</>
                            ) : log.status === 'erro' ? (
                              <><AlertCircle className="h-3 w-3" /> Falha</>
                            ) : (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Processando</>
                            )}
                          </Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            ID: {log.id.split('-')[0]}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm">
                          {log.contas_bancarias?.nome} <span className="text-muted-foreground font-normal">({log.contas_bancarias?.banco})</span>
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}</p>
                        {log.status === 'erro' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] font-bold text-destructive mt-1 hover:bg-destructive/10"
                            onClick={() => handleReprocessar(log.id)}
                            disabled={reprocessar.isPending}
                          >
                            <RefreshCw className={cn("h-3 w-3 mr-1", reprocessar.isPending && "animate-spin")} /> REPROCESSAR
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Período</p>
                        <p className="text-xs font-semibold">{format(new Date(log.data_inicio), "dd/MM/yy")} - {format(new Date(log.data_fim), "dd/MM/yy")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Total Analisado</p>
                        <p className="text-xs font-semibold">{log.total_processado || 0} lançamentos</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Conciliados</p>
                        <p className="text-xs font-semibold text-success">{log.total_conciliado || 0}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Inconsistências</p>
                        <p className={cn("text-xs font-bold", log.divergencias_encontradas > 0 ? "text-destructive" : "text-success")}>
                          {log.divergencias_encontradas || 0}
                        </p>
                      </div>
                    </div>

                    {log.status === 'processando' && (
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-primary uppercase">
                          <span>Progresso atual</span>
                          <span>{Math.round(log.progresso || 0)}%</span>
                        </div>
                        <Progress value={log.progresso || 0} className="h-1.5" />
                      </div>
                    )}

                    {log.status === 'erro' && log.erro_detalhe && (
                      <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                        <div className="flex gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-destructive uppercase tracking-tight">Erro no Motor de Conciliação</p>
                            <p className="text-xs text-destructive/80 leading-relaxed italic">{log.erro_detalhe}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {log.status === 'concluido' && log.divergencias_encontradas > 0 && (
                      <div className="mt-4 p-3 rounded-xl bg-warning/5 border border-warning/10 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                          <AlertCircle className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-warning-foreground uppercase tracking-tight">Divergências Detectadas</p>
                          <p className="text-[11px] text-warning-foreground/70">Foram identificadas inconsistências de saldo ou valores. Verifique a aba de Divergências.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
