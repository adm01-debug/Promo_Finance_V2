import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Building2, Users, AlertTriangle, TrendingDown, TrendingUp,
  Target, Clock, DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { 
  useInadimplenciaPorRamo, 
  useInadimplenciaPorVendedor 
} from "@/hooks/useInadimplenciaSegmentada";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(142 76% 36%)",
  "hsl(221 83% 53%)",
  "hsl(262 83% 58%)",
];

const getRiskColor = (taxa: number) => {
  if (taxa >= 30) return "destructive";
  if (taxa >= 15) return "warning";
  return "success";
};

const getRiskBg = (taxa: number) => {
  if (taxa >= 30) return "bg-destructive/10 border-destructive/20";
  if (taxa >= 15) return "bg-warning/10 border-warning/20";
  return "bg-success/10 border-success/20";
};

export function InadimplenciaSegmentada() {
  const { data: porRamo, isLoading: loadingRamo } = useInadimplenciaPorRamo();
  const { data: porVendedor, isLoading: loadingVendedor } = useInadimplenciaPorVendedor();

  const totaisRamo = porRamo?.reduce((acc, item) => ({
    valor_total: acc.valor_total + item.valor_total,
    valor_vencido: acc.valor_vencido + item.valor_vencido,
    total_contas: acc.total_contas + item.total_contas,
    total_vencido: acc.total_vencido + item.total_vencido,
  }), { valor_total: 0, valor_vencido: 0, total_contas: 0, total_vencido: 0 });

  const taxaGeralRamo = totaisRamo && totaisRamo.total_contas > 0
    ? (totaisRamo.total_vencido / totaisRamo.total_contas) * 100
    : 0;

  const pieDataRamo = porRamo?.slice(0, 6).map((item, index) => ({
    name: item.ramo,
    value: item.valor_vencido,
    fill: COLORS[index % COLORS.length],
  })) || [];

  const barDataVendedor = porVendedor?.map(v => ({
    nome: v.vendedor_nome.split(' ')[0],
    taxa: v.taxa_inadimplencia,
    meta: v.atingimento_meta,
    valor_vencido: v.valor_vencido,
  })) || [];

  if (loadingRamo || loadingVendedor) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Resumidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Geral</p>
                  <p className="text-2xl font-bold">{formatPercentage(taxaGeralRamo)}</p>
                </div>
                <div className={`p-3 rounded-full ${getRiskBg(taxaGeralRamo)}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Vencido</p>
                  <p className="text-2xl font-bold">{formatCurrency(totaisRamo?.valor_vencido || 0)}</p>
                </div>
                <div className="p-3 rounded-full bg-destructive/10">
                  <DollarSign className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-chart-1">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ramos Cadastrados</p>
                  <p className="text-2xl font-bold">{porRamo?.length || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-chart-1/10">
                  <Building2 className="h-5 w-5 text-chart-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-chart-2">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendedores Ativos</p>
                  <p className="text-2xl font-bold">{porVendedor?.length || 0}</p>
                </div>
                <div className="p-3 rounded-full bg-chart-2/10">
                  <Users className="h-5 w-5 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="ramo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="ramo" className="gap-2">
            <Building2 className="h-4 w-4" />
            Por Ramo de Atividade
          </TabsTrigger>
          <TabsTrigger value="vendedor" className="gap-2">
            <Users className="h-4 w-4" />
            Por Vendedor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ramo" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Pizza */}
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

            {/* Lista de Ramos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ranking por Taxa de Inadimplência</CardTitle>
                <CardDescription>Ramos ordenados por risco</CardDescription>
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
                      <Badge variant={getRiskColor(ramo.taxa_inadimplencia) as "destructive" | "warning" | "success"}>
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
                        <p className="font-medium">{ramo.total_vencido}/{ramo.total_contas}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Atraso Médio</p>
                        <p className="font-medium">{Math.round(ramo.dias_atraso_medio)} dias</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(!porRamo || porRamo.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum ramo de atividade cadastrado</p>
                    <p className="text-sm">Adicione ramos aos clientes para ver análises</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendedor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Barras */}
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
                          name === 'taxa' ? 'Inadimplência' : 'Meta Atingida'
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

            {/* Lista de Vendedores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance dos Vendedores</CardTitle>
                <CardDescription>Detalhamento individual</CardDescription>
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
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {vendedor.vendedor_nome.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">{vendedor.vendedor_nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {vendedor.taxa_inadimplencia > 20 ? (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-success" />
                        )}
                        <Badge variant={getRiskColor(vendedor.taxa_inadimplencia) as "destructive" | "warning" | "success"}>
                          {formatPercentage(vendedor.taxa_inadimplencia)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Meta do Mês
                        </span>
                        <span className="font-medium">
                          {formatPercentage(vendedor.atingimento_meta)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(vendedor.atingimento_meta, 100)} 
                        className="h-2"
                      />
                      
                      <div className="grid grid-cols-2 gap-2 text-sm pt-1">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Vencido:</span>
                          <span className="font-medium">{formatCurrency(vendedor.valor_vencido)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Atraso:</span>
                          <span className="font-medium">{Math.round(vendedor.dias_atraso_medio)} dias</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(!porVendedor || porVendedor.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum vendedor cadastrado</p>
                    <p className="text-sm">Cadastre vendedores para ver análises</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
