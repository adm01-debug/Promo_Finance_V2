import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, ArrowDownCircle, ArrowUpCircle, Clock, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface Transacao {
  id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string;
  entidade: string;
  status: string;
}

export const TransacoesRecentes = () => {
  const { data: transacoes, isLoading } = useQuery({
    queryKey: ['transacoes-recentes'],
    queryFn: async () => {
      const [pagamentos, recebimentos] = await Promise.all([
        supabase
          .from('contas_pagar')
          .select('id, descricao, valor, data_pagamento, fornecedor_nome, status')
          .eq('status', 'pago')
          .order('data_pagamento', { ascending: false })
          .limit(5),
        supabase
          .from('contas_receber')
          .select('id, descricao, valor, data_recebimento, cliente_nome, status')
          .eq('status', 'pago')
          .order('data_recebimento', { ascending: false })
          .limit(5),
      ]);

      const items: Transacao[] = [];

      (pagamentos.data || []).forEach(p => {
        if (p.data_pagamento) {
          items.push({
            id: p.id,
            tipo: 'despesa',
            descricao: p.descricao,
            valor: p.valor,
            data: p.data_pagamento,
            entidade: p.fornecedor_nome,
            status: p.status,
          });
        }
      });

      (recebimentos.data || []).forEach(r => {
        if (r.data_recebimento) {
          items.push({
            id: r.id,
            tipo: 'receita',
            descricao: r.descricao,
            valor: r.valor,
            data: r.data_recebimento,
            entidade: r.cliente_nome,
            status: r.status,
          });
        }
      });

      return items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 8);
    },
  });

  const totais = useMemo(() => {
    if (!transacoes) return { receitas: 0, despesas: 0 };
    return transacoes.reduce((acc, t) => {
      if (t.tipo === 'receita') acc.receitas += t.valor;
      else acc.despesas += t.valor;
      return acc;
    }, { receitas: 0, despesas: 0 });
  }, [transacoes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="h-full overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500/5 to-blue-500/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                <Activity className="h-5 w-5 text-cyan-500" />
              </motion.div>
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-bold">
                Transações Recentes
              </span>
            </CardTitle>
            {transacoes && transacoes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2"
              >
                <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                  +{formatCurrency(totais.receitas)}
                </Badge>
                <Badge variant="outline" className="border-red-500 text-red-600 text-xs">
                  -{formatCurrency(totais.despesas)}
                </Badge>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="text-right space-y-1.5">
                          <Skeleton className="h-4 w-20 ml-auto" />
                          <Skeleton className="h-3 w-16 ml-auto" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (transacoes || []).length === 0 ? (
              <motion.div 
                className="flex flex-col items-center justify-center h-[200px] text-muted-foreground"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-12 w-12 mb-3 text-muted-foreground/50" />
                </motion.div>
                <p className="text-sm font-medium">Nenhuma transação recente</p>
                <p className="text-xs text-muted-foreground/70">As transações aparecerão aqui</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {(transacoes || []).map((t, index) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                        t.tipo === 'receita' 
                          ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-md hover:shadow-green-100' 
                          : 'bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-900/20 dark:to-orange-900/20 hover:shadow-md hover:shadow-red-100'
                      )}
                    >
                      <motion.div 
                        className={cn(
                          'p-2.5 rounded-full shadow-sm',
                          t.tipo === 'receita' 
                            ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50' 
                            : 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/50 dark:to-orange-900/50'
                        )}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        {t.tipo === 'receita' ? (
                          <ArrowDownCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4 text-red-500" />
                        )}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{t.descricao}</p>
                            <p className="text-xs text-muted-foreground truncate">{t.entidade}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <motion.p 
                              className={cn(
                                'text-sm font-bold tabular-nums',
                                t.tipo === 'receita' ? 'text-green-600' : 'text-red-500'
                              )}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                            >
                              {t.tipo === 'receita' ? '+' : '-'}{formatCurrency(t.valor)}
                            </motion.p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(t.data), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};
