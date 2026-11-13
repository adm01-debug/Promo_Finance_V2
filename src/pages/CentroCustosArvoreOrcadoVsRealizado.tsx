import { motion } from 'framer-motion';
import { PieChart, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { itemVariants, COLORS } from './CentroCustos.helpers';

interface CentroCustosArvoreOrcadoVsRealizadoProps {
  barData: { nome: string; Orçado: number; Realizado: number }[];
  distribuicao: { nome: string; valor: number; percentual: number }[];
}

export function CentroCustosArvoreOrcadoVsRealizado({
  barData,
  distribuicao,
}: CentroCustosArvoreOrcadoVsRealizadoProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div variants={itemVariants} className="lg:col-span-2">
        <Card className="card-elevated h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Orçado vs Realizado
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="nome" width={50} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(l) => `Centro: ${l}`}
                />
                <Legend />
                <Bar dataKey="Orçado" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Realizado" fill="hsl(24, 95%, 46%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="card-elevated h-[400px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="75%">
              <RePieChart>
                <Pie
                  data={distribuicao}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {distribuicao.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center">
              {distribuicao.slice(0, 3).map((item, i) => (
                <Badge key={`${item.nome}-${i}`} variant="outline" className="text-xs">
                  <span className="h-2 w-2 rounded-full mr-1" style={{ background: COLORS[i] }} />
                  {item.nome} ({item.percentual.toFixed(1)}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
