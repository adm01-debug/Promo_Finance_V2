import { motion } from 'framer-motion';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

interface EmpresaChartsProps {
  fluxoCaixaProjetado: Array<{ data: string; receitas: number; despesas: number; saldo: number }>;
  statusReceberData: Array<{ name: string; value: number; fill: string }>;
  statusPagarData: Array<{ name: string; value: number; fill: string }>;
  periodoAnalise: string;
}

export function EmpresaChartsSection({ fluxoCaixaProjetado, statusReceberData, statusPagarData, periodoAnalise }: EmpresaChartsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Fluxo de Caixa Projetado ({periodoAnalise} dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fluxoCaixaProjetado}>
              <defs>
                <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(24, 95%, 46%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(24, 95%, 46%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="data" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="saldo" stroke="hsl(24, 95%, 46%)" strokeWidth={2} fill="url(#saldoGradient)" name="Saldo" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Distribuição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receber" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="receber" className="flex-1">Receber</TabsTrigger>
              <TabsTrigger value="pagar" className="flex-1">Pagar</TabsTrigger>
            </TabsList>
            {(['receber', 'pagar'] as const).map((tipo) => {
              const data = tipo === 'receber' ? statusReceberData : statusPagarData;
              return (
                <TabsContent key={tipo} value={tipo} className="h-[200px]">
                  {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">Sem dados</div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
