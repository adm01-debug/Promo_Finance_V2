import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, ArrowDownCircle, ArrowUpCircle, Sparkles } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

  const totalDia = useMemo(() => {
    return vencimentosDoDia.reduce((acc, v) => {
      return acc + (v.tipo === 'receber' ? v.valor : -v.valor);
    }, 0);
  }, [vencimentosDoDia]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="h-full overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <CalendarDays className="h-5 w-5 text-blue-500" />
            </motion.div>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">
              Calendário de Vencimentos
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div 
            className="flex justify-center"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={month}
              onMonthChange={setMonth}
              locale={ptBR}
              className="rounded-xl border shadow-sm pointer-events-auto"
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
          </motion.div>

          <div className="flex items-center justify-center gap-6 text-xs">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-red-300 to-red-400 shadow-sm" />
              <span className="font-medium">Pagar</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-green-300 to-green-400 shadow-sm" />
              <span className="font-medium">Receber</span>
            </motion.div>
          </div>

          <motion.div 
            className="border-t pt-4"
            layout
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              {vencimentosDoDia.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'font-bold',
                      totalDia >= 0 ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'
                    )}
                  >
                    {totalDia >= 0 ? '+' : ''}{formatCurrency(totalDia)}
                  </Badge>
                </motion.div>
              )}
            </div>
            <ScrollArea className="h-[120px]">
              <AnimatePresence mode="popLayout">
                {vencimentosDoDia.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-6 text-muted-foreground"
                  >
                    <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhum vencimento nesta data</p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {vencimentosDoDia.map((v, index) => (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors',
                          v.tipo === 'pagar' 
                            ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 hover:from-red-100 hover:to-orange-100' 
                            : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={cn(
                              'p-2 rounded-full',
                              v.tipo === 'pagar' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                            )}
                          >
                            {v.tipo === 'pagar' ? (
                              <ArrowUpCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-green-500" />
                            )}
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[140px]">{v.descricao}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{v.entidade}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'text-sm font-bold tabular-nums',
                          v.tipo === 'pagar' ? 'text-red-600' : 'text-green-600'
                        )}>
                          {v.tipo === 'pagar' ? '-' : '+'}{formatCurrency(v.valor)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
