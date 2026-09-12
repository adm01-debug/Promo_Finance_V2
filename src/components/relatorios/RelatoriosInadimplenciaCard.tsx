import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { ESTILO_TOOLTIP_RELATORIOS } from './relatoriosVisaoGeral.constants';

interface RelatoriosInadimplenciaCardProps {
  dados: Array<{ mes: string; taxa: number; valor: number }> | undefined;
}

export function RelatoriosInadimplenciaCard({ dados }: RelatoriosInadimplenciaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning/10 text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight">
                Matriz de Inadimplência
              </CardTitle>
              <CardDescription className="font-medium text-xs uppercase tracking-widest opacity-60">
                Risco e Exposição de Crédito
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[350px] p-6 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.05)"
              />
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
                tickFormatter={(value) => `${value}%`}
                stroke="hsl(var(--warning))"
                fontSize={10}
                fontWeight="black"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                stroke="hsl(var(--destructive))"
                fontSize={10}
                fontWeight="black"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'Taxa de Risco (%)' ? `${value.toFixed(1)}%` : formatCurrency(value)
                }
                contentStyle={ESTILO_TOOLTIP_RELATORIOS}
              />
              <Legend
                iconType="wye"
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              />
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
                dot={{ r: 5, fill: 'hsl(var(--warning))', strokeWidth: 2, stroke: 'var(--bg-1)' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
