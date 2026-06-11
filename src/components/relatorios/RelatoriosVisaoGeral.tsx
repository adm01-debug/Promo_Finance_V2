import { Loader2, PieChart as PieChartIcon, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { motion } from 'framer-motion';

const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--secondary))', 
  'hsl(var(--success))', 
  'hsl(var(--accent))', 
  'hsl(var(--warning))', 
  'hsl(var(--destructive))'
];

interface RelatoriosVisaoGeralProps {
  fluxoMensal: Array<{ mes: string; receitas: number; despesas: number; saldo: number }> | undefined;
  despesasPorCategoria: Array<{ nome: string; valor: number; percentual: number }> | undefined;
  receitasPorCliente: Array<{ cliente: string; valor: number }> | undefined;
  inadimplenciaPorMes: Array<{ mes: string; taxa: number; valor: number }> | undefined;
  loadingFluxo: boolean;
  loadingDespesas: boolean;
}

export function RelatoriosVisaoGeral({ 
  fluxoMensal, 
  despesasPorCategoria, 
  receitasPorCliente, 
  inadimplenciaPorMes, 
  loadingFluxo, 
  loadingDespesas 
}: RelatoriosVisaoGeralProps) {
  
  const tooltipStyle = { 
    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: '16px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '12px'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Fluxo de Caixa Mensal */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden group">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10 text-success">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Fluxo de Caixa Mensal</CardTitle>
                <CardDescription className="font-medium text-xs uppercase tracking-widest opacity-60">Performance Financeira Real</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-6 pt-2">
            {loadingFluxo ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fluxoMensal || []} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    fontWeight="bold"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    fontWeight="bold"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} barSize={20} />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    name="Saldo Líquido" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Despesas por Categoria */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <PieChartIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Despesas por Categoria</CardTitle>
                <CardDescription className="font-medium text-xs uppercase tracking-widest opacity-60">Distribuição de Capital</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-6 pt-2">
            {loadingDespesas ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (despesasPorCategoria || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-30">
                <PieChartIcon className="h-16 w-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Sem dados de despesas reais</p>
              </div>
            ) : (
              <div className="flex h-full items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={despesasPorCategoria} 
                        dataKey="valor" 
                        nameKey="nome" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={100} 
                        paddingAngle={5}
                      >
                        {(despesasPorCategoria || []).map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col justify-center space-y-4 pr-4">
                  {(despesasPorCategoria || []).slice(0, 5).map((cat, i) => (
                    <div key={cat.nome} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="truncate max-w-[120px]">{cat.nome}</span>
                        </div>
                        <span className="text-primary">{cat.percentual.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentual}%` }}
                          transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                          className="h-full rounded-full" 
                          style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Receitas por Cliente */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Top Receitas por Cliente</CardTitle>
                <CardDescription className="font-medium text-xs uppercase tracking-widest opacity-60">Principais Fontes de Faturamento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-6 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={receitasPorCliente} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  dataKey="cliente" 
                  type="category" 
                  width={120} 
                  stroke="rgba(255,255,255,0.5)" 
                  fontSize={10} 
                  fontWeight="black"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                <Bar 
                  dataKey="valor" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 6, 6, 0]} 
                  barSize={18}
                >
                  {(receitasPorCliente || []).map((_, i) => (
                    <Cell key={`cell-${i}`} fill={i === 0 ? 'hsl(var(--primary))' : 'rgba(var(--primary-rgb), 0.6)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Evolução da Inadimplência */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-warning/10 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Matriz de Inadimplência</CardTitle>
                <CardDescription className="font-medium text-xs uppercase tracking-widest opacity-60">Risco e Exposição de Crédito</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-6 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={inadimplenciaPorMes} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="mes" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left" 
                  tickFormatter={(v) => `${v}%`} 
                  stroke="hsl(var(--warning))" 
                  fontSize={10} 
                  fontWeight="black"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
                  stroke="hsl(var(--destructive))" 
                  fontSize={10} 
                  fontWeight="black"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(v: number, name: string) => name === 'taxa' ? `${v.toFixed(1)}%` : formatCurrency(v)} 
                  contentStyle={tooltipStyle} 
                />
                <Legend iconType="wye" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar 
                  yAxisId="right" 
                  dataKey="valor" 
                  name="Exposição ($)" 
                  fill="rgba(var(--destructive-rgb), 0.3)" 
                  stroke="hsl(var(--destructive))"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]} 
                  barSize={25} 
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="taxa" 
                  name="Taxa de Risco (%)" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={4} 
                  dot={{ r: 5, fill: 'hsl(var(--warning))', strokeWidth: 2, stroke: '#fff' }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
