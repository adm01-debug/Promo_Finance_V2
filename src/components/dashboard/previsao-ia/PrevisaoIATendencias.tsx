import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } } as const;

interface AnaliseTendencia {
  tendencia: string;
  variacao_percentual: string;
  previsao_proximo_mes: string;
  observacao: string;
}

interface Props {
  tendencias: {
    receitas: AnaliseTendencia;
    despesas: AnaliseTendencia;
    inadimplencia: AnaliseTendencia;
    margem_liquida: { atual: string; tendencia: string; previsao: string };
    dados_grafico: Array<{ mes: string; receitas: number; despesas: number; saldo: number }>;
  };
  getTendenciaIcon: (t: string) => React.ReactNode;
  getTendenciaColor: (t: string, inverted?: boolean) => string;
}

function TendenciaCard({ title, icon, data, colorFn, iconFn, inverted = false }: {
  title: string; icon: React.ReactNode; data: AnaliseTendencia;
  colorFn: (t: string, inv?: boolean) => string; iconFn: (t: string) => React.ReactNode; inverted?: boolean;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden group">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            {icon}{title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Direção</span>
            <div className={`flex items-center gap-2 ${colorFn(data?.tendencia, inverted)}`}>
              {iconFn(data?.tendencia)}
              <span className="font-black tracking-tight capitalize">{data?.tendencia}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Variação Neural (3m)</span>
            <span className="font-black text-lg tracking-tighter">{data?.variacao_percentual}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Próximo Ciclo</span>
            <span className="font-black text-lg tracking-tighter">{data?.previsao_proximo_mes}</span>
          </div>
          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] font-medium text-muted-foreground/70 leading-relaxed italic">{data?.observacao}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PrevisaoIATendencias({ tendencias, getTendenciaIcon, getTendenciaColor }: Props) {
  return (
    <div className="space-y-6">
      {tendencias.dados_grafico?.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <BarChart3 className="h-4 w-4 text-primary" />
                Evolution Matrix: Historical Projection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tendencias.dados_grafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(255,255,255,0.4)' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(255,255,255,0.4)' }} 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: number) => [formatCurrency(value), '']} 
                      labelFormatter={(label) => `Ciclo: ${label}`} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(var(--chart-1))" strokeWidth={3} fillOpacity={1} fill="url(#colorReceitas)" />
                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--chart-2))" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesas)" />
                    <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--chart-3))" strokeWidth={4} dot={{ r: 4, fill: 'hsl(var(--chart-3))', strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <TendenciaCard title="Receita Strategy" icon={<TrendingUp className="h-4 w-4 text-success" />} data={tendencias.receitas} colorFn={getTendenciaColor} iconFn={getTendenciaIcon} />
        <TendenciaCard title="Exposição Strategy" icon={<TrendingDown className="h-4 w-4 text-streak" />} data={tendencias.despesas} colorFn={getTendenciaColor} iconFn={getTendenciaIcon} inverted />
        <TendenciaCard title="Risk Tendency" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} data={tendencias.inadimplencia} colorFn={getTendenciaColor} iconFn={getTendenciaIcon} inverted />
        <motion.div variants={itemVariants}>
          <Card className="border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden group">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <PieChart className="h-4 w-4 text-blue-500" />
                Net Margin: Profit Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Margem Atual</span>
                <span className="font-black text-3xl tracking-tighter text-blue-500">{tendencias.margem_liquida?.atual}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Fluxo de Tendência</span>
                <div className={`flex items-center gap-2 ${getTendenciaColor(tendencias.margem_liquida?.tendencia)}`}>
                  {getTendenciaIcon(tendencias.margem_liquida?.tendencia)}
                  <span className="font-black tracking-tight capitalize">{tendencias.margem_liquida?.tendencia}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-medium text-muted-foreground/70 leading-relaxed italic">{tendencias.margem_liquida?.previsao}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
