// ============================================
// DASHBOARD REFORMA TRIBUTÁRIA
// Visão executiva para empresas Lucro Real
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Receipt, 
  Landmark, 
  ArrowRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Percent,
  DollarSign,
  RefreshCw,
  FileText,
  Building2,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import useReformaTributaria from '@/hooks/useReformaTributaria';
import { formatCurrency } from '@/lib/formatters';
import { SimuladorCenariosTributarios } from './SimuladorCenariosTributarios';
import { CronogramaTransicao } from './CronogramaTransicao';
import { CalculadoraTributos } from './CalculadoraTributos';
import { GestorCreditosTributarios } from './GestorCreditosTributarios';
import { ApuracaoMensal } from './ApuracaoMensal';
import { OperacoesLista } from './OperacoesLista';
import { ModuloIRPJCSLL } from './ModuloIRPJCSLL';
import { ObrigacoesAcessorias } from './ObrigacoesAcessorias';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function DashboardReformaTributaria() {
  const {
    anoReferencia,
    setAnoReferencia,
    faseAtual,
    aliquotasAtuais,
    metricas,
    isLoadingMetricas,
    cronogramaTransicao,
  } = useReformaTributaria();

  const [activeTab, setActiveTab] = useState('visao-geral');

  // Dados para gráficos
  const dadosComparativoMensal = [
    { mes: 'Jan', cbsIbs: 45000, antigosResidual: 35000 },
    { mes: 'Fev', cbsIbs: 48000, antigosResidual: 32000 },
    { mes: 'Mar', cbsIbs: 52000, antigosResidual: 28000 },
    { mes: 'Abr', cbsIbs: 49000, antigosResidual: 30000 },
    { mes: 'Mai', cbsIbs: 55000, antigosResidual: 25000 },
    { mes: 'Jun', cbsIbs: 58000, antigosResidual: 22000 },
  ];

  const dadosDistribuicaoTributos = [
    { name: 'CBS', value: metricas?.cbsSaldoAPagar || 0, label: 'CBS (Federal)' },
    { name: 'IBS', value: metricas?.ibsSaldoAPagar || 0, label: 'IBS (Est/Mun)' },
    { name: 'Residuais', value: metricas?.tributosAntigosResidual || 0, label: 'Tributos Antigos' },
  ];

  const dadosCreditos = [
    { name: 'CBS', disponivel: metricas?.creditosDisponiveis ? metricas.creditosDisponiveis * 0.4 : 0, utilizado: metricas?.creditosUtilizados ? metricas.creditosUtilizados * 0.4 : 0 },
    { name: 'IBS', disponivel: metricas?.creditosDisponiveis ? metricas.creditosDisponiveis * 0.6 : 0, utilizado: metricas?.creditosUtilizados ? metricas.creditosUtilizados * 0.6 : 0 },
  ];

  if (isLoadingMetricas) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reforma Tributária</h1>
          <p className="text-muted-foreground">
            Gestão contábil para empresas no Lucro Real - LC 214/2025
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            Fase: {faseAtual.replace('_', ' ').toUpperCase()}
          </Badge>
          
          <Select value={String(anoReferencia)} onValueChange={(v) => setAnoReferencia(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((ano) => (
                <SelectItem key={ano} value={String(ano)}>
                  {ano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Carga Tributária</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricas?.cargaTributariaEfetiva.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Alíquota efetiva sobre faturamento
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                CBS: {aliquotasAtuais.cbs}%
              </Badge>
              <Badge variant="secondary" className="text-xs">
                IBS: {aliquotasAtuais.ibs}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CBS a Recolher</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metricas?.cbsSaldoAPagar || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Débito: {formatCurrency(metricas?.cbsDebitosTotal || 0)}
            </p>
            <p className="text-xs text-green-600">
              Crédito: {formatCurrency(metricas?.cbsCreditosTotal || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IBS a Recolher</CardTitle>
            <Landmark className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(metricas?.ibsSaldoAPagar || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Débito: {formatCurrency(metricas?.ibsDebitosTotal || 0)}
            </p>
            <p className="text-xs text-green-600">
              Crédito: {formatCurrency(metricas?.ibsCreditosTotal || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Créditos Disponíveis</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metricas?.creditosDisponiveis || 0)}
            </div>
            <div className="mt-2">
              <Progress 
                value={metricas?.creditosAcumulados 
                  ? (metricas.creditosUtilizados / metricas.creditosAcumulados) * 100 
                  : 0} 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((metricas?.creditosUtilizados || 0) / (metricas?.creditosAcumulados || 1) * 100).toFixed(1)}% utilizados
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Indicador de Migração */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Progresso da Transição</CardTitle>
                <CardDescription>
                  Migração do sistema tributário antigo para IBS/CBS
                </CardDescription>
              </div>
              <Badge variant={metricas?.percentualMigracao === 100 ? "default" : "secondary"}>
                {metricas?.percentualMigracao.toFixed(0)}% migrado
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={metricas?.percentualMigracao || 0} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>ICMS/ISS/PIS/COFINS</span>
              <span>IBS + CBS</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap justify-start gap-1">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="apuracao">Apuração IBS/CBS</TabsTrigger>
          <TabsTrigger value="irpj-csll">IRPJ/CSLL</TabsTrigger>
          <TabsTrigger value="operacoes">Operações</TabsTrigger>
          <TabsTrigger value="creditos">Créditos</TabsTrigger>
          <TabsTrigger value="calculadora">Calculadora</TabsTrigger>
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
          <TabsTrigger value="obrigacoes">Obrigações</TabsTrigger>
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico Evolução Mensal */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução Tributária Mensal</CardTitle>
                <CardDescription>
                  Comparativo IBS/CBS vs tributos residuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dadosComparativoMensal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
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
                      name="Tributos Residuais"
                      stackId="1"
                      stroke="hsl(var(--muted-foreground))" 
                      fill="hsl(var(--muted))" 
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de Tributos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição dos Tributos</CardTitle>
                <CardDescription>
                  Composição da carga tributária atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosDistribuicaoTributos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {dadosDistribuicaoTributos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Alíquotas */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  CBS - Contribuição Federal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{aliquotasAtuais.cbs}%</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Substitui PIS ({aliquotasAtuais.pisResidual > 0 ? `${aliquotasAtuais.pisResidual}% residual` : 'extinto'}) e 
                  COFINS ({aliquotasAtuais.cofinsResidual > 0 ? `${aliquotasAtuais.cofinsResidual}% residual` : 'extinto'})
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  IBS - Imposto Est/Municipal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{aliquotasAtuais.ibs}%</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Substitui ICMS ({aliquotasAtuais.icmsResidual > 0 ? `${aliquotasAtuais.icmsResidual}% residual` : 'extinto'}) e 
                  ISS ({aliquotasAtuais.issResidual > 0 ? `${aliquotasAtuais.issResidual}% residual` : 'extinto'})
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  IS - Imposto Seletivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">Variável</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Incide sobre produtos nocivos: bebidas, cigarros, combustíveis fósseis, etc.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Destaques da Reforma */}
          <Card>
            <CardHeader>
              <CardTitle>Principais Mudanças - Lucro Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Não-Cumulatividade Plena</p>
                    <p className="text-sm text-muted-foreground">
                      Crédito integral de todas as aquisições tributadas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Split Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Recolhimento automático no pagamento
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Princípio do Destino</p>
                    <p className="text-sm text-muted-foreground">
                      Tributação no local de consumo
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Simplificação</p>
                    <p className="text-sm text-muted-foreground">
                      De 5 tributos para 2 (IBS + CBS)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Apuração */}
        <TabsContent value="apuracao">
          <ApuracaoMensal />
        </TabsContent>

        {/* Aba Operações */}
        <TabsContent value="operacoes">
          <OperacoesLista />
        </TabsContent>

        {/* Aba Calculadora */}
        <TabsContent value="calculadora">
          <CalculadoraTributos />
        </TabsContent>

        {/* Aba Créditos */}
        <TabsContent value="creditos">
          <GestorCreditosTributarios />
        </TabsContent>

        {/* Aba Simulador */}
        <TabsContent value="simulador">
          <SimuladorCenariosTributarios />
        </TabsContent>

        {/* Aba Obrigações */}
        <TabsContent value="obrigacoes">
          <ObrigacoesAcessorias />
        </TabsContent>

        {/* Aba Cronograma */}
        <TabsContent value="cronograma">
          <CronogramaTransicao />
        </TabsContent>

        {/* Aba IRPJ/CSLL */}
        <TabsContent value="irpj-csll">
          <ModuloIRPJCSLL />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default DashboardReformaTributaria;
