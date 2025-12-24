import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Building2,
  Filter,
  ChevronDown,
  Eye,
  ArrowUpRight,
  CalendarDays,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Legend,
} from "recharts";
import { useContasReceber, useEmpresas, useClientes } from "@/hooks/useFinancialData";
import { useVendedores } from "@/hooks/useInadimplenciaSegmentada";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { format, subDays, addDays, startOfMonth, endOfMonth, differenceInDays, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

const AGING_COLORS = {
  aVencer: "hsl(var(--chart-2))",
  ate7: "hsl(var(--warning))",
  ate15: "hsl(var(--chart-4))",
  ate30: "hsl(var(--destructive)/0.7)",
  mais30: "hsl(var(--destructive))",
};

export default function DashboardReceber() {
  const [empresaId, setEmpresaId] = useState<string>("todas");
  const [vendedorId, setVendedorId] = useState<string>("todos");
  const [ramoAtividade, setRamoAtividade] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [clienteId, setClienteId] = useState<string>("todos");
  const [periodo, setPeriodo] = useState<string>("30");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date());

  const { data: contasReceber = [] } = useContasReceber();
  const { data: empresas = [] } = useEmpresas();
  const { data: clientes = [] } = useClientes();
  const { data: vendedores = [] } = useVendedores();

  // Get unique ramos from clients
  const ramosAtividade = useMemo(() => {
    const ramos = [...new Set(clientes.map((c: any) => c.ramo_atividade).filter(Boolean))];
    return ramos.sort();
  }, [clientes]);

  // Filter data based on all filters
  const filteredContas = useMemo(() => {
    let filtered = [...contasReceber];

    if (empresaId !== "todas") {
      filtered = filtered.filter((c: any) => c.empresa_id === empresaId);
    }

    if (vendedorId !== "todos") {
      filtered = filtered.filter((c: any) => c.vendedor_id === vendedorId);
    }

    if (clienteId !== "todos") {
      filtered = filtered.filter((c: any) => c.cliente_id === clienteId);
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter((c: any) => c.status === statusFilter);
    }

    if (ramoAtividade !== "todos") {
      const clientesDoRamo = clientes
        .filter((c: any) => c.ramo_atividade === ramoAtividade)
        .map((c: any) => c.id);
      filtered = filtered.filter((c: any) => clientesDoRamo.includes(c.cliente_id));
    }

    // Filter by date range
    if (dataInicio && dataFim) {
      filtered = filtered.filter((c: any) => {
        const dataVenc = parseISO(c.data_vencimento);
        return isWithinInterval(dataVenc, { start: dataInicio, end: dataFim });
      });
    }

    return filtered;
  }, [contasReceber, empresaId, vendedorId, clienteId, statusFilter, ramoAtividade, dataInicio, dataFim, clientes]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const hoje = new Date();
    const hojeStr = format(hoje, "yyyy-MM-dd");
    const em7dias = format(addDays(hoje, 7), "yyyy-MM-dd");
    const em30dias = format(addDays(hoje, 30), "yyyy-MM-dd");
    const inicioMes = format(startOfMonth(hoje), "yyyy-MM-dd");
    const fimMes = format(endOfMonth(hoje), "yyyy-MM-dd");

    const pendentes = filteredContas.filter((c: any) => 
      ["pendente", "vencido", "parcial"].includes(c.status)
    );

    const totalReceber = pendentes.reduce((acc: number, c: any) => 
      acc + (c.valor - (c.valor_recebido || 0)), 0
    );

    const vencido = pendentes
      .filter((c: any) => c.data_vencimento < hojeStr)
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    const venceHoje = pendentes
      .filter((c: any) => c.data_vencimento === hojeStr)
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    const venceSemana = pendentes
      .filter((c: any) => c.data_vencimento > hojeStr && c.data_vencimento <= em7dias)
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    const venceMes = pendentes
      .filter((c: any) => c.data_vencimento > hojeStr && c.data_vencimento <= em30dias)
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    const recebidoMes = filteredContas
      .filter((c: any) => 
        c.status === "pago" && 
        c.data_recebimento >= inicioMes && 
        c.data_recebimento <= fimMes
      )
      .reduce((acc: number, c: any) => acc + (c.valor_recebido || 0), 0);

    const taxaInadimplencia = totalReceber > 0 ? (vencido / totalReceber) * 100 : 0;

    const contasVencidas = pendentes.filter((c: any) => c.data_vencimento < hojeStr).length;
    const contasPendentes = pendentes.length;

    return {
      totalReceber,
      vencido,
      venceHoje,
      venceSemana,
      venceMes,
      recebidoMes,
      taxaInadimplencia,
      contasVencidas,
      contasPendentes,
    };
  }, [filteredContas]);

  // Aging data
  const agingData = useMemo(() => {
    const hoje = new Date();
    const hojeStr = format(hoje, "yyyy-MM-dd");
    
    const pendentes = filteredContas.filter((c: any) => 
      ["pendente", "vencido", "parcial"].includes(c.status)
    );

    const aVencer = pendentes
      .filter((c: any) => c.data_vencimento >= hojeStr)
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    const ate7 = pendentes
      .filter((c: any) => {
        const dias = differenceInDays(hoje, parseISO(c.data_vencimento));
        return dias > 0 && dias <= 7;
      })
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    const ate15 = pendentes
      .filter((c: any) => {
        const dias = differenceInDays(hoje, parseISO(c.data_vencimento));
        return dias > 7 && dias <= 15;
      })
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    const ate30 = pendentes
      .filter((c: any) => {
        const dias = differenceInDays(hoje, parseISO(c.data_vencimento));
        return dias > 15 && dias <= 30;
      })
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    const mais30 = pendentes
      .filter((c: any) => {
        const dias = differenceInDays(hoje, parseISO(c.data_vencimento));
        return dias > 30;
      })
      .reduce((acc: number, c: any) => acc + (c.valor - (c.valor_recebido || 0)), 0);

    return [
      { name: "A Vencer", value: aVencer, fill: AGING_COLORS.aVencer },
      { name: "1-7 dias", value: ate7, fill: AGING_COLORS.ate7 },
      { name: "8-15 dias", value: ate15, fill: AGING_COLORS.ate15 },
      { name: "16-30 dias", value: ate30, fill: AGING_COLORS.ate30 },
      { name: "+30 dias", value: mais30, fill: AGING_COLORS.mais30 },
    ];
  }, [filteredContas]);

  // Top clients
  const topClientes = useMemo(() => {
    const porCliente = new Map<string, { nome: string; valor: number; vencido: number }>();
    const hoje = format(new Date(), "yyyy-MM-dd");

    filteredContas
      .filter((c: any) => ["pendente", "vencido", "parcial"].includes(c.status))
      .forEach((c: any) => {
        const valor = c.valor - (c.valor_recebido || 0);
        const isVencido = c.data_vencimento < hoje;

        if (!porCliente.has(c.cliente_nome)) {
          porCliente.set(c.cliente_nome, { nome: c.cliente_nome, valor: 0, vencido: 0 });
        }

        const cliente = porCliente.get(c.cliente_nome)!;
        cliente.valor += valor;
        if (isVencido) cliente.vencido += valor;
      });

    return Array.from(porCliente.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [filteredContas]);

  // Monthly evolution
  const evolucaoMensal = useMemo(() => {
    const meses: { [key: string]: { recebido: number; aReceber: number; vencido: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const data = subDays(new Date(), i * 30);
      const mesAno = format(data, "MMM/yy", { locale: ptBR });
      meses[mesAno] = { recebido: 0, aReceber: 0, vencido: 0 };
    }

    contasReceber.forEach((c: any) => {
      const dataVenc = parseISO(c.data_vencimento);
      const mesAno = format(dataVenc, "MMM/yy", { locale: ptBR });

      if (meses[mesAno]) {
        const valor = c.valor - (c.valor_recebido || 0);
        if (c.status === "pago") {
          meses[mesAno].recebido += c.valor_recebido || 0;
        } else if (c.status === "vencido") {
          meses[mesAno].vencido += valor;
        } else {
          meses[mesAno].aReceber += valor;
        }
      }
    });

    return Object.entries(meses).map(([mes, dados]) => ({
      mes,
      ...dados,
    }));
  }, [contasReceber]);

  // Top overdue accounts for drill-down
  const contasVencidasDetalhes = useMemo(() => {
    const hoje = format(new Date(), "yyyy-MM-dd");
    return filteredContas
      .filter((c: any) => c.data_vencimento < hoje && ["pendente", "vencido", "parcial"].includes(c.status))
      .sort((a: any, b: any) => (b.valor - (b.valor_recebido || 0)) - (a.valor - (a.valor_recebido || 0)))
      .slice(0, 15);
  }, [filteredContas]);

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value);
    const hoje = new Date();
    if (value === "7") {
      setDataInicio(subDays(hoje, 7));
    } else if (value === "30") {
      setDataInicio(subDays(hoje, 30));
    } else if (value === "90") {
      setDataInicio(subDays(hoje, 90));
    } else if (value === "365") {
      setDataInicio(subDays(hoje, 365));
    }
    setDataFim(hoje);
  };

  const clearFilters = () => {
    setEmpresaId("todas");
    setVendedorId("todos");
    setRamoAtividade("todos");
    setStatusFilter("todos");
    setClienteId("todos");
    setPeriodo("30");
    setDataInicio(subDays(new Date(), 30));
    setDataFim(new Date());
  };

  const activeFiltersCount = [
    empresaId !== "todas",
    vendedorId !== "todos",
    ramoAtividade !== "todos",
    statusFilter !== "todos",
    clienteId !== "todos",
  ].filter(Boolean).length;

  return (
    <MainLayout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Recebíveis</h1>
            <p className="text-muted-foreground">
              Análise completa dos valores a receber com filtros avançados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/contas-receber">
                <Eye className="h-4 w-4 mr-2" />
                Ver Lançamentos
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount} ativos</Badge>
                )}
              </CardTitle>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={periodo} onValueChange={handlePeriodoChange}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>

              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger>
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas empresas</SelectItem>
                  {empresas.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={vendedorId} onValueChange={setVendedorId}>
                <SelectTrigger>
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos vendedores</SelectItem>
                  {vendedores.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={ramoAtividade} onValueChange={setRamoAtividade}>
                <SelectTrigger>
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Ramo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos ramos</SelectItem>
                  {ramosAtividade.map((r: any) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos clientes</SelectItem>
                  {clientes.slice(0, 50).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_fantasia || c.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total a Receber</p>
                    <p className="text-xl font-bold">{formatCurrency(kpis.totalReceber)}</p>
                    <p className="text-xs text-muted-foreground">{kpis.contasPendentes} contas</p>
                  </div>
                  <div className="p-2 rounded-full bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-destructive">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Vencido</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(kpis.vencido)}</p>
                    <p className="text-xs text-muted-foreground">{kpis.contasVencidas} contas</p>
                  </div>
                  <div className="p-2 rounded-full bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-warning">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Vence Hoje</p>
                    <p className="text-xl font-bold">{formatCurrency(kpis.venceHoje)}</p>
                  </div>
                  <div className="p-2 rounded-full bg-warning/10">
                    <CalendarDays className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-chart-2">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Próx. 7 dias</p>
                    <p className="text-xl font-bold">{formatCurrency(kpis.venceSemana)}</p>
                  </div>
                  <div className="p-2 rounded-full bg-chart-2/10">
                    <Clock className="h-5 w-5 text-chart-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-chart-3">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Próx. 30 dias</p>
                    <p className="text-xl font-bold">{formatCurrency(kpis.venceMes)}</p>
                  </div>
                  <div className="p-2 rounded-full bg-chart-3/10">
                    <Calendar className="h-5 w-5 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-success">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Recebido (Mês)</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(kpis.recebidoMes)}</p>
                  </div>
                  <div className="p-2 rounded-full bg-success/10">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Taxa de Inadimplência */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Taxa de Inadimplência</span>
                <span className={cn(
                  "text-lg font-bold",
                  kpis.taxaInadimplencia > 20 ? "text-destructive" : 
                  kpis.taxaInadimplencia > 10 ? "text-warning" : "text-success"
                )}>
                  {kpis.taxaInadimplencia.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(kpis.taxaInadimplencia, 100)} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(kpis.vencido)} vencido de {formatCurrency(kpis.totalReceber)} total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <Tabs defaultValue="aging" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="aging" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Aging
            </TabsTrigger>
            <TabsTrigger value="clientes" className="gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="evolucao" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Evolução
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="gap-2">
              <Eye className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aging">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Aging de Recebíveis</CardTitle>
                  <CardDescription>Distribuição por tempo de atraso</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agingData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {agingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Faixa</CardTitle>
                  <CardDescription>Percentual por tempo de atraso</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={agingData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {agingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clientes">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Clientes - Valores a Receber</CardTitle>
                <CardDescription>Maiores devedores ordenados por valor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topClientes.map((cliente, index) => (
                    <motion.div
                      key={cliente.nome}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{cliente.nome}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Total: {formatCurrency(cliente.valor)}</span>
                          {cliente.vencido > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {formatCurrency(cliente.vencido)} vencido
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(cliente.valor)}</p>
                        {cliente.vencido > 0 && (
                          <p className="text-xs text-destructive">
                            {((cliente.vencido / cliente.valor) * 100).toFixed(0)}% vencido
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {topClientes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum cliente com valores pendentes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evolucao">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
                <CardDescription>Recebido vs A Receber vs Vencido</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={evolucaoMensal}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="recebido"
                      name="Recebido"
                      stackId="1"
                      stroke="hsl(var(--success))"
                      fill="hsl(var(--success)/0.3)"
                    />
                    <Area
                      type="monotone"
                      dataKey="aReceber"
                      name="A Receber"
                      stackId="1"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2)/0.3)"
                    />
                    <Area
                      type="monotone"
                      dataKey="vencido"
                      name="Vencido"
                      stackId="1"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive)/0.3)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detalhes">
            <Card>
              <CardHeader>
                <CardTitle>Contas Vencidas - Drill Down</CardTitle>
                <CardDescription>Top 15 maiores valores vencidos para ação imediata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Dias Atraso</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contasVencidasDetalhes.map((conta: any) => {
                        const diasAtraso = differenceInDays(new Date(), parseISO(conta.data_vencimento));
                        const valorPendente = conta.valor - (conta.valor_recebido || 0);
                        
                        return (
                          <TableRow key={conta.id}>
                            <TableCell className="font-medium">{conta.cliente_nome}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{conta.descricao}</TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(valorPendente)}
                            </TableCell>
                            <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                            <TableCell>
                              <Badge variant={diasAtraso > 30 ? "destructive" : "secondary"}>
                                {diasAtraso} dias
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{conta.status}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {contasVencidasDetalhes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma conta vencida encontrada com os filtros selecionados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  );
}
