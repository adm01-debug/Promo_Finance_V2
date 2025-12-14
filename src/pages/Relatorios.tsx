import { useState } from 'react';
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
} from 'lucide-react';
import { RelatoriosAgendados } from '@/components/relatorios/RelatoriosAgendados';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import { mockCNPJs, mockContasBancarias } from '@/data/mockData';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

const COLORS = ['hsl(24, 95%, 46%)', 'hsl(215, 90%, 42%)', 'hsl(150, 70%, 32%)', 'hsl(275, 75%, 48%)', 'hsl(42, 95%, 48%)', 'hsl(0, 78%, 55%)'];

// Mock data para relatórios
const comparativoPeriodos = [
  { mes: 'Jul', atual: 85000, anterior: 72000 },
  { mes: 'Ago', atual: 92000, anterior: 78000 },
  { mes: 'Set', atual: 78000, anterior: 85000 },
  { mes: 'Out', atual: 105000, anterior: 92000 },
  { mes: 'Nov', atual: 118000, anterior: 98000 },
  { mes: 'Dez', atual: 145000, anterior: 115000 },
];

const fluxoMensal = [
  { mes: 'Jul', receitas: 85000, despesas: 62000, saldo: 23000 },
  { mes: 'Ago', receitas: 92000, despesas: 71000, saldo: 21000 },
  { mes: 'Set', receitas: 78000, despesas: 58000, saldo: 20000 },
  { mes: 'Out', receitas: 105000, despesas: 75000, saldo: 30000 },
  { mes: 'Nov', receitas: 118000, despesas: 82000, saldo: 36000 },
  { mes: 'Dez', receitas: 145000, despesas: 95000, saldo: 50000 },
];

const despesasPorCategoria = [
  { nome: 'Fornecedores', valor: 125000, percentual: 35 },
  { nome: 'Folha de Pagamento', valor: 89000, percentual: 25 },
  { nome: 'Marketing', valor: 53500, percentual: 15 },
  { nome: 'Infraestrutura', valor: 35700, percentual: 10 },
  { nome: 'Impostos', valor: 28560, percentual: 8 },
  { nome: 'Outros', valor: 25000, percentual: 7 },
];

const receitasPorCliente = [
  { cliente: 'ABC Ltda', valor: 45000, percentual: 18 },
  { cliente: 'XYZ Corp', valor: 38000, percentual: 15 },
  { cliente: 'Tech Solutions', valor: 32000, percentual: 13 },
  { cliente: 'Global Services', valor: 28000, percentual: 11 },
  { cliente: 'Mega Store', valor: 25000, percentual: 10 },
  { cliente: 'Outros', valor: 82000, percentual: 33 },
];

const inadimplenciaPorMes = [
  { mes: 'Jul', taxa: 5.2, valor: 12500 },
  { mes: 'Ago', taxa: 4.8, valor: 11200 },
  { mes: 'Set', taxa: 6.1, valor: 14800 },
  { mes: 'Out', taxa: 4.5, valor: 10500 },
  { mes: 'Nov', taxa: 3.9, valor: 9200 },
  { mes: 'Dez', taxa: 4.2, valor: 10800 },
];

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
  const [periodoInicio, setPeriodoInicio] = useState('2024-07-01');
  const [periodoFim, setPeriodoFim] = useState('2024-12-31');
  const [empresaSelecionada, setEmpresaSelecionada] = useState('all');
  const [contaSelecionada, setContaSelecionada] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: `Relatório exportado`,
        description: `O arquivo ${format.toUpperCase()} foi gerado com sucesso.`,
      });
    }, 1500);
  };

  const handlePrint = () => {
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

  const totalReceitas = fluxoMensal.reduce((acc, m) => acc + m.receitas, 0);
  const totalDespesas = fluxoMensal.reduce((acc, m) => acc + m.despesas, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;
  const crescimento = ((comparativoPeriodos[5].atual - comparativoPeriodos[5].anterior) / comparativoPeriodos[5].anterior) * 100;

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
                  {mockCNPJs.map(cnpj => (
                    <SelectItem key={cnpj.id} value={cnpj.id}>{cnpj.nomeFantasia}</SelectItem>
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
                  {mockContasBancarias.map(conta => (
                    <SelectItem key={conta.id} value={conta.id}>{conta.banco}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
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
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas do Período</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas do Período</p>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(totalDespesas)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo do Período</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(saldoPeriodo)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crescimento</p>
                  <p className="text-2xl font-bold text-purple-600">+{crescimento.toFixed(1)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500/50" />
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
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={fluxoMensal}>
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip 
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="hsl(150, 70%, 42%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 78%, 55%)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(215, 90%, 52%)" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Despesas por Categoria */}
            <Card className="h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição de gastos</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
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
                          {despesasPorCategoria.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 flex flex-col justify-center space-y-2">
                    {despesasPorCategoria.map((cat, i) => (
                      <div key={cat.nome} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="truncate">{cat.nome}</span>
                        </div>
                        <span className="font-medium">{cat.percentual}%</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                  {comparativoPeriodos.map((item) => {
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
