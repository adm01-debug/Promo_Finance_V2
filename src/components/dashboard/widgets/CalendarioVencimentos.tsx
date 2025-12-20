import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface Vencimento {
  id: string;
  tipo: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  data: Date;
  entidade: string;
}

export const CalendarioVencimentos = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  const { data: vencimentos = [] } = useQuery({
    queryKey: ['vencimentos-calendario', format(month, 'yyyy-MM')],
    queryFn: async () => {
      const inicio = startOfMonth(month);
      const fim = endOfMonth(month);

      const [contasPagar, contasReceber] = await Promise.all([
        supabase
          .from('contas_pagar')
          .select('id, descricao, valor, data_vencimento, fornecedor_nome')
          .gte('data_vencimento', format(inicio, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(fim, 'yyyy-MM-dd'))
          .in('status', ['pendente', 'vencido']),
        supabase
          .from('contas_receber')
          .select('id, descricao, valor, data_vencimento, cliente_nome')
          .gte('data_vencimento', format(inicio, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(fim, 'yyyy-MM-dd'))
          .in('status', ['pendente', 'vencido']),
      ]);

      const items: Vencimento[] = [];

      (contasPagar.data || []).forEach(cp => {
        items.push({
          id: cp.id,
          tipo: 'pagar',
          descricao: cp.descricao,
          valor: cp.valor,
          data: new Date(cp.data_vencimento),
          entidade: cp.fornecedor_nome,
        });
      });

      (contasReceber.data || []).forEach(cr => {
        items.push({
          id: cr.id,
          tipo: 'receber',
          descricao: cr.descricao,
          valor: cr.valor,
          data: new Date(cr.data_vencimento),
          entidade: cr.cliente_nome,
        });
      });

      return items;
    },
  });

  const vencimentosDoDia = useMemo(() => {
    return vencimentos.filter(v => isSameDay(v.data, selectedDate));
  }, [vencimentos, selectedDate]);

  const diasComVencimento = useMemo(() => {
    const dias = new Map<string, { pagar: number; receber: number }>();
    vencimentos.forEach(v => {
      const key = format(v.data, 'yyyy-MM-dd');
      const current = dias.get(key) || { pagar: 0, receber: 0 };
      current[v.tipo]++;
      dias.set(key, current);
    });
    return dias;
  }, [vencimentos]);

  const modifiers = useMemo(() => {
    const hasPagar: Date[] = [];
    const hasReceber: Date[] = [];
    const hasBoth: Date[] = [];

    diasComVencimento.forEach((value, key) => {
      const date = new Date(key);
      if (value.pagar > 0 && value.receber > 0) {
        hasBoth.push(date);
      } else if (value.pagar > 0) {
        hasPagar.push(date);
      } else if (value.receber > 0) {
        hasReceber.push(date);
      }
    });

    return { hasPagar, hasReceber, hasBoth };
  }, [diasComVencimento]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          Calendário de Vencimentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={month}
            onMonthChange={setMonth}
            locale={ptBR}
            className="rounded-md border pointer-events-auto"
            modifiers={modifiers}
            modifiersStyles={{
              hasPagar: { backgroundColor: 'hsl(0, 78%, 95%)', color: 'hsl(0, 78%, 45%)' },
              hasReceber: { backgroundColor: 'hsl(150, 70%, 95%)', color: 'hsl(150, 70%, 35%)' },
              hasBoth: { 
                background: 'linear-gradient(135deg, hsl(0, 78%, 95%) 50%, hsl(150, 70%, 95%) 50%)',
                color: 'hsl(215, 90%, 45%)'
              },
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-red-200" />
            <span>Pagar</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-green-200" />
            <span>Receber</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          <ScrollArea className="h-[120px]">
            {vencimentosDoDia.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum vencimento nesta data
              </p>
            ) : (
              <div className="space-y-2">
                {vencimentosDoDia.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {v.tipo === 'pagar' ? (
                        <ArrowUpCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium truncate max-w-[140px]">{v.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{v.entidade}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-sm font-bold',
                      v.tipo === 'pagar' ? 'text-red-500' : 'text-green-600'
                    )}>
                      {formatCurrency(v.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
