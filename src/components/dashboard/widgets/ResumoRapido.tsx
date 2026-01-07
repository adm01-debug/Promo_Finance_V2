import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  CreditCard,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/micro-interactions';

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
      bgColor: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30',
      format: 'currency',
    },
    {
      icon: TrendingUp,
      label: 'Receber esta semana',
      value: data?.receberSemana || 0,
      color: 'text-green-500',
      bgColor: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30',
      format: 'currency',
    },
    {
      icon: TrendingDown,
      label: 'Pagar esta semana',
      value: data?.pagarSemana || 0,
      color: 'text-red-500',
      bgColor: 'bg-gradient-to-br from-red-100 to-orange-200 dark:from-red-900/30 dark:to-orange-800/30',
      format: 'currency',
    },
    {
      icon: Receipt,
      label: 'Boletos emitidos (mês)',
      value: data?.boletosEmitidos || 0,
      color: 'text-purple-500',
      bgColor: 'bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-800/30',
      format: 'number',
    },
    {
      icon: CreditCard,
      label: 'Transações conciliadas',
      value: data?.contasConciliadas || 0,
      color: 'text-cyan-500',
      bgColor: 'bg-gradient-to-br from-cyan-100 to-teal-200 dark:from-cyan-900/30 dark:to-teal-800/30',
      format: 'number',
    },
  ];

  const fluxoSemana = (data?.receberSemana || 0) - (data?.pagarSemana || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="h-full overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </motion.div>
            <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-bold">
              Resumo Rápido
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {insights.slice(0, 4).map((insight, index) => (
              <motion.div 
                key={index} 
                className="p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -2 }}
              >
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div 
                        className={cn('p-2 rounded-lg shadow-sm', insight.bgColor)}
                        whileHover={{ rotate: 10 }}
                      >
                        <insight.icon className={cn('h-4 w-4', insight.color)} />
                      </motion.div>
                      <span className="text-xs text-muted-foreground font-medium">{insight.label}</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">
                      {insight.format === 'currency' ? (
                        <AnimatedCounter 
                          value={insight.value} 
                          duration={800}
                          formatter={(v) => formatCurrency(v)}
                        />
                      ) : (
                        <AnimatedCounter value={insight.value} duration={800} />
                      )}
                    </p>
                  </>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.div
              className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Fluxo da semana</span>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
              >
                <Badge 
                  variant={fluxoSemana >= 0 ? 'default' : 'destructive'} 
                  className={cn(
                    'text-xs font-bold',
                    fluxoSemana >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''
                  )}
                >
                  {fluxoSemana >= 0 ? '↗ Positivo' : '↘ Negativo'}
                </Badge>
              </motion.div>
            </div>
            <motion.p 
              className={cn(
                'text-3xl font-bold tabular-nums relative',
                fluxoSemana >= 0 ? 'text-green-600' : 'text-red-500'
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AnimatedCounter 
                value={fluxoSemana} 
                duration={1000}
                formatter={(v) => `${v >= 0 ? '+' : ''}${formatCurrency(v)}`}
              />
            </motion.p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="outline" className="w-full group/btn" asChild>
              <Link to="/fluxo-caixa">
                Ver fluxo de caixa completo
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
