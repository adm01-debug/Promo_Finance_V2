import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MetaHistorico {
  mes: number;
  ano: number;
  label: string;
  receita: { meta: number; realizado: number; atingido: boolean };
  despesa: { meta: number; realizado: number; atingido: boolean };
  inadimplencia: { meta: number; realizado: number; atingido: boolean };
}

export const HistoricoMetasDialog = () => {
  const [open, setOpen] = useState(false);
  const [mesesExibidos, setMesesExibidos] = useState(6);

  const { data: historico, isLoading } = useQuery({
    queryKey: ['historico-metas', mesesExibidos],
    queryFn: async () => {
      const meses: MetaHistorico[] = [];
      const hoje = new Date();

      for (let i = mesesExibidos - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const mes = data.getMonth() + 1;
        const ano = data.getFullYear();
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);

        // Buscar metas do mês
        const { data: metasData } = await supabase
          .from('metas_financeiras')
          .select('tipo, valor_meta')
          .eq('mes', mes)
          .eq('ano', ano);

        // Buscar dados realizados
        const [recebidas, pagas, vencidas] = await Promise.all([
          supabase
            .from('contas_receber')
            .select('valor')
            .eq('status', 'pago')
            .gte('data_recebimento', format(inicio, 'yyyy-MM-dd'))
            .lte('data_recebimento', format(fim, 'yyyy-MM-dd')),
          supabase
            .from('contas_pagar')
            .select('valor')
            .eq('status', 'pago')
            .gte('data_pagamento', format(inicio, 'yyyy-MM-dd'))
            .lte('data_pagamento', format(fim, 'yyyy-MM-dd')),
          supabase
            .from('contas_receber')
            .select('valor')
            .eq('status', 'vencido')
            .gte('data_vencimento', format(inicio, 'yyyy-MM-dd'))
            .lte('data_vencimento', format(fim, 'yyyy-MM-dd')),
        ]);

        const totalRecebido = (recebidas.data || []).reduce((acc, r) => acc + r.valor, 0);
        const totalPago = (pagas.data || []).reduce((acc, p) => acc + p.valor, 0);
        const totalVencido = (vencidas.data || []).reduce((acc, v) => acc + v.valor, 0);
        const taxaInadimplencia = totalRecebido + totalVencido > 0 
          ? (totalVencido / (totalRecebido + totalVencido)) * 100 
          : 0;

        const getMeta = (tipo: string, padrao: number) => {
          const meta = metasData?.find(m => m.tipo === tipo);
          return meta?.valor_meta ?? padrao;
        };

        const metaReceita = getMeta('receita', 150000);
        const metaDespesa = getMeta('despesa', 100000);
        const metaInadimplencia = getMeta('inadimplencia', 5);

        meses.push({
          mes,
          ano,
          label: format(data, 'MMM/yy', { locale: ptBR }),
          receita: {
            meta: metaReceita,
            realizado: totalRecebido,
            atingido: totalRecebido >= metaReceita,
          },
          despesa: {
            meta: metaDespesa,
            realizado: totalPago,
            atingido: totalPago <= metaDespesa,
          },
          inadimplencia: {
            meta: metaInadimplencia,
            realizado: taxaInadimplencia,
            atingido: taxaInadimplencia <= metaInadimplencia,
          },
        });
      }

      return meses;
    },
    enabled: open,
  });

  const chartData = historico?.map(h => ({
    name: h.label,
    'Meta Receita': h.receita.meta,
    'Receita Realizada': h.receita.realizado,
    'Meta Despesa': h.despesa.meta,
    'Despesa Realizada': h.despesa.realizado,
  })) || [];

  const resumo = historico ? {
    receitasAtingidas: historico.filter(h => h.receita.atingido).length,
    despesasAtingidas: historico.filter(h => h.despesa.atingido).length,
    inadimplenciaAtingidas: historico.filter(h => h.inadimplencia.atingido).length,
    total: historico.length,
  } : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Histórico de Metas
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-muted-foreground">
            Comparativo dos últimos {mesesExibidos} meses
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMesesExibidos(Math.max(3, mesesExibidos - 3))}
              disabled={mesesExibidos <= 3}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">{mesesExibidos} meses</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMesesExibidos(Math.min(12, mesesExibidos + 3))}
              disabled={mesesExibidos >= 12}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            {/* Resumo */}
            {resumo && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Receitas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {resumo.receitasAtingidas}/{resumo.total}
                  </p>
                  <p className="text-xs text-muted-foreground">metas atingidas</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Despesas</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {resumo.despesasAtingidas}/{resumo.total}
                  </p>
                  <p className="text-xs text-muted-foreground">dentro do limite</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Inadimplência</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {resumo.inadimplenciaAtingidas}/{resumo.total}
                  </p>
                  <p className="text-xs text-muted-foreground">sob controle</p>
                </Card>
              </div>
            )}

            {/* Gráfico */}
            <Card className="p-4 mb-6">
              <p className="text-sm font-medium mb-4">Evolução Receitas vs Despesas</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Receita Realizada" 
                      stroke="hsl(150, 70%, 42%)" 
                      fill="url(#colorReceita)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Despesa Realizada" 
                      stroke="hsl(0, 78%, 55%)" 
                      fill="url(#colorDespesa)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Detalhes por mês */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Detalhes por Mês</p>
              {historico?.map((h, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium capitalize">
                      {format(new Date(h.ano, h.mes - 1), "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <div className="flex items-center gap-1">
                      {h.receita.atingido && h.despesa.atingido && h.inadimplencia.atingido ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Todas metas atingidas
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Parcialmente atingido
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {h.receita.atingido ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-muted-foreground">Receita</span>
                      </div>
                      <p className={cn('font-medium', h.receita.atingido ? 'text-green-600' : 'text-red-500')}>
                        {formatCurrency(h.receita.realizado)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Meta: {formatCurrency(h.receita.meta)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {h.despesa.atingido ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-muted-foreground">Despesa</span>
                      </div>
                      <p className={cn('font-medium', h.despesa.atingido ? 'text-blue-600' : 'text-red-500')}>
                        {formatCurrency(h.despesa.realizado)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Limite: {formatCurrency(h.despesa.meta)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {h.inadimplencia.atingido ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-muted-foreground">Inadimpl.</span>
                      </div>
                      <p className={cn('font-medium', h.inadimplencia.atingido ? 'text-purple-600' : 'text-red-500')}>
                        {h.inadimplencia.realizado.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Máx: {h.inadimplencia.meta}%
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
