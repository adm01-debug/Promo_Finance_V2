import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText,
  Download,
  FileSpreadsheet,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Printer,
  Mail,
  ChevronDown,
  Building2,
  CreditCard,
  DollarSign,
  Users,
  ArrowUpDown,
  Eye,
  Clock,
  Loader2,
} from 'lucide-react';
import { RelatoriosAgendados } from '@/components/relatorios/RelatoriosAgendados';
import { RelatorioDrillDown } from '@/components/relatorios/RelatorioDrillDown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend,
  ComposedChart
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useEmpresas, useContasBancarias } from '@/hooks/useFinancialData';
import {
  useComparativoPeriodos,
  useFluxoMensal,
  useDespesasPorCategoria,
  useReceitasPorCliente,
  useInadimplenciaPorMes,
  useRelatorioKPIs,
} from '@/hooks/useRelatoriosData';
import { generateFluxoCaixaPDF, generateFluxoCaixaCSV } from '@/lib/pdf-generator';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const relatoriosDisponiveis = [
  { id: '1', nome: 'DRE - Demonstrativo de Resultados', categoria: 'Contábil', icon: FileText },
  { id: '2', nome: 'Fluxo de Caixa Realizado', categoria: 'Financeiro', icon: TrendingUp },
  { id: '3', nome: 'Contas a Receber por Vencimento', categoria: 'Financeiro', icon: Calendar },
  { id: '4', nome: 'Contas a Pagar por Fornecedor', categoria: 'Financeiro', icon: Users },
  { id: '5', nome: 'Análise de Inadimplência', categoria: 'Cobrança', icon: TrendingDown },
  { id: '6', nome: 'Centro de Custos Detalhado', categoria: 'Gerencial', icon: PieChartIcon },
  { id: '7', nome: 'Comparativo de Períodos', categoria: 'Gerencial', icon: BarChart3 },
  { id: '8', nome: 'Conciliação Bancária', categoria: 'Financeiro', icon: CreditCard },
];

