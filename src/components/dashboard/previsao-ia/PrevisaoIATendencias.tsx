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
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Direção:</span><div className={`flex items-center gap-2 ${colorFn(data?.tendencia, inverted)}`}>{iconFn(data?.tendencia)}<span className="font-medium capitalize">{data?.tendencia}</span></div></div>
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Variação (3m):</span><span className="font-semibold">{data?.variacao_percentual}</span></div>
          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Previsão:</span><span className="font-semibold">{data?.previsao_proximo_mes}</span></div>
          <p className="text-xs text-muted-foreground border-t pt-3">{data?.observacao}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PrevisaoIATendencias({ tendencias, getTendenciaIcon, getTendenciaColor }: Props) {
  return (
    <div className="space-y-4">
      {tendencias.dados_grafico?.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" />Evolução Histórica</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tendencias.dados_grafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Período: ${label}`} />
                  <Legend />
                  <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
                  <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <TendenciaCard title="Tendência de Receitas" icon={<TrendingUp className="h-4 w-4 text-success" />} data={tendencias.receitas} colorFn={getTendenciaColor} iconFn={getTendenciaIcon} />
        <TendenciaCard title="Tendência de Despesas" icon={<TrendingDown className="h-4 w-4 text-streak" />} data={tendencias.despesas} colorFn={getTendenciaColor} iconFn={getTendenciaIcon} inverted />
        <TendenciaCard title="Tendência de Inadimplência" icon={<AlertTriangle className="h-4 w-4 text-destructive" />} data={tendencias.inadimplencia} colorFn={getTendenciaColor} iconFn={getTendenciaIcon} inverted />
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><PieChart className="h-4 w-4 text-accent-foreground" />Margem Líquida</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Atual:</span><span className="font-bold text-xl">{tendencias.margem_liquida?.atual}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Tendência:</span><div className={`flex items-center gap-2 ${getTendenciaColor(tendencias.margem_liquida?.tendencia)}`}>{getTendenciaIcon(tendencias.margem_liquida?.tendencia)}<span className="font-medium capitalize">{tendencias.margem_liquida?.tendencia}</span></div></div>
              <p className="text-xs text-muted-foreground border-t pt-3">{tendencias.margem_liquida?.previsao}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
