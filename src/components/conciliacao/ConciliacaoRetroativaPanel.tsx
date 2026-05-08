import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, History, PlayCircle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useConciliacaoRetroativa } from '@/hooks/useConciliacaoRetroativa';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Props {
  contaBancariaId?: string;
}

export function ConciliacaoRetroativaPanel({ contaBancariaId }: Props) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const { agendar } = useConciliacaoRetroativa();
  
  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs-conciliacao-retroativa', contaBancariaId],
    queryFn: async () => {
      if (!contaBancariaId) return [];
      const { data, error } = await supabase
        .from('logs_conciliacao_retroativa')
        .select('*')
        .eq('conta_bancaria_id', contaBancariaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contaBancariaId,
  });

  const handleAgendar = () => {
    if (!contaBancariaId) return;
    agendar.mutate({
      contaBancariaId,
      dataInicio: format(dateRange.from, 'yyyy-MM-dd'),
      dataFim: format(dateRange.to, 'yyyy-MM-dd')
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" /> Agendar Conciliação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Período de Retroação</Label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
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
          <p className="text-xs text-muted-foreground">
            O motor de IA irá reanalisar todos os lançamentos bancários e do sistema no período selecionado para encontrar novos matches ou inconsistências.
          </p>
          <Button className="w-full gap-2" onClick={handleAgendar} disabled={!contaBancariaId || agendar.isPending}>
            {agendar.isPending ? 'Agendando...' : 'Iniciar Processamento Retroativo'}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Histórico de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum agendamento recente para esta conta.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.status === 'concluido' ? 'default' : log.status === 'erro' ? 'destructive' : 'secondary'}>
                        {log.status === 'concluido' ? 'Concluído' : log.status === 'erro' ? 'Erro' : 'Processando'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                    {log.divergencias_encontradas > 0 && (
                      <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 gap-1">
                        <AlertCircle className="h-3 w-3" /> {log.divergencias_encontradas} Inconsistências
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="text-xs">
                      <p className="text-muted-foreground uppercase font-semibold text-[10px]">Período</p>
                      <p className="font-medium mt-0.5">{format(new Date(log.data_inicio), "dd/MM/yy")} - {format(new Date(log.data_fim), "dd/MM/yy")}</p>
                    </div>
                    <div className="text-xs text-right">
                      <p className="text-muted-foreground uppercase font-semibold text-[10px]">Processado</p>
                      <p className="font-medium mt-0.5">{log.total_conciliado} / {log.total_processado} conciliados</p>
                    </div>
                  </div>
                  {log.divergencias_encontradas > 0 && (
                    <div className="mt-3 p-2 rounded bg-destructive/5 border border-destructive/10 text-[11px] text-destructive flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Inconsistências identificadas no saldo ou valores. Verifique a aba Divergências.
                    </div>
                  )}
                  {log.status === 'concluido' && log.divergencias_encontradas === 0 && (
                    <div className="mt-3 p-2 rounded bg-success/5 border border-success/10 text-[11px] text-success flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Conciliação retroativa concluída com 100% de integridade.
                    </div>
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
