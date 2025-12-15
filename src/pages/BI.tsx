import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Filter,
  CalendarIcon
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
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
} from "recharts";
import { useEmpresas, useContasPagar, useContasReceber, useContasBancarias, useClientes, useCentrosCusto } from "@/hooks/useFinancialData";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatters";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function BI() {
  const [periodo, setPeriodo] = useState("6");
  const [empresaId, setEmpresaId] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [usarPeriodoCustom, setUsarPeriodoCustom] = useState(false);
  
  const { data: empresas = [] } = useEmpresas();
  const { data: contasPagar = [] } = useContasPagar();
  const { data: contasReceber = [] } = useContasReceber();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: clientes = [] } = useClientes();
  const { data: centrosCusto = [] } = useCentrosCusto();

  // Filter data by company
  const filteredPagar = useMemo(() => 
    empresaId === "todas" ? contasPagar : contasPagar.filter(c => c.empresa_id === empresaId),
    [contasPagar, empresaId]
  );

  const filteredReceber = useMemo(() => 
    empresaId === "todas" ? contasReceber : contasReceber.filter(c => c.empresa_id === empresaId),
    [contasReceber, empresaId]
  );

  const filteredContas = useMemo(() => 
    empresaId === "todas" ? contasBancarias : contasBancarias.filter(c => c.empresa_id === empresaId),
    [contasBancarias, empresaId]
  );

  // Calculate KPIs
  const kpis = useMemo(() => {
    const saldoTotal = filteredContas.reduce((acc, c) => acc + (c.saldo_atual || 0), 0);
    const totalReceber = filteredReceber.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((acc, c) => acc + c.valor, 0);
    const totalPagar = filteredPagar.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((acc, c) => acc + c.valor, 0);
    
    const vencidasReceber = filteredReceber.filter(c => c.status === 'vencido');
    const totalVencidasReceber = vencidasReceber.reduce((acc, c) => acc + c.valor, 0);
    const inadimplencia = totalReceber > 0 ? (totalVencidasReceber / totalReceber) * 100 : 0;

    const receitaMes = filteredReceber
      .filter(c => c.status === 'pago' && c.data_recebimento && new Date(c.data_recebimento).getMonth() === new Date().getMonth())
      .reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);

    const despesaMes = filteredPagar
      .filter(c => c.status === 'pago' && c.data_pagamento && new Date(c.data_pagamento).getMonth() === new Date().getMonth())
      .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);

    const lucroMes = receitaMes - despesaMes;
    const margemLucro = receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0;

    // Compare with previous month
    const lastMonth = subMonths(new Date(), 1);
    const receitaMesAnterior = filteredReceber
      .filter(c => c.status === 'pago' && c.data_recebimento && new Date(c.data_recebimento).getMonth() === lastMonth.getMonth())
      .reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);

    const variacaoReceita = receitaMesAnterior > 0 ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;

    return {
      saldoTotal,
      totalReceber,
      totalPagar,
      totalVencidasReceber,
      inadimplencia,
      receitaMes,
      despesaMes,
      lucroMes,
      margemLucro,
      variacaoReceita,
      liquidez: totalPagar > 0 ? saldoTotal / totalPagar : 0,
      clientesAtivos: clientes.filter(c => c.ativo).length,
      contasAtivas: filteredContas.filter(c => c.ativo).length
    };
  }, [filteredContas, filteredReceber, filteredPagar, clientes]);

  // Date range for filtering
  const dateRange = useMemo(() => {
    if (usarPeriodoCustom && dataInicio && dataFim) {
      return { inicio: dataInicio, fim: dataFim };
    }
    const meses = parseInt(periodo);
    return { 
      inicio: startOfMonth(subMonths(new Date(), meses - 1)), 
      fim: endOfMonth(new Date()) 
    };
  }, [usarPeriodoCustom, dataInicio, dataFim, periodo]);

  // Monthly evolution data
  const evolucaoMensal = useMemo(() => {
    const data = [];
    
    if (usarPeriodoCustom && dataInicio && dataFim) {
      // Custom period: group by month within range
      let current = startOfMonth(dataInicio);
      const endDate = endOfMonth(dataFim);
      
      while (current <= endDate) {
        const inicio = startOfMonth(current);
        const fim = endOfMonth(current);
        
        const receitas = filteredReceber
          .filter(c => c.status === 'pago' && c.data_recebimento && 
            new Date(c.data_recebimento) >= inicio && new Date(c.data_recebimento) <= fim)
          .reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
        
        const despesas = filteredPagar
          .filter(c => c.status === 'pago' && c.data_pagamento &&
            new Date(c.data_pagamento) >= inicio && new Date(c.data_pagamento) <= fim)
          .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
        
        data.push({
          mes: format(current, "MMM/yy", { locale: ptBR }),
          receitas,
          despesas,
          lucro: receitas - despesas,
          margem: receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0
        });
        
        current = subMonths(current, -1);
      }
    } else {
      const meses = parseInt(periodo);
      for (let i = meses - 1; i >= 0; i--) {
        const mesRef = subMonths(new Date(), i);
        const inicio = startOfMonth(mesRef);
        const fim = endOfMonth(mesRef);
        
        const receitas = filteredReceber
          .filter(c => c.status === 'pago' && c.data_recebimento && 
            new Date(c.data_recebimento) >= inicio && new Date(c.data_recebimento) <= fim)
          .reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
        
        const despesas = filteredPagar
          .filter(c => c.status === 'pago' && c.data_pagamento &&
            new Date(c.data_pagamento) >= inicio && new Date(c.data_pagamento) <= fim)
          .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
        
        data.push({
          mes: format(mesRef, "MMM/yy", { locale: ptBR }),
          receitas,
          despesas,
          lucro: receitas - despesas,
          margem: receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0
        });
      }
    }
    
    return data;
  }, [filteredReceber, filteredPagar, periodo, usarPeriodoCustom, dataInicio, dataFim]);

  // Status distribution
  const statusReceber = useMemo(() => {
    const statusCount = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    filteredReceber.forEach(c => {
      if (statusCount[c.status as keyof typeof statusCount] !== undefined) {
        statusCount[c.status as keyof typeof statusCount]++;
      }
    });
    return [
      { name: 'Pago', value: statusCount.pago, color: 'hsl(var(--success))' },
      { name: 'Pendente', value: statusCount.pendente, color: 'hsl(var(--warning))' },
      { name: 'Vencido', value: statusCount.vencido, color: 'hsl(var(--destructive))' },
      { name: 'Parcial', value: statusCount.parcial, color: 'hsl(var(--chart-4))' }
    ].filter(s => s.value > 0);
  }, [filteredReceber]);

  // Aging analysis (vencimento)
  const agingReceber = useMemo(() => {
    const hoje = new Date();
    const aging = { aVencer: 0, ate30: 0, ate60: 0, ate90: 0, mais90: 0 };
    
    filteredReceber.filter(c => c.status !== 'pago' && c.status !== 'cancelado').forEach(c => {
      const vencimento = new Date(c.data_vencimento);
      const dias = differenceInDays(hoje, vencimento);
      
      if (dias < 0) aging.aVencer += c.valor;
      else if (dias <= 30) aging.ate30 += c.valor;
      else if (dias <= 60) aging.ate60 += c.valor;
      else if (dias <= 90) aging.ate90 += c.valor;
      else aging.mais90 += c.valor;
    });
    
    return [
      { faixa: 'A Vencer', valor: aging.aVencer, fill: 'hsl(var(--success))' },
      { faixa: '1-30 dias', valor: aging.ate30, fill: 'hsl(var(--warning))' },
      { faixa: '31-60 dias', valor: aging.ate60, fill: 'hsl(var(--chart-4))' },
      { faixa: '61-90 dias', valor: aging.ate90, fill: 'hsl(var(--destructive))' },
      { faixa: '+90 dias', valor: aging.mais90, fill: 'hsl(142, 76%, 36%)' }
    ];
  }, [filteredReceber]);

  // Top clients by revenue
  const topClientes = useMemo(() => {
    const clienteMap = new Map<string, number>();
    filteredReceber.filter(c => c.status === 'pago').forEach(c => {
      const nome = c.cliente_nome || 'Sem cliente';
      clienteMap.set(nome, (clienteMap.get(nome) || 0) + (c.valor_recebido || c.valor));
    });
    
    return Array.from(clienteMap.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [filteredReceber]);

  // Cost center distribution
  const distribuicaoCentros = useMemo(() => {
    const centroMap = new Map<string, number>();
    filteredPagar.filter(c => c.status === 'pago').forEach(c => {
      const centro = centrosCusto.find(cc => cc.id === c.centro_custo_id);
      const nome = centro?.nome || 'Sem centro';
      centroMap.set(nome, (centroMap.get(nome) || 0) + (c.valor_pago || c.valor));
    });
    
    return Array.from(centroMap.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [filteredPagar, centrosCusto]);

  // Company comparison
  const comparativoEmpresas = useMemo(() => {
    return empresas.filter(e => e.ativo).map(empresa => {
      const receber = contasReceber.filter(c => c.empresa_id === empresa.id && c.status === 'pago')
        .reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
      const pagar = contasPagar.filter(c => c.empresa_id === empresa.id && c.status === 'pago')
        .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
      const saldo = contasBancarias.filter(c => c.empresa_id === empresa.id)
        .reduce((acc, c) => acc + c.saldo_atual, 0);
      
      return {
        nome: empresa.nome_fantasia || empresa.razao_social,
        receitas: receber,
        despesas: pagar,
        lucro: receber - pagar,
        saldo
      };
    }).sort((a, b) => b.lucro - a.lucro);
  }, [empresas, contasReceber, contasPagar, contasBancarias]);

  return (
    <MainLayout>
      <motion.div 
        className="space-y-6 p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Business Intelligence
            </h1>
            <p className="text-muted-foreground">Visão executiva consolidada para gestão estratégica</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Empresas</SelectItem>
                {empresas.filter(e => e.ativo).map(empresa => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia || empresa.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={usarPeriodoCustom ? "custom" : periodo} onValueChange={(val) => {
              if (val === "custom") {
                setUsarPeriodoCustom(true);
              } else {
                setUsarPeriodoCustom(false);
                setPeriodo(val);
                setDataInicio(undefined);
                setDataFim(undefined);
              }
            }}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {usarPeriodoCustom && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[130px] justify-start text-left font-normal",
                        !dataInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[130px] justify-start text-left font-normal",
                        !dataFim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy") : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dataFim}
                      onSelect={setDataFim}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(kpis.saldoTotal)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <Badge variant={kpis.liquidez >= 1 ? "default" : "destructive"} className="text-xs">
                  Liquidez: {kpis.liquidez.toFixed(2)}x
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita do Mês</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(kpis.receitaMes)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {kpis.variacaoReceita >= 0 ? (
                  <span className="flex items-center text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    {kpis.variacaoReceita.toFixed(1)}% vs mês anterior
                  </span>
                ) : (
                  <span className="flex items-center text-destructive">
                    <ArrowDownRight className="w-4 h-4" />
                    {Math.abs(kpis.variacaoReceita).toFixed(1)}% vs mês anterior
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lucro do Mês</p>
                  <p className={`text-2xl font-bold ${kpis.lucroMes >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(kpis.lucroMes)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Margem de Lucro</span>
                  <span>{kpis.margemLucro.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(Math.abs(kpis.margemLucro), 100)} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inadimplência</p>
                  <p className={`text-2xl font-bold ${kpis.inadimplencia > 10 ? 'text-destructive' : 'text-amber-600'}`}>
                    {kpis.inadimplencia.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {formatCurrency(kpis.totalVencidasReceber)} em atraso
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Secondary KPIs */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'A Receber', value: formatCurrency(kpis.totalReceber), icon: TrendingUp, color: 'text-green-600' },
            { label: 'A Pagar', value: formatCurrency(kpis.totalPagar), icon: TrendingDown, color: 'text-destructive' },
            { label: 'Despesas Mês', value: formatCurrency(kpis.despesaMes), icon: BarChart3, color: 'text-orange-600' },
            { label: 'Clientes Ativos', value: kpis.clientesAtivos.toString(), icon: Users, color: 'text-blue-600' },
            { label: 'Contas Bancárias', value: kpis.contasAtivas.toString(), icon: Building2, color: 'text-purple-600' }
          ].map((item, idx) => (
            <Card key={idx} className="bg-card/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-semibold">{item.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Charts Section */}
        <Tabs defaultValue="evolucao" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="evolucao" className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" />
              Evolução
            </TabsTrigger>
            <TabsTrigger value="aging" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Aging
            </TabsTrigger>
            <TabsTrigger value="centros" className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Custos
            </TabsTrigger>
            <TabsTrigger value="empresas" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Empresas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evolucao">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Evolução Financeira</CardTitle>
                  <CardDescription>Receitas, despesas e lucro mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={evolucaoMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="receitas" name="Receitas" fill="hsl(var(--success) / 0.2)" stroke="hsl(var(--success))" />
                      <Area type="monotone" dataKey="despesas" name="Despesas" fill="hsl(var(--destructive) / 0.2)" stroke="hsl(var(--destructive))" />
                      <Line type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Recebimentos</CardTitle>
                  <CardDescription>Distribuição por situação</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusReceber}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusReceber.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {statusReceber.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="aging">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aging de Recebíveis</CardTitle>
                  <CardDescription>Análise por faixa de vencimento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agingReceber} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="faixa" width={80} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                        {agingReceber.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 5 Clientes</CardTitle>
                  <CardDescription>Maior faturamento recebido</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topClientes.map((cliente, idx) => {
                      const maxValor = topClientes[0]?.valor || 1;
                      const percent = (cliente.valor / maxValor) * 100;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[180px]">{cliente.nome}</span>
                            <span className="font-medium">{formatCurrency(cliente.valor)}</span>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>
                      );
                    })}
                    {topClientes.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="centros">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Despesas por Centro de Custo</CardTitle>
                  <CardDescription>Distribuição dos gastos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distribuicaoCentros}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="valor"
                        label={({ nome, percent }) => `${nome.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {distribuicaoCentros.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalhamento</CardTitle>
                  <CardDescription>Valores por centro de custo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {distribuicaoCentros.map((centro, idx) => {
                      const total = distribuicaoCentros.reduce((acc, c) => acc + c.valor, 0);
                      const percent = total > 0 ? (centro.valor / total) * 100 : 0;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-sm">
                              <span className="truncate">{centro.nome}</span>
                              <span className="font-medium ml-2">{formatCurrency(centro.valor)}</span>
                            </div>
                            <Progress value={percent} className="h-1.5 mt-1" />
                          </div>
                        </div>
                      );
                    })}
                    {distribuicaoCentros.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="empresas">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparativo entre Empresas</CardTitle>
                <CardDescription>Performance financeira consolidada</CardDescription>
              </CardHeader>
              <CardContent>
                {comparativoEmpresas.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparativoEmpresas}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="nome" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="lucro" name="Lucro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Empresa</th>
                            <th className="text-right py-2 font-medium">Receitas</th>
                            <th className="text-right py-2 font-medium">Despesas</th>
                            <th className="text-right py-2 font-medium">Lucro</th>
                            <th className="text-right py-2 font-medium">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparativoEmpresas.map((emp, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-2">{emp.nome}</td>
                              <td className="text-right py-2 text-green-600">{formatCurrency(emp.receitas)}</td>
                              <td className="text-right py-2 text-destructive">{formatCurrency(emp.despesas)}</td>
                              <td className={`text-right py-2 font-medium ${emp.lucro >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                {formatCurrency(emp.lucro)}
                              </td>
                              <td className="text-right py-2">{formatCurrency(emp.saldo)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Nenhuma empresa cadastrada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  );
}
