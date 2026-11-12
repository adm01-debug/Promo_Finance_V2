import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Landmark, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { GlossarioTooltip } from './GlossarioTooltip';
import { itemVariants, COLORS } from './DashboardReformaTributaria.helpers';

interface DashboardReformaVisaoGeralProps {
  dadosComparativoMensal: { mes: string; cbsIbs: number; antigosResidual: number }[];
  dadosDistribuicaoTributos: { name: string; value: number }[];
  handleKPIClick: (tabId: string) => void;
  aliquotasAtuais: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/types/reforma-tributaria').AliquotasTransicao;
}

export function DashboardReformaVisaoGeral({
  dadosComparativoMensal,
  dadosDistribuicaoTributos,
  handleKPIClick,
  aliquotasAtuais,
}: DashboardReformaVisaoGeralProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6">
      {/* Gráficos */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Evolução Tributária</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              <GlossarioTooltip termo="CBS">CBS</GlossarioTooltip>/
              <GlossarioTooltip termo="IBS">IBS</GlossarioTooltip> vs residuais
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosComparativoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="cbsIbs"
                    name="CBS + IBS"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="antigosResidual"
                    name="Residuais"
                    stackId="1"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted))"
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Distribuição dos Tributos</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Composição atual</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosDistribuicaoTributos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius="70%"
                    dataKey="value"
                  >
                    {dadosDistribuicaoTributos.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Alíquotas com Glossário */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card
          className="border-primary/20 bg-primary/5 hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => handleKPIClick('apuracao')}
        >
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2">
              <Receipt className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <GlossarioTooltip termo="CBS" showIcon={false}>
                CBS
              </GlossarioTooltip>
              <span className="hidden md:inline truncate">- Contribuição Federal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary">
              {aliquotasAtuais.cbs}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
              Substitui PIS e COFINS
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-success/20 bg-success/5 hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => handleKPIClick('apuracao')}
        >
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2">
              <Landmark className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <GlossarioTooltip termo="IBS" showIcon={false}>
                IBS
              </GlossarioTooltip>
              <span className="hidden md:inline truncate">- Est/Municipal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-success">
              {aliquotasAtuais.ibs}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
              Substitui ICMS e ISS
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-warning/20 bg-warning/5 hover:scale-[1.02] transition-transform cursor-pointer"
          onClick={() => handleKPIClick('simulador')}
        >
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <GlossarioTooltip termo="IS" showIcon={false}>
                IS
              </GlossarioTooltip>
              <span className="hidden md:inline truncate">- Seletivo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-warning">Var.</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
              Produtos nocivos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Destaques com Glossário */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: 'Não-Cumulatividade Plena',
            desc: 'Crédito amplo em todas as aquisições',
            termo: 'Não-Cumulatividade',
            tab: 'creditos',
          },
          { label: 'Destino', desc: 'Tributo no local de consumo', tab: 'calculadora' },
          {
            label: 'Split Payment',
            desc: 'Recolhimento automático na transação',
            termo: 'Split Payment',
            tab: 'split-payment',
          },
          {
            label: 'Cashback',
            desc: 'Devolução para famílias de baixa renda',
            termo: 'Cashback',
            tab: 'cashback',
          },
        ].map((item, i) => (
          <Card
            key={i}
            className="hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleKPIClick(item.tab)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  {item.termo ? (
                    <GlossarioTooltip termo={item.termo} showIcon={false}>
                      <p className="font-medium text-sm">{item.label}</p>
                    </GlossarioTooltip>
                  ) : (
                    <p className="font-medium text-sm">{item.label}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