export default function Relatorios() {
  const [periodoInicio, setPeriodoInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [periodoFim, setPeriodoFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('all');
  const [contaSelecionada, setContaSelecionada] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Real data hooks
  const { data: empresas, isLoading: loadingEmpresas } = useEmpresas();
  const { data: contasBancarias, isLoading: loadingContas } = useContasBancarias();
  const { data: comparativoPeriodos, isLoading: loadingComparativo } = useComparativoPeriodos();
  const { data: fluxoMensal, isLoading: loadingFluxo } = useFluxoMensal();
  const { data: despesasPorCategoria, isLoading: loadingDespesas } = useDespesasPorCategoria();
  const { data: receitasPorCliente, isLoading: loadingReceitas } = useReceitasPorCliente();
  const { data: inadimplenciaPorMes, isLoading: loadingInadimplencia } = useInadimplenciaPorMes();
  const { data: kpis, isLoading: loadingKpis, refetch: refetchKpis } = useRelatorioKPIs(periodoInicio, periodoFim);

  const isLoading = loadingComparativo || loadingFluxo || loadingDespesas || loadingReceitas || loadingInadimplencia || loadingKpis;

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    try {
      const fluxoData = (fluxoMensal || []).map(f => ({
        data: f.mes,
        receitas: f.receitas,
        despesas: f.despesas,
        saldo: f.saldo,
      }));
      
      if (format === 'pdf') {
        generateFluxoCaixaPDF(fluxoData, 'Relatório Financeiro');
      } else {
        generateFluxoCaixaCSV(fluxoData);
      }
      
      toast({
        title: `Relatório exportado`,
        description: `O arquivo ${format.toUpperCase()} foi gerado com sucesso.`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Preparando impressão",
      description: "O relatório está sendo preparado para impressão.",
    });
  };

  const handleEmail = () => {
    toast({
      title: "Enviar por e-mail",
      description: "Configure os destinatários para enviar o relatório.",
    });
  };

  const handleRefresh = () => {
    refetchKpis();
    toast({
      title: "Atualizando dados",
      description: "Os relatórios estão sendo recarregados.",
    });
  };

  // Calculate KPIs
  const totalReceitas = kpis?.totalReceitas || 0;
  const totalDespesas = kpis?.totalDespesas || 0;
  const saldoPeriodo = kpis?.saldoPeriodo || 0;
  
  const crescimento = useMemo(() => {
    if (!comparativoPeriodos || comparativoPeriodos.length < 2) return 0;
    const ultimo = comparativoPeriodos[comparativoPeriodos.length - 1];
    if (ultimo.anterior === 0) return 0;
    return ((ultimo.atual - ultimo.anterior) / ultimo.anterior) * 100;
  }, [comparativoPeriodos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises financeiras e exportação de dados
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isGenerating}>
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer gap-2">
                <FileText className="h-4 w-4 text-red-500" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar
          </Button>
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input 
                type="date" 
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input 
                type="date" 
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {(empresas || []).map(empresa => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome_fantasia || empresa.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta Bancária</Label>
              <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {(contasBancarias || []).map(conta => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.banco} - {conta.conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleRefresh} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs do Período */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas do Período</p>
                  {loadingKpis ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-success">{formatCurrency(totalReceitas)}</p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-success/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas do Período</p>
                  {loadingKpis ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(totalDespesas)}</p>
                  )}
                </div>
                <TrendingDown className="h-8 w-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo do Período</p>
                  {loadingKpis ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">{formatCurrency(saldoPeriodo)}</p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crescimento</p>
                  {loadingComparativo ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-accent">
                      {crescimento >= 0 ? '+' : ''}{crescimento.toFixed(1)}%
                    </p>
                  )}
                </div>
                <BarChart3 className="h-8 w-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visao-geral" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="drill-down" className="gap-2">
            <Filter className="h-4 w-4" />
            Drill-Down
          </TabsTrigger>
          <TabsTrigger value="comparativo" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Comparativo
          </TabsTrigger>
          <TabsTrigger value="detalhado" className="gap-2">
            <FileText className="h-4 w-4" />
            Detalhado
          </TabsTrigger>
          <TabsTrigger value="modelos" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="agendados" className="gap-2">
            <Clock className="h-4 w-4" />
            Agendados
          </TabsTrigger>
        </TabsList>

        {/* Drill-Down Interativo */}
        <TabsContent value="drill-down">
          <RelatorioDrillDown />
        </TabsContent>

        {/* Visão Geral */}
        <TabsContent value="visao-geral">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fluxo Mensal */}
            <Card className="h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fluxo de Caixa Mensal</CardTitle>
                <CardDescription>Receitas, despesas e saldo por mês</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loadingFluxo ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={fluxoMensal || []}>
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip 
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Despesas por Categoria */}
            <Card className="h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição de gastos</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loadingDespesas ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (despesasPorCategoria || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <PieChartIcon className="h-12 w-12 mb-2 opacity-20" />
                    <p>Sem dados de despesas</p>
                  </div>
                ) : (
                  <div className="flex h-full">
                    <div className="w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={despesasPorCategoria} 
                            dataKey="valor" 
                            nameKey="nome" 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={50} 
                            outerRadius={80}
                          >
                            {(despesasPorCategoria || []).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 flex flex-col justify-center space-y-2">
                      {(despesasPorCategoria || []).map((cat, i) => (
                        <div key={cat.nome} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            <span className="truncate">{cat.nome}</span>
                          </div>
                          <span className="font-medium">{cat.percentual.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Receitas por Cliente */}
            <Card className="h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Receitas por Cliente</CardTitle>
                <CardDescription>Top clientes do período</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={receitasPorCliente} layout="vertical">
                    <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis dataKey="cliente" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip 
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="valor" fill="hsl(24, 95%, 46%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Inadimplência */}
            <Card className="h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Evolução da Inadimplência</CardTitle>
                <CardDescription>Taxa e valor em atraso por mês</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={inadimplenciaPorMes}>
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis yAxisId="left" tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip 
                      formatter={(v: number, name: string) => name === 'taxa' ? `${v}%` : formatCurrency(v)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar yAxisId="right" dataKey="valor" name="Valor em Atraso" fill="hsl(0, 78%, 55%)" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="taxa" name="Taxa (%)" stroke="hsl(42, 95%, 48%)" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparativo */}
        <TabsContent value="comparativo">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Períodos</CardTitle>
              <CardDescription>Análise comparativa: Período atual vs período anterior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativoPeriodos}>
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="atual" name="Período Atual" fill="hsl(24, 95%, 46%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="anterior" name="Período Anterior" fill="hsl(215, 90%, 52%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Separator className="my-6" />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Período Atual</TableHead>
                    <TableHead className="text-right">Período Anterior</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                    <TableHead className="text-right">% Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(comparativoPeriodos || []).map((item) => {
                    const variacao = item.atual - item.anterior;
                    const percentual = ((variacao) / item.anterior) * 100;
                    return (
                      <TableRow key={item.mes}>
                        <TableCell className="font-medium">{item.mes}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.atual)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.anterior)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          variacao >= 0 ? "text-green-600" : "text-red-500"
                        )}>
                          {variacao >= 0 ? '+' : ''}{formatCurrency(variacao)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          percentual >= 0 ? "text-green-600" : "text-red-500"
                        )}>
                          {percentual >= 0 ? '+' : ''}{percentual.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detalhado */}
        <TabsContent value="detalhado">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Detalhado</CardTitle>
              <CardDescription>Transações do período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { data: '2024-12-15', descricao: 'Pagamento Cliente ABC', categoria: 'Vendas', tipo: 'Receita', valor: 15000, status: 'Conciliado' },
                    { data: '2024-12-14', descricao: 'Fornecedor XYZ', categoria: 'Fornecedores', tipo: 'Despesa', valor: 8500, status: 'Conciliado' },
                    { data: '2024-12-13', descricao: 'Serviços Tech Solutions', categoria: 'Vendas', tipo: 'Receita', valor: 22000, status: 'Pendente' },
                    { data: '2024-12-12', descricao: 'Folha de Pagamento', categoria: 'Pessoal', tipo: 'Despesa', valor: 45000, status: 'Conciliado' },
                    { data: '2024-12-11', descricao: 'Marketing Digital', categoria: 'Marketing', tipo: 'Despesa', valor: 3500, status: 'Conciliado' },
                  ].map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.tipo === 'Receita' ? 'default' : 'secondary'} className={item.tipo === 'Receita' ? 'bg-green-500' : 'bg-red-500'}>
                          {item.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        item.tipo === 'Receita' ? "text-green-600" : "text-red-500"
                      )}>
                        {item.tipo === 'Receita' ? '+' : '-'}{formatCurrency(item.valor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Conciliado' ? 'default' : 'outline'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modelos de Relatórios */}
        <TabsContent value="modelos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatoriosDisponiveis.map((relatorio) => {
              const Icon = relatorio.icon;
              return (
                <motion.div key={relatorio.id} variants={itemVariants}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{relatorio.nome}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{relatorio.categoria}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Visualizar
                          </Button>
                          <Button size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Gerar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Relatórios Agendados */}
        <TabsContent value="agendados">
          <RelatoriosAgendados />
        </TabsContent>
      </Tabs>
    </div>
  );
}
