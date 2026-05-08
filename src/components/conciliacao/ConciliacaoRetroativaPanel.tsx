import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, History, PlayCircle } from 'lucide-react';
import { useConciliacaoRetroativa } from '@/hooks/useConciliacaoRetroativa';
import { ptBR } from 'date-fns/locale';

interface Props {
  contaBancariaId?: string;
}

export function ConciliacaoRetroativaPanel({ contaBancariaId }: Props) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const { agendar } = useConciliacaoRetroativa();

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
                    locale={ptBR}
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
          <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Nenhum agendamento recente para esta conta.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
