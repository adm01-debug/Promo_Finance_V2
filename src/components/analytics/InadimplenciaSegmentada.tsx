import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Building2, Users, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import {
  useInadimplenciaPorRamo,
  useInadimplenciaPorVendedor,
  usePrevisoesInadimplencia,
} from '@/hooks/useInadimplenciaSegmentada';
import { COLORS, getRiskColor, getRiskBg } from './inadimplencia-config';
import { PredicaoTab } from './PredicaoTab';
import { InadimplenciaKpis } from './InadimplenciaKpis';

export function InadimplenciaSegmentada() {
  const { data: porRamo, isLoading: loadingRamo } = useInadimplenciaPorRamo();
  const { data: porVendedor, isLoading: loadingVendedor } = useInadimplenciaPorVendedor();
  const { data: previsoes, isLoading: loadingPrevisoes } = usePrevisoesInadimplencia();

  const totaisRamo = porRamo?.reduce(
    (acc, item) => ({
      valor_total: acc.valor_total + item.valor_total,
      valor_vencido: acc.valor_vencido + item.valor_vencido,
      total_contas: acc.total_contas + item.total_contas,
      total_vencido: acc.total_vencido + item.total_vencido,
    }),
    { valor_total: 0, valor_vencido: 0, total_contas: 0, total_vencido: 0 }
  );

  const taxaGeralRamo =
    totaisRamo && totaisRamo.total_contas > 0
      ? (totaisRamo.total_vencido / totaisRamo.total_contas) * 100
      : 0;

  const pieDataRamo =
    porRamo?.slice(0, 6).map((item, index) => ({
      name: item.ramo,
      value: item.valor_vencido,
      fill: COLORS[index % COLORS.length],
    })) || [];

  const barDataVendedor =
    porVendedor?.map((v) => ({
      nome: v.vendedor_nome.split(' ')[0],
      taxa: v.taxa_inadimplencia,
      meta: v.atingimento_meta,
      valor_vencido: v.valor_vencido,
    })) || [];

  if (loadingRamo || loadingVendedor || loadingPrevisoes) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com IA Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Análise Segmentada de Inadimplência</h2>
          <p className="text-muted-foreground">
            Monitoramento segmentado e predições baseadas em IA.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
          <BrainCircuit className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">Engine Preditiva Ativa</span>
        </div>
      </div>

      {/* KPIs Resumidos */}
      <InadimplenciaKpis taxaGeralRamo={taxaGeralRamo} totaisRamo={totaisRamo} />

      <Tabs defaultValue="predicao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="predicao" className="gap-2">
            <BrainCircuit className="h-4 w-4" />
            Insights Preditivos
          </TabsTrigger>
          <TabsTrigger value="ramo" className="gap-2">
            <Building2 className="h-4 w-4" />
            Por Ramo
          </TabsTrigger>
          <TabsTrigger value="vendedor" className="gap-2">
            <Users className="h-4 w-4" />
            Por Vendedor
          </TabsTrigger>
        </TabsList>

        <PredicaoTab previsoes={previsoes} taxaGeralRamo={taxaGeralRamo} />

        <TabsContent value="ramo" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Ramo</CardTitle>
                <CardDescription>Valor vencido por segmento</CardDescription>
              </CardHeader>
              <CardContent>
                {pieDataRamo.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieDataRamo}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieDataRamo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados de inadimplência por ramo
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ranking por Risco</CardTitle>
                <CardDescription>Ramos ordenados por taxa de inadimplência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[340px] overflow-y-auto">
                {porRamo?.map((ramo, index) => (
                  <motion.div
                    key={ramo.ramo}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${getRiskBg(ramo.taxa_inadimplencia)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{ramo.ramo}</span>
                      </div>
                      <Badge
                        variant={
                          getRiskColor(ramo.taxa_inadimplencia) as
                            | 'destructive'
                            | 'warning'
                            | 'success'
                        }
                      >
                        {formatPercentage(ramo.taxa_inadimplencia)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vencido</p>
                        <p className="font-medium">{formatCurrency(ramo.valor_vencido)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contas</p>
                        <p className="font-medium">
                          {ramo.total_vencido}/{ramo.total_contas}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Atraso Médio</p>
                        <p className="font-medium">{Math.round(ramo.dias_atraso_medio)} dias</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendedor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inadimplência vs Meta</CardTitle>
                <CardDescription>Comparativo de performance por vendedor</CardDescription>
              </CardHeader>
              <CardContent>
                {barDataVendedor.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barDataVendedor} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis dataKey="nome" type="category" width={80} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(1)}%`,
                          name === 'taxa' ? 'Inadimplência' : 'Meta Atingida',
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="taxa"
                        name="Inadimplência"
                        fill="hsl(var(--destructive))"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="meta"
                        name="Meta Atingida"
                        fill="hsl(var(--chart-2))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados de vendedores
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Individual</CardTitle>
                <CardDescription>Detalhamento por vendedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[340px] overflow-y-auto">
                {porVendedor?.map((vendedor, index) => (
                  <motion.div
                    key={vendedor.vendedor_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {vendedor.vendedor_nome.charAt(0)}
                        </div>
                        <span className="font-medium">{vendedor.vendedor_nome}</span>
                      </div>
                      <Badge
                        variant={
                          getRiskColor(vendedor.taxa_inadimplencia) as
                            | 'destructive'
                            | 'warning'
                            | 'success'
                        }
                      >
                        {formatPercentage(vendedor.taxa_inadimplencia)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Atingimento de Meta</span>
                        <span className="font-semibold">
                          {formatPercentage(vendedor.atingimento_meta)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(vendedor.atingimento_meta, 100)}
                        className="h-1.5"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                        <span>Vencido: {formatCurrency(vendedor.valor_vencido)}</span>
                        <span>Atraso: {Math.round(vendedor.dias_atraso_medio)} dias</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
