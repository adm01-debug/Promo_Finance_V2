import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { cn } from '@/lib/utils';

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

  const { data: dadosMes } = useQuery({
    queryKey: ['metas-financeiras', format(mesAtual, 'yyyy-MM')],
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
    const metaReceita = 150000; // Meta de receita mensal
    const metaDespesa = 100000; // Limite de despesas
    const metaInadimplencia = 5; // % máximo de inadimplência

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
  }, [dadosMes]);

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

  const getProgressColor = (meta: Meta) => {
    if (meta.tipo === 'receita') {
      return meta.status === 'sucesso' ? 'bg-green-500' : meta.status === 'atencao' ? 'bg-yellow-500' : 'bg-red-500';
    }
    // Para despesa e inadimplência, lógica inversa
    return meta.status === 'sucesso' ? 'bg-green-500' : meta.status === 'atencao' ? 'bg-yellow-500' : 'bg-red-500';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          Metas do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metas.map((meta) => (
          <div key={meta.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(meta.status)}
                <span className="text-sm font-medium">{meta.titulo}</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  meta.status === 'sucesso' && 'border-green-500 text-green-600',
                  meta.status === 'atencao' && 'border-yellow-500 text-yellow-600',
                  meta.status === 'risco' && 'border-red-500 text-red-600'
                )}
              >
                {meta.progresso.toFixed(0)}%
              </Badge>
            </div>
            <Progress
              value={meta.progresso}
              className="h-2"
              style={{
                '--progress-background': meta.status === 'sucesso' 
                  ? 'hsl(150, 70%, 42%)' 
                  : meta.status === 'atencao' 
                    ? 'hsl(45, 93%, 47%)' 
                    : 'hsl(0, 78%, 55%)'
              } as React.CSSProperties}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {meta.tipo === 'inadimplencia'
                  ? `${meta.valorAtual.toFixed(1)}%`
                  : formatCurrency(meta.valorAtual)}
              </span>
              <span>
                Meta: {meta.tipo === 'inadimplencia'
                  ? `${meta.valorMeta}%`
                  : formatCurrency(meta.valorMeta)}
              </span>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Economia estimada</span>
            <span className={cn(
              'text-lg font-bold',
              (dadosMes?.totalRecebido || 0) - (dadosMes?.totalPago || 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-500'
            )}>
              {formatCurrency((dadosMes?.totalRecebido || 0) - (dadosMes?.totalPago || 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
