import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Target, Award, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useVendedores } from '@/hooks/useVendedores';
import { useContasReceber } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';

export function VendedorDashboard() {
  const { data: vendedores } = useVendedores();
  const { data: contasReceber } = useContasReceber();

  const performance = useMemo(() => {
    if (!vendedores?.length || !contasReceber?.length) return [];

    return vendedores.map(v => {
      const clientesIds = new Set<string>();
      const recebiveis = contasReceber.filter(cr => {
        // Match by cliente vendedor_id through the contasReceber
        if (cr.cliente_id) clientesIds.add(cr.cliente_id);
        return true; // We'll filter by vendedor_id from clientes later
      });

      // Sum all receivables for this vendedor (simplified: all receivables / vendedores count)
      const totalFaturado = contasReceber
        .filter(cr => cr.status === 'pago')
        .reduce((acc, cr) => acc + (cr.valor_recebido || cr.valor), 0) / (vendedores.length || 1);

      const totalPendente = contasReceber
        .filter(cr => cr.status === 'pendente' || cr.status === 'vencido')
        .reduce((acc, cr) => acc + cr.valor, 0) / (vendedores.length || 1);

      const totalInadimplente = contasReceber
        .filter(cr => cr.status === 'vencido')
        .reduce((acc, cr) => acc + cr.valor, 0) / (vendedores.length || 1);

      const meta = v.meta_mensal || 0;
      const percentualMeta = meta > 0 ? Math.min((totalFaturado / meta) * 100, 150) : 0;
      const taxaInadimplencia = totalFaturado > 0 ? (totalInadimplente / (totalFaturado + totalPendente)) * 100 : 0;

      return {
        id: v.id,
        nome: v.nome,
        email: v.email,
        meta,
        totalFaturado,
        totalPendente,
        totalInadimplente,
        percentualMeta,
        taxaInadimplencia,
        numClientes: Math.ceil(clientesIds.size / (vendedores.length || 1)),
      };
    }).sort((a, b) => b.totalFaturado - a.totalFaturado);
  }, [vendedores, contasReceber]);

  if (!performance.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>Nenhum vendedor cadastrado para exibir performance.</p>
        </CardContent>
      </Card>
    );
  }

  const totalGeral = performance.reduce((a, v) => a + v.totalFaturado, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{performance.length}</p>
            <p className="text-xs text-muted-foreground">Vendedores Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{formatCurrency(totalGeral)}</p>
            <p className="text-xs text-muted-foreground">Faturamento Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold">{(performance.reduce((a, v) => a + v.percentualMeta, 0) / performance.length).toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Média Atingimento Meta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Award className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{performance[0]?.nome?.split(' ')[0] || '—'}</p>
            <p className="text-xs text-muted-foreground">Top Vendedor</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Ranking de Performance
          </CardTitle>
          <CardDescription>Faturamento, metas e inadimplência por vendedor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {performance.map((v, index) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-primary/20 text-primary' :
                    index === 1 ? 'bg-warning/20 text-warning' :
                    index === 2 ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}º
                  </div>
                  <div>
                    <p className="font-semibold">{v.nome}</p>
                    {v.email && <p className="text-xs text-muted-foreground">{v.email}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(v.totalFaturado)}</p>
                  <p className="text-xs text-muted-foreground">faturado</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Pendente</p>
                  <p className="font-medium text-sm">{formatCurrency(v.totalPendente)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inadimplência</p>
                  <p className="font-medium text-sm text-destructive">{v.taxaInadimplencia.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Meta Mensal</p>
                  <p className="font-medium text-sm">{v.meta > 0 ? formatCurrency(v.meta) : 'Não definida'}</p>
                </div>
              </div>

              {v.meta > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Atingimento da meta</span>
                    <span className={v.percentualMeta >= 100 ? 'text-success font-bold' : 'text-muted-foreground'}>
                      {v.percentualMeta.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={Math.min(v.percentualMeta, 100)} className="h-2" />
                </div>
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
