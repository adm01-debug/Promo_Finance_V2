import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, AlertTriangle, Bell, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMetasFinanceiras } from '@/hooks/useMetasFinanceiras';
import { useVerificarMetas } from '@/hooks/useVerificarMetas';
import { EditarMetasDialog } from './EditarMetasDialog';
import { HistoricoMetasDialog } from './HistoricoMetasDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedCounter } from '@/components/ui/micro-interactions';
import { motion } from 'framer-motion';

interface Meta {
  id: string;
  titulo: string;
  tipo: 'receita' | 'despesa' | 'economia' | 'inadimplencia';
  valorMeta: number;
  valorAtual: number;
  progresso: number;
  status: 'sucesso' | 'atencao' | 'risco';
}

export const MetasFinanceiras = () => {
  const mesAtual = new Date();
  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);

  const { getMetaByTipo, isLoading: loadingMetas } = useMetasFinanceiras();
  const { mutate: verificarMetas, isPending: verificando } = useVerificarMetas();

  // Calcular % do mês decorrido para análise de risco
  const diaDoMes = mesAtual.getDate();
  const diasNoMes = endOfMonth(mesAtual).getDate();
  const percentualMesDecorrido = (diaDoMes / diasNoMes) * 100;

  const { data: dadosMes } = useQuery({
    queryKey: ['metas-financeiras-dados', format(mesAtual, 'yyyy-MM')],
    queryFn: async () => {
      const [recebidas, pagas, pendentesReceber] = await Promise.all([
        supabase
          .from('contas_receber')
          .select('valor')
          .eq('status', 'pago')
          .gte('data_recebimento', format(inicioMes, 'yyyy-MM-dd'))
          .lte('data_recebimento', format(fimMes, 'yyyy-MM-dd')),
        supabase
          .from('contas_pagar')
          .select('valor')
          .eq('status', 'pago')
          .gte('data_pagamento', format(inicioMes, 'yyyy-MM-dd'))
          .lte('data_pagamento', format(fimMes, 'yyyy-MM-dd')),
        supabase
          .from('contas_receber')
          .select('valor')
          .eq('status', 'vencido'),
      ]);

      const totalRecebido = (recebidas.data || []).reduce((acc, r) => acc + r.valor, 0);
      const totalPago = (pagas.data || []).reduce((acc, p) => acc + p.valor, 0);
      const totalInadimplencia = (pendentesReceber.data || []).reduce((acc, p) => acc + p.valor, 0);
      const totalReceitaMeta = totalRecebido + totalInadimplencia;

      return {
        totalRecebido,
        totalPago,
        totalInadimplencia,
        taxaInadimplencia: totalReceitaMeta > 0 ? (totalInadimplencia / totalReceitaMeta) * 100 : 0,
      };
    },
  });

  const metas: Meta[] = useMemo(() => {
    const metaReceita = getMetaByTipo('receita');
    const metaDespesa = getMetaByTipo('despesa');
    const metaInadimplencia = getMetaByTipo('inadimplencia');

    const progressoReceita = dadosMes ? Math.min((dadosMes.totalRecebido / metaReceita) * 100, 100) : 0;
    const progressoDespesa = dadosMes ? Math.min((dadosMes.totalPago / metaDespesa) * 100, 100) : 0;
    const progressoInadimplencia = dadosMes ? Math.min((dadosMes.taxaInadimplencia / metaInadimplencia) * 100, 100) : 0;

    return [
      {
        id: 'receita',
        titulo: 'Meta de Receitas',
        tipo: 'receita',
        valorMeta: metaReceita,
        valorAtual: dadosMes?.totalRecebido || 0,
        progresso: progressoReceita,
        status: progressoReceita >= 80 ? 'sucesso' : progressoReceita >= 50 ? 'atencao' : 'risco',
      },
      {
        id: 'despesa',
        titulo: 'Limite de Despesas',
        tipo: 'despesa',
        valorMeta: metaDespesa,
        valorAtual: dadosMes?.totalPago || 0,
        progresso: progressoDespesa,
        status: progressoDespesa <= 80 ? 'sucesso' : progressoDespesa <= 95 ? 'atencao' : 'risco',
      },
      {
        id: 'inadimplencia',
        titulo: 'Inadimplência Máxima',
        tipo: 'inadimplencia',
        valorMeta: metaInadimplencia,
        valorAtual: dadosMes?.taxaInadimplencia || 0,
        progresso: progressoInadimplencia,
        status: progressoInadimplencia <= 60 ? 'sucesso' : progressoInadimplencia <= 80 ? 'atencao' : 'risco',
      },
    ];
  }, [dadosMes, getMetaByTipo]);

  const getStatusIcon = (status: Meta['status']) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'atencao':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'risco':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Metas do Mês
          </CardTitle>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => verificarMetas()}
                    disabled={verificando}
                  >
                    {verificando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verificar alertas de metas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <HistoricoMetasDialog />
            <EditarMetasDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {metas.map((meta, index) => (
          <motion.div 
            key={meta.id} 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 300 }}
                >
                  {getStatusIcon(meta.status)}
                </motion.div>
                <span className="text-sm font-medium">{meta.titulo}</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs tabular-nums',
                  meta.status === 'sucesso' && 'border-green-500 text-green-600',
                  meta.status === 'atencao' && 'border-yellow-500 text-yellow-600',
                  meta.status === 'risco' && 'border-red-500 text-red-600'
                )}
              >
                <AnimatedCounter 
                  value={Math.round(meta.progresso)} 
                  duration={800}
                  formatter={(v) => `${v}%`}
                />
              </Badge>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${meta.progresso}%` }}
                transition={{ delay: index * 0.1 + 0.1, duration: 0.8, ease: 'easeOut' }}
                style={{
                  background: meta.status === 'sucesso' 
                    ? 'linear-gradient(90deg, hsl(150, 70%, 42%), hsl(150, 70%, 52%))' 
                    : meta.status === 'atencao' 
                      ? 'linear-gradient(90deg, hsl(45, 93%, 47%), hsl(45, 93%, 57%))' 
                      : 'linear-gradient(90deg, hsl(0, 78%, 55%), hsl(0, 78%, 65%))'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular-nums">
                {meta.tipo === 'inadimplencia' ? (
                  <AnimatedCounter 
                    value={meta.valorAtual * 10} 
                    duration={800}
                    formatter={(v) => `${(v / 10).toFixed(1)}%`}
                  />
                ) : (
                  <AnimatedCounter 
                    value={meta.valorAtual} 
                    duration={800}
                    formatter={(v) => formatCurrency(v)}
                  />
                )}
              </span>
              <span>
                Meta: {meta.tipo === 'inadimplencia'
                  ? `${meta.valorMeta}%`
                  : formatCurrency(meta.valorMeta)}
              </span>
            </div>
          </motion.div>
        ))}

        <motion.div 
          className="pt-4 border-t"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Economia estimada</span>
            <span className={cn(
              'text-lg font-bold tabular-nums',
              (dadosMes?.totalRecebido || 0) - (dadosMes?.totalPago || 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-500'
            )}>
              <AnimatedCounter 
                value={(dadosMes?.totalRecebido || 0) - (dadosMes?.totalPago || 0)} 
                duration={1000}
                formatter={(v) => formatCurrency(v)}
              />
            </span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};
