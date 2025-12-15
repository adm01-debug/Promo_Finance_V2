import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart3,
  FileText,
  CreditCard,
  Users,
  Package,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
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
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import {
  useEmpresas,
  useCentrosCusto,
  useContasBancarias,
  useContasPagar,
  useContasReceber,
  useClientes,
  useFornecedores,
} from '@/hooks/useFinancialData';
import { MainLayout } from '@/components/layout/MainLayout';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

const COLORS = ['hsl(24, 95%, 46%)', 'hsl(215, 90%, 42%)', 'hsl(150, 70%, 32%)', 'hsl(275, 75%, 48%)', 'hsl(42, 95%, 48%)'];

interface DrillDownSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function DrillDownSection({ title, icon, children, defaultOpen = false }: DrillDownSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 pt-0 border-t">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function DashboardEmpresa() {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [periodoAnalise, setPeriodoAnalise] = useState('30');

  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: contasPagar = [] } = useContasPagar();
  const { data: contasReceber = [] } = useContasReceber();
  const { data: clientes = [] } = useClientes();
  const { data: fornecedores = [] } = useFornecedores();

  // Auto-select first empresa
  const empresaId = selectedEmpresa || (empresas.length > 0 ? empresas[0].id : '');
  const empresa = empresas.find((e) => e.id === empresaId);

  // Filter data by selected empresa
  const contasBancariasEmpresa = useMemo(
    () => contasBancarias.filter((c) => c.empresa_id === empresaId),
    [contasBancarias, empresaId]
  );

  const contasPagarEmpresa = useMemo(
    () => contasPagar.filter((c) => c.empresa_id === empresaId),
    [contasPagar, empresaId]
  );

  const contasReceberEmpresa = useMemo(
    () => contasReceber.filter((c) => c.empresa_id === empresaId),
    [contasReceber, empresaId]
  );

  // Calculate KPIs
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const saldoTotal = contasBancariasEmpresa.reduce((sum, c) => sum + c.saldo_atual, 0);
  const saldoDisponivel = contasBancariasEmpresa.reduce((sum, c) => sum + c.saldo_disponivel, 0);

  const totalReceber = contasReceberEmpresa
    .filter((c) => c.status !== 'pago' && c.status !== 'cancelado')
    .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);

  const totalPagar = contasPagarEmpresa
    .filter((c) => c.status !== 'pago' && c.status !== 'cancelado')
    .reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

  const vencidasReceber = contasReceberEmpresa.filter((c) => c.status === 'vencido');
  const vencidasPagar = contasPagarEmpresa.filter((c) => c.status === 'vencido');

  const totalVencidasReceber = vencidasReceber.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  const totalVencidasPagar = vencidasPagar.reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

  const inadimplencia = totalReceber > 0 ? (totalVencidasReceber / totalReceber) * 100 : 0;
  const saldoProjetado = saldoTotal + totalReceber - totalPagar;

  // Status distribution
  const statusReceberData = useMemo(() => {
    const counts = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    contasReceberEmpresa.forEach((c) => {
      if (counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Recebidas', value: counts.pago, fill: COLORS[2] },
      { name: 'Pendentes', value: counts.pendente, fill: COLORS[4] },
      { name: 'Vencidas', value: counts.vencido, fill: 'hsl(0, 78%, 55%)' },
      { name: 'Parciais', value: counts.parcial, fill: COLORS[3] },
    ].filter((s) => s.value > 0);
  }, [contasReceberEmpresa]);

  const statusPagarData = useMemo(() => {
    const counts = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    contasPagarEmpresa.forEach((c) => {
      if (counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Pagas', value: counts.pago, fill: COLORS[2] },
      { name: 'Pendentes', value: counts.pendente, fill: COLORS[4] },
      { name: 'Vencidas', value: counts.vencido, fill: 'hsl(0, 78%, 55%)' },
      { name: 'Parciais', value: counts.parcial, fill: COLORS[3] },
    ].filter((s) => s.value > 0);
  }, [contasPagarEmpresa]);

  // Cash flow projection
  const fluxoCaixaProjetado = useMemo(() => {
    const dias = parseInt(periodoAnalise);
    const result = [];
    let saldoAcumulado = saldoTotal;

    for (let i = 0; i < dias; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];

      const receitasDia = contasReceberEmpresa
        .filter((c) => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado')
        .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);

      const despesasDia = contasPagarEmpresa
        .filter((c) => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado')
        .reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

      saldoAcumulado = saldoAcumulado + receitasDia - despesasDia;

      if (i % Math.ceil(dias / 15) === 0 || i === dias - 1) {
        result.push({
          data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          receitas: receitasDia,
          despesas: despesasDia,
          saldo: saldoAcumulado,
        });
      }
    }

    return result;
  }, [contasPagarEmpresa, contasReceberEmpresa, saldoTotal, periodoAnalise, hoje]);

  // Top clients by receivables
  const topClientesReceber = useMemo(() => {
    const map = new Map<string, { nome: string; valor: number; vencido: number }>();

    contasReceberEmpresa
      .filter((c) => c.status !== 'pago' && c.status !== 'cancelado')
      .forEach((c) => {
        const key = c.cliente_nome;
        if (!map.has(key)) {
          map.set(key, { nome: key, valor: 0, vencido: 0 });
        }
        const current = map.get(key)!;
        current.valor += c.valor - (c.valor_recebido || 0);
        if (c.status === 'vencido') {
          current.vencido += c.valor - (c.valor_recebido || 0);
        }
      });

    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [contasReceberEmpresa]);

  // Top suppliers by payables
  const topFornecedoresPagar = useMemo(() => {
    const map = new Map<string, { nome: string; valor: number; vencido: number }>();

    contasPagarEmpresa
      .filter((c) => c.status !== 'pago' && c.status !== 'cancelado')
      .forEach((c) => {
        const key = c.fornecedor_nome;
        if (!map.has(key)) {
          map.set(key, { nome: key, valor: 0, vencido: 0 });
        }
        const current = map.get(key)!;
        current.valor += c.valor - (c.valor_pago || 0);
        if (c.status === 'vencido') {
          current.vencido += c.valor - (c.valor_pago || 0);
        }
      });

    return Array.from(map.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [contasPagarEmpresa]);

  // Recent transactions
  const transacoesRecentes = useMemo(() => {
    const receberRecentes = contasReceberEmpresa
      .filter((c) => c.status === 'pago' && c.data_recebimento)
      .map((c) => ({
        tipo: 'receber' as const,
        descricao: c.descricao,
        nome: c.cliente_nome,
        valor: c.valor_recebido || c.valor,
        data: c.data_recebimento!,
      }));

    const pagarRecentes = contasPagarEmpresa
      .filter((c) => c.status === 'pago' && c.data_pagamento)
      .map((c) => ({
        tipo: 'pagar' as const,
        descricao: c.descricao,
        nome: c.fornecedor_nome,
        valor: c.valor_pago || c.valor,
        data: c.data_pagamento!,
      }));

    return [...receberRecentes, ...pagarRecentes]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 10);
  }, [contasReceberEmpresa, contasPagarEmpresa]);

  if (loadingEmpresas) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (empresas.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Nenhuma empresa cadastrada</h2>
          <p className="text-muted-foreground">Cadastre uma empresa para visualizar o dashboard</p>
          <Button asChild>
            <Link to="/empresas">Ir para Empresas</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Dashboard por Empresa</h1>
            <p className="text-muted-foreground mt-1">Análise detalhada com drill-down financeiro</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={empresaId} onValueChange={setSelectedEmpresa}>
              <SelectTrigger className="w-[280px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome_fantasia || e.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodoAnalise} onValueChange={setPeriodoAnalise}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Empresa Info */}
        {empresa && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{empresa.nome_fantasia || empresa.razao_social}</h2>
                      <p className="text-sm text-muted-foreground">CNPJ: {empresa.cnpj}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <CreditCard className="h-3 w-3" />
                      {contasBancariasEmpresa.length} conta(s)
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" />
                      {contasReceberEmpresa.length + contasPagarEmpresa.length} lançamentos
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                  <p className="text-2xl font-bold">{formatCurrency(saldoTotal)}</p>
                  <p className="text-xs text-muted-foreground">
                    Disponível: {formatCurrency(saldoDisponivel)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/50" />
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalReceber)}</p>
                  <p className="text-xs text-destructive">
                    {formatCurrency(totalVencidasReceber)} vencido
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                  <ArrowDownCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-success to-success/50" />
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPagar)}</p>
                  <p className="text-xs text-destructive">
                    {formatCurrency(totalVencidasPagar)} vencido
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                  <ArrowUpCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-destructive to-destructive/50" />
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Saldo Projetado</p>
                  <p className={cn('text-2xl font-bold', saldoProjetado < 0 ? 'text-destructive' : 'text-success')}>
                    {formatCurrency(saldoProjetado)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {saldoProjetado >= saldoTotal ? (
                      <span className="text-success flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Positivo
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" /> Negativo
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center',
                    saldoProjetado < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                  )}
                >
                  {saldoProjetado < 0 ? <AlertTriangle className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
                </div>
              </div>
            </CardContent>
            <div
              className={cn(
                'h-1 w-full',
                saldoProjetado < 0
                  ? 'bg-gradient-to-r from-destructive to-destructive/50'
                  : 'bg-gradient-to-r from-success to-success/50'
              )}
            />
          </Card>
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow Chart */}
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
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="hsl(24, 95%, 46%)"
                    strokeWidth={2}
                    fill="url(#saldoGradient)"
                    name="Saldo"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
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
                  <TabsTrigger value="receber" className="flex-1">
                    Receber
                  </TabsTrigger>
                  <TabsTrigger value="pagar" className="flex-1">
                    Pagar
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="receber" className="h-[200px]">
                  {statusReceberData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusReceberData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {statusReceberData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Sem dados
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="pagar" className="h-[200px]">
                  {statusPagarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPagarData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {statusPagarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Sem dados
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Drill-down Sections */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-display font-bold">Drill-down Detalhado</h2>

          {/* Bank Accounts */}
          <DrillDownSection
            title={`Contas Bancárias (${contasBancariasEmpresa.length})`}
            icon={<CreditCard className="h-5 w-5 text-primary" />}
            defaultOpen={true}
          >
            <div className="space-y-3">
              {contasBancariasEmpresa.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma conta bancária cadastrada</p>
              ) : (
                contasBancariasEmpresa.map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: `${conta.cor || '#3B82F6'}20`, color: conta.cor || '#3B82F6' }}
                      >
                        {conta.codigo_banco}
                      </div>
                      <div>
                        <p className="font-medium">{conta.banco}</p>
                        <p className="text-xs text-muted-foreground">
                          Ag: {conta.agencia} | Cc: {conta.conta}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(conta.saldo_atual)}</p>
                      <p className="text-xs text-muted-foreground">
                        Disponível: {formatCurrency(conta.saldo_disponivel)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DrillDownSection>

          {/* Top Clients */}
          <DrillDownSection
            title={`Top Clientes - A Receber`}
            icon={<Users className="h-5 w-5 text-success" />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">A Receber</TableHead>
                  <TableHead className="text-right">Vencido</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClientesReceber.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum valor a receber
                    </TableCell>
                  </TableRow>
                ) : (
                  topClientesReceber.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.valor)}</TableCell>
                      <TableCell className="text-right text-destructive">
                        {c.vencido > 0 ? formatCurrency(c.vencido) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Progress value={(c.valor / totalReceber) * 100} className="h-2 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DrillDownSection>

          {/* Top Suppliers */}
          <DrillDownSection
            title={`Top Fornecedores - A Pagar`}
            icon={<Package className="h-5 w-5 text-destructive" />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">A Pagar</TableHead>
                  <TableHead className="text-right">Vencido</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFornecedoresPagar.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum valor a pagar
                    </TableCell>
                  </TableRow>
                ) : (
                  topFornecedoresPagar.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{f.nome}</TableCell>
                      <TableCell className="text-right">{formatCurrency(f.valor)}</TableCell>
                      <TableCell className="text-right text-destructive">
                        {f.vencido > 0 ? formatCurrency(f.vencido) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Progress value={(f.valor / totalPagar) * 100} className="h-2 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DrillDownSection>

          {/* Recent Transactions */}
          <DrillDownSection
            title={`Movimentações Recentes`}
            icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          >
            <div className="space-y-2">
              {transacoesRecentes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma movimentação recente</p>
              ) : (
                transacoesRecentes.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          t.tipo === 'receber' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        {t.tipo === 'receber' ? (
                          <ArrowDownCircle className="h-4 w-4" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground">{t.nome}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-bold text-sm', t.tipo === 'receber' ? 'text-success' : 'text-destructive')}>
                        {t.tipo === 'receber' ? '+' : '-'}
                        {formatCurrency(t.valor)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.data)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DrillDownSection>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
