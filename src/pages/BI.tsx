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
  CalendarIcon,
  Trophy,
  Crown
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
import { PositionBadge, getRankFromScore, RankBadge, RankLegend } from "@/components/ui/rank-badge";
import { BenchmarkingSetorial } from "@/components/analytics/BenchmarkingSetorial";
import { InadimplenciaSegmentada } from "@/components/analytics/InadimplenciaSegmentada";

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

  // Company comparison with extended KPIs
  const comparativoEmpresas = useMemo(() => {
    return empresas.filter(e => e.ativo).map(empresa => {
      const empresaReceber = contasReceber.filter(c => c.empresa_id === empresa.id);
      const empresaPagar = contasPagar.filter(c => c.empresa_id === empresa.id);
      const empresaContas = contasBancarias.filter(c => c.empresa_id === empresa.id);
      
      const receitaTotal = empresaReceber.filter(c => c.status === 'pago')
        .reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
      const despesaTotal = empresaPagar.filter(c => c.status === 'pago')
        .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
      const saldo = empresaContas.reduce((acc, c) => acc + c.saldo_atual, 0);
      
      const aReceber = empresaReceber.filter(c => c.status !== 'pago' && c.status !== 'cancelado')
        .reduce((acc, c) => acc + c.valor, 0);
      const aPagar = empresaPagar.filter(c => c.status !== 'pago' && c.status !== 'cancelado')
        .reduce((acc, c) => acc + c.valor, 0);
      
      const vencidas = empresaReceber.filter(c => c.status === 'vencido')
        .reduce((acc, c) => acc + c.valor, 0);
      const inadimplencia = aReceber > 0 ? (vencidas / aReceber) * 100 : 0;
      
      const lucro = receitaTotal - despesaTotal;
      const margem = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0;
      const liquidez = aPagar > 0 ? saldo / aPagar : 0;
      
      const contasCount = empresaContas.filter(c => c.ativo).length;
      const ticketMedio = empresaReceber.filter(c => c.status === 'pago').length > 0 
        ? receitaTotal / empresaReceber.filter(c => c.status === 'pago').length 
        : 0;
      
      return {
        id: empresa.id,
        nome: empresa.nome_fantasia || empresa.razao_social,
        cnpj: empresa.cnpj,
        receitas: receitaTotal,
        despesas: despesaTotal,
        lucro,
        margem,
        saldo,
        aReceber,
        aPagar,
        inadimplencia,
        liquidez,
        contasCount,
        ticketMedio,
        saldoProjetado: saldo + aReceber - aPagar
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
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita do Mês</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(kpis.receitaMes)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {kpis.variacaoReceita >= 0 ? (
                  <span className="flex items-center text-success">
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
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lucro do Mês</p>
                  <p className={`text-2xl font-bold ${kpis.lucroMes >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(kpis.lucroMes)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-secondary" />
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
            { label: 'A Receber', value: formatCurrency(kpis.totalReceber), icon: TrendingUp, color: 'text-success' },
            { label: 'A Pagar', value: formatCurrency(kpis.totalPagar), icon: TrendingDown, color: 'text-destructive' },
            { label: 'Despesas Mês', value: formatCurrency(kpis.despesaMes), icon: BarChart3, color: 'text-streak' },
            { label: 'Clientes Ativos', value: kpis.clientesAtivos.toString(), icon: Users, color: 'text-secondary' },
            { label: 'Contas Bancárias', value: kpis.contasAtivas.toString(), icon: Building2, color: 'text-accent' }
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

          <TabsContent value="empresas" className="space-y-4">
            {/* Ranking Cards */}
            {comparativoEmpresas.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4">
                {comparativoEmpresas.slice(0, 3).map((emp, index) => (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "relative overflow-hidden transition-all duration-300",
                      index === 0 && "ring-2 ring-rank-gold/50 hover:shadow-glow-coins",
                      index === 1 && "ring-1 ring-rank-silver/30",
                      index === 2 && "ring-1 ring-rank-bronze/30"
                    )}>
                      <div className={cn(
                        "absolute top-0 left-0 right-0 h-1",
                        index === 0 && "bg-gradient-to-r from-yellow-400 to-amber-500",
                        index === 1 && "bg-gradient-to-r from-gray-300 to-gray-400",
                        index === 2 && "bg-gradient-to-r from-amber-600 to-amber-700"
                      )} />
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <PositionBadge position={index + 1} size="lg" />
                          {index === 0 && (
                            <Crown className="w-6 h-6 text-coins animate-wiggle" />
                          )}
                        </div>
                        <CardTitle className="text-lg mt-2 truncate" title={emp.nome}>
                          {emp.nome}
                        </CardTitle>
                        <CardDescription className="text-xs">{emp.cnpj}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Lucro</p>
                            <p className={cn(
                              "text-lg font-bold",
                              emp.lucro >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {formatCurrency(emp.lucro)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Margem</p>
                            <RankBadge 
                              rank={getRankFromScore(emp.margem, { gold: 25, silver: 15, bronze: 5 })}
                              label={`${emp.margem.toFixed(1)}%`}
                              showIcon={false}
                              size="sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Liquidez</p>
                            <RankBadge 
                              rank={getRankFromScore(emp.liquidez * 100, { gold: 200, silver: 150, bronze: 100 })}
                              label={`${emp.liquidez.toFixed(2)}x`}
                              showIcon={false}
                              size="sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Adimplência</p>
                            <RankBadge 
                              rank={getRankFromScore(100 - emp.inadimplencia, { gold: 95, silver: 85, bronze: 70 })}
                              label={`${(100 - emp.inadimplencia).toFixed(1)}%`}
                              showIcon={false}
                              size="sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Chart comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparativo Visual</CardTitle>
                <CardDescription>Receitas, Despesas e Lucro por empresa</CardDescription>
              </CardHeader>
              <CardContent>
                {comparativoEmpresas.length > 0 ? (
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
                ) : (
                  <p className="text-center text-muted-foreground py-12">Nenhuma empresa cadastrada</p>
                )}
              </CardContent>
            </Card>

            {/* KPIs Table comparison */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      KPIs por Empresa (Lado a Lado)
                    </CardTitle>
                    <CardDescription>Comparativo detalhado de indicadores financeiros</CardDescription>
                  </div>
                  <RankLegend />
                </div>
              </CardHeader>
              <CardContent>
                {comparativoEmpresas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-3 px-4 font-semibold border-b sticky left-0 bg-muted/50 z-10">Indicador</th>
                          {comparativoEmpresas.map((emp, index) => (
                            <th key={emp.id} className="text-center py-3 px-4 font-semibold border-b min-w-[150px]">
                              <div className="flex flex-col items-center gap-1">
                                <PositionBadge position={index + 1} size="sm" />
                                <div className="truncate max-w-[140px] mt-1" title={emp.nome}>{emp.nome}</div>
                                <div className="text-xs font-normal text-muted-foreground">{emp.cnpj}</div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Saldo Atual */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-primary" />
                              Saldo Atual
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b font-medium">
                              {formatCurrency(emp.saldo)}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Receitas */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="w-4 h-4 text-success" />
                              Receitas (Pagas)
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b text-success">
                              {formatCurrency(emp.receitas)}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Despesas */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <ArrowDownRight className="w-4 h-4 text-destructive" />
                              Despesas (Pagas)
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b text-destructive">
                              {formatCurrency(emp.despesas)}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Lucro */}
                        <tr className="hover:bg-muted/30 transition-colors bg-muted/20">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-muted/20">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary" />
                              Lucro Líquido
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className={`text-right py-3 px-4 border-b font-bold ${emp.lucro >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                              {formatCurrency(emp.lucro)}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Margem */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-chart-2" />
                              Margem de Lucro
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b">
                              <Badge variant={emp.margem >= 20 ? "default" : emp.margem >= 10 ? "secondary" : "destructive"}>
                                {emp.margem.toFixed(1)}%
                              </Badge>
                            </td>
                          ))}
                        </tr>
                        
                        {/* A Receber */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="w-4 h-4 text-success" />
                              A Receber (Pendente)
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b">
                              {formatCurrency(emp.aReceber)}
                            </td>
                          ))}
                        </tr>
                        
                        {/* A Pagar */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <ArrowDownRight className="w-4 h-4 text-warning" />
                              A Pagar (Pendente)
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b">
                              {formatCurrency(emp.aPagar)}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Saldo Projetado */}
                        <tr className="hover:bg-muted/30 transition-colors bg-muted/20">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-muted/20">
                            <div className="flex items-center gap-2">
                              <LineChartIcon className="w-4 h-4 text-chart-3" />
                              Saldo Projetado
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className={`text-right py-3 px-4 border-b font-medium ${emp.saldoProjetado >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                              {formatCurrency(emp.saldoProjetado)}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Inadimplência */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              Inadimplência
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b">
                              <Badge variant={emp.inadimplencia <= 5 ? "default" : emp.inadimplencia <= 15 ? "secondary" : "destructive"}>
                                {emp.inadimplencia.toFixed(1)}%
                              </Badge>
                            </td>
                          ))}
                        </tr>
                        
                        {/* Liquidez */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-chart-4" />
                              Índice de Liquidez
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b">
                              <Badge variant={emp.liquidez >= 1.5 ? "default" : emp.liquidez >= 1 ? "secondary" : "destructive"}>
                                {emp.liquidez.toFixed(2)}x
                              </Badge>
                            </td>
                          ))}
                        </tr>
                        
                        {/* Ticket Médio */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 border-b font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-chart-5" />
                              Ticket Médio
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4 border-b">
                              {formatCurrency(emp.ticketMedio)}
                            </td>
                          ))}
                        </tr>
                        
                        {/* Contas Bancárias */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium sticky left-0 bg-background">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              Contas Bancárias
                            </div>
                          </td>
                          {comparativoEmpresas.map((emp) => (
                            <td key={emp.id} className="text-right py-3 px-4">
                              <Badge variant="outline">{emp.contasCount}</Badge>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Nenhuma empresa cadastrada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Inadimplência Segmentada */}
        <motion.div variants={itemVariants} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Inadimplência Segmentada
              </CardTitle>
              <CardDescription>
                Análise de inadimplência por ramo de atividade e vendedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InadimplenciaSegmentada />
            </CardContent>
          </Card>
        </motion.div>

        {/* Benchmarking Setorial */}
        <motion.div variants={itemVariants} className="mt-6">
          <BenchmarkingSetorial />
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
