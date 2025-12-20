import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  CreditCard,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const ResumoRapido = () => {
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const { data, isLoading } = useQuery({
    queryKey: ['resumo-rapido'],
    queryFn: async () => {
      const [
        saldoBancos,
        receberSemana,
        pagarSemana,
        boletosEmitidos,
        contasConciliadas
      ] = await Promise.all([
        supabase.from('contas_bancarias').select('saldo_atual').eq('ativo', true),
        supabase
          .from('contas_receber')
          .select('valor')
          .in('status', ['pendente', 'vencido'])
          .gte('data_vencimento', format(inicioSemana, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(fimSemana, 'yyyy-MM-dd')),
        supabase
          .from('contas_pagar')
          .select('valor')
          .in('status', ['pendente', 'vencido'])
          .gte('data_vencimento', format(inicioSemana, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(fimSemana, 'yyyy-MM-dd')),
        supabase
          .from('boletos')
          .select('id')
          .gte('created_at', format(inicioMes, 'yyyy-MM-dd'))
          .lte('created_at', format(fimMes, 'yyyy-MM-dd')),
        supabase
          .from('transacoes_bancarias')
          .select('id')
          .eq('conciliada', true)
          .gte('created_at', format(inicioMes, 'yyyy-MM-dd')),
      ]);

      return {
        saldoTotal: (saldoBancos.data || []).reduce((acc, b) => acc + b.saldo_atual, 0),
        receberSemana: (receberSemana.data || []).reduce((acc, r) => acc + r.valor, 0),
        pagarSemana: (pagarSemana.data || []).reduce((acc, p) => acc + p.valor, 0),
        boletosEmitidos: boletosEmitidos.data?.length || 0,
        contasConciliadas: contasConciliadas.data?.length || 0,
      };
    },
  });

  const insights = [
    {
      icon: Wallet,
      label: 'Saldo disponível',
      value: data?.saldoTotal || 0,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      format: 'currency',
    },
    {
      icon: TrendingUp,
      label: 'Receber esta semana',
      value: data?.receberSemana || 0,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      format: 'currency',
    },
    {
      icon: TrendingDown,
      label: 'Pagar esta semana',
      value: data?.pagarSemana || 0,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      format: 'currency',
    },
    {
      icon: Receipt,
      label: 'Boletos emitidos (mês)',
      value: data?.boletosEmitidos || 0,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      format: 'number',
    },
    {
      icon: CreditCard,
      label: 'Transações conciliadas',
      value: data?.contasConciliadas || 0,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      format: 'number',
    },
  ];

  const fluxoSemana = (data?.receberSemana || 0) - (data?.pagarSemana || 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Resumo Rápido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {insights.slice(0, 4).map((insight, index) => (
            <div key={index} className="p-3 rounded-lg bg-muted/50">
              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('p-1.5 rounded-md', insight.bgColor)}>
                      <insight.icon className={cn('h-3.5 w-3.5', insight.color)} />
                    </div>
                    <span className="text-xs text-muted-foreground">{insight.label}</span>
                  </div>
                  <p className="text-lg font-bold">
                    {insight.format === 'currency'
                      ? formatCurrency(insight.value)
                      : insight.value}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Fluxo da semana</span>
            <Badge variant={fluxoSemana >= 0 ? 'default' : 'destructive'} className="text-xs">
              {fluxoSemana >= 0 ? 'Positivo' : 'Negativo'}
            </Badge>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            fluxoSemana >= 0 ? 'text-green-600' : 'text-red-500'
          )}>
            {fluxoSemana >= 0 ? '+' : ''}{formatCurrency(fluxoSemana)}
          </p>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link to="/fluxo-caixa">
            Ver fluxo de caixa completo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
