import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-500" />
          Transações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (transacoes || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Clock className="h-10 w-10 mb-2" />
              <p className="text-sm">Nenhuma transação recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(transacoes || []).map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className={cn(
                    'p-2 rounded-full',
                    t.tipo === 'receita' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-red-100 dark:bg-red-900/30'
                  )}>
                    {t.tipo === 'receita' ? (
                      <ArrowDownCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.entidade}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          'text-sm font-bold',
                          t.tipo === 'receita' ? 'text-green-600' : 'text-red-500'
                        )}>
                          {t.tipo === 'receita' ? '+' : '-'}{formatCurrency(t.valor)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(t.data), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
