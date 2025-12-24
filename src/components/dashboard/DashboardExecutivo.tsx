import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  CreditCard,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Filter,
  ChevronDown,
  ShieldAlert,
  FileText,
  Users,
  Loader2,
  RefreshCw,
  Trophy,
  Flame,
  Zap,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
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
  ComposedChart,
  Legend,
  Line,
} from 'recharts';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresas, useCentrosCusto, useContasBancarias, useContasPagar, useContasReceber, useClientes } from '@/hooks/useFinancialData';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { PrevisaoIA } from './PrevisaoIA';
import { AlertasPreditivosPanel } from './AlertasPreditivosPanel';
import { SimuladorCenarios } from './SimuladorCenarios';
import { DashboardConfigDialog } from './DashboardConfigDialog';
import { HistoricoAnalisesPreditivas } from './HistoricoAnalisesPreditivas';
import { RecomendacoesMetasIA } from './RecomendacoesMetasIA';
import { CockpitCFO } from './CockpitCFO';
import { PositionBadge, RankBadge, getRankFromScore } from '@/components/ui/rank-badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

const COLORS = ['hsl(150, 70%, 42%)', 'hsl(42, 95%, 48%)', 'hsl(0, 78%, 55%)', 'hsl(215, 90%, 52%)', 'hsl(275, 75%, 48%)'];

export const DashboardExecutivo = () => {
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [periodoFluxo, setPeriodoFluxo] = useState('30');
  const [drillDownOpen, setDrillDownOpen] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  // Dashboard config
  const { widgets, toggleWidget, resizeWidget, resetToDefault } = useDashboardConfig();

  // Dados reais do Supabase
  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: centrosCusto = [], isLoading: loadingCC } = useCentrosCusto();
  const { data: contasBancarias = [], isLoading: loadingBancos } = useContasBancarias();
  const { data: contasPagar = [], isLoading: loadingPagar } = useContasPagar();
  const { data: contasReceber = [], isLoading: loadingReceber } = useContasReceber();
  const { data: clientes = [], isLoading: loadingClientes } = useClientes();
  const { count: aprovacoesPendentes } = useAprovacoesPendentesCount();

  const isLoading = loadingEmpresas || loadingCC || loadingBancos || loadingPagar || loadingReceber || loadingClientes;

  // Filtrar dados por empresa e centro de custo
  const contasPagarFiltradas = useMemo(() => {
    return contasPagar.filter(c => {
      const matchEmpresa = empresaFilter === 'all' || c.empresa_id === empresaFilter;
      const matchCC = centroCustoFilter === 'all' || c.centro_custo_id === centroCustoFilter;
      return matchEmpresa && matchCC;
    });
  }, [contasPagar, empresaFilter, centroCustoFilter]);

  const contasReceberFiltradas = useMemo(() => {
    return contasReceber.filter(c => {
      const matchEmpresa = empresaFilter === 'all' || c.empresa_id === empresaFilter;
      const matchCC = centroCustoFilter === 'all' || c.centro_custo_id === centroCustoFilter;
      return matchEmpresa && matchCC;
    });
  }, [contasReceber, empresaFilter, centroCustoFilter]);

  const contasBancariasFiltradas = useMemo(() => {
    return contasBancarias.filter(c => {
      return empresaFilter === 'all' || c.empresa_id === empresaFilter;
    });
  }, [contasBancarias, empresaFilter]);

  // Cálculos de KPIs
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const saldoTotal = contasBancariasFiltradas.reduce((sum, c) => sum + c.saldo_atual, 0);
  
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const receitasMes = contasReceberFiltradas
    .filter(c => {
      const dataRec = c.data_recebimento ? new Date(c.data_recebimento) : null;
      return dataRec && dataRec.getMonth() === mesAtual && dataRec.getFullYear() === anoAtual;
    })
    .reduce((sum, c) => sum + (c.valor_recebido || 0), 0);

  const despesasMes = contasPagarFiltradas
    .filter(c => {
      const dataPag = c.data_pagamento ? new Date(c.data_pagamento) : null;
      return dataPag && dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
    })
    .reduce((sum, c) => sum + (c.valor_pago || 0), 0);

  const totalReceber = contasReceberFiltradas
    .filter(c => c.status !== 'pago' && c.status !== 'cancelado')
    .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);

  const totalPagar = contasPagarFiltradas
    .filter(c => c.status !== 'pago' && c.status !== 'cancelado')
    .reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

  const vencidasReceber = contasReceberFiltradas.filter(c => c.status === 'vencido');
  const vencidasPagar = contasPagarFiltradas.filter(c => c.status === 'vencido');
  
  const totalVencidasReceber = vencidasReceber.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  const totalVencidasPagar = vencidasPagar.reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

  const inadimplencia = totalReceber > 0 ? (totalVencidasReceber / totalReceber) * 100 : 0;

  const venceHojeReceber = contasReceberFiltradas.filter(c => {
    const dataVenc = new Date(c.data_vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    return dataVenc.getTime() === hoje.getTime() && c.status === 'pendente';
  });

  const venceHojePagar = contasPagarFiltradas.filter(c => {
    const dataVenc = new Date(c.data_vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    return dataVenc.getTime() === hoje.getTime() && c.status === 'pendente';
  });

  // Status das contas para gráfico de pizza
  const statusContasPagar = useMemo(() => {
    const counts = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    contasPagarFiltradas.forEach(c => {
      if (counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Pagas', value: counts.pago, fill: COLORS[0] },
      { name: 'Pendentes', value: counts.pendente, fill: COLORS[1] },
      { name: 'Vencidas', value: counts.vencido, fill: COLORS[2] },
      { name: 'Parciais', value: counts.parcial, fill: COLORS[3] },
    ].filter(s => s.value > 0);
  }, [contasPagarFiltradas]);

  // Dados por centro de custo para drill-down
  const dadosPorCentroCusto = useMemo(() => {
    const map = new Map<string, { nome: string; pagar: number; receber: number; saldo: number }>();
    
    contasPagarFiltradas.forEach(c => {
      const ccId = c.centro_custo_id || 'sem-cc';
      const ccNome = (c.centros_custo as any)?.nome || 'Sem Centro de Custo';
      if (!map.has(ccId)) {
        map.set(ccId, { nome: ccNome, pagar: 0, receber: 0, saldo: 0 });
      }
      const current = map.get(ccId)!;
      if (c.status !== 'pago' && c.status !== 'cancelado') {
        current.pagar += c.valor - (c.valor_pago || 0);
      }
    });

    contasReceberFiltradas.forEach(c => {
      const ccId = c.centro_custo_id || 'sem-cc';
      const ccNome = (c.centros_custo as any)?.nome || 'Sem Centro de Custo';
      if (!map.has(ccId)) {
        map.set(ccId, { nome: ccNome, pagar: 0, receber: 0, saldo: 0 });
      }
      const current = map.get(ccId)!;
      if (c.status !== 'pago' && c.status !== 'cancelado') {
        current.receber += c.valor - (c.valor_recebido || 0);
      }
    });

    return Array.from(map.values()).map(cc => ({
      ...cc,
      saldo: cc.receber - cc.pagar
    })).sort((a, b) => b.saldo - a.saldo);
  }, [contasPagarFiltradas, contasReceberFiltradas]);

  // Top 10 clientes por receita gerada
  const topClientesReceita = useMemo(() => {
    const clienteReceitas = new Map<string, { 
      id: string;
      nome: string;
      nomeFantasia: string | null;
      receita: number;
      pagos: number;
      pendentes: number;
      score: number | null;
    }>();

    contasReceberFiltradas.forEach(conta => {
      const clienteId = conta.cliente_id || 'sem-cliente';
      const clienteNome = conta.cliente_nome || 'Cliente não identificado';
      
      // Encontrar dados do cliente
      const clienteData = clientes.find(c => c.id === clienteId);
      
      if (!clienteReceitas.has(clienteId)) {
        clienteReceitas.set(clienteId, {
          id: clienteId,
          nome: clienteNome,
          nomeFantasia: clienteData?.nome_fantasia || null,
          receita: 0,
          pagos: 0,
          pendentes: 0,
          score: clienteData?.score || null,
        });
      }

      const current = clienteReceitas.get(clienteId)!;
      current.receita += conta.valor;
      
      if (conta.status === 'pago') {
        current.pagos += conta.valor_recebido || conta.valor;
      } else if (conta.status !== 'cancelado') {
        current.pendentes += conta.valor - (conta.valor_recebido || 0);
      }
    });

    return Array.from(clienteReceitas.values())
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10)
      .map((cliente, index) => ({
        ...cliente,
        posicao: index + 1,
        adimplencia: cliente.receita > 0 ? ((cliente.pagos / cliente.receita) * 100) : 0,
      }));
  }, [contasReceberFiltradas, clientes]);

  // Cálculo do streak de dias consecutivos sem inadimplência
  const streakData = useMemo(() => {
    // Ordenar contas receber por data de vencimento (mais recente primeiro)
    const contasOrdenadas = [...contasReceberFiltradas]
      .filter(c => c.status !== 'cancelado')
      .sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime());

    let streakDias = 0;
    let ultimaInadimplencia: Date | null = null;
    const hojeDate = new Date();
    hojeDate.setHours(0, 0, 0, 0);

    // Encontrar a última inadimplência
    for (const conta of contasOrdenadas) {
      const dataVenc = new Date(conta.data_vencimento);
      dataVenc.setHours(0, 0, 0, 0);
      
      if (conta.status === 'vencido' && dataVenc < hojeDate) {
        ultimaInadimplencia = dataVenc;
        break;
      }
    }

    if (ultimaInadimplencia) {
      // Calcular dias desde a última inadimplência
      const diffTime = hojeDate.getTime() - ultimaInadimplencia.getTime();
      streakDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
      // Se nunca houve inadimplência, calcular desde a primeira conta
      const primeiraContaPaga = contasOrdenadas
        .filter(c => c.status === 'pago')
        .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0];
      
      if (primeiraContaPaga) {
        const primeiraData = new Date(primeiraContaPaga.data_vencimento);
        const diffTime = hojeDate.getTime() - primeiraData.getTime();
        streakDias = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      }
    }

    // Determinar nível do streak
    let nivel = 'bronze';
    let proximoNivel = 30;
    if (streakDias >= 90) {
      nivel = 'gold';
      proximoNivel = 180;
    } else if (streakDias >= 30) {
      nivel = 'silver';
      proximoNivel = 90;
    }

    const progresso = nivel === 'gold' 
      ? (streakDias / proximoNivel) * 100 
      : nivel === 'silver' 
        ? ((streakDias - 30) / (90 - 30)) * 100 
        : (streakDias / 30) * 100;

    return {
      dias: streakDias,
      nivel,
      proximoNivel,
      progresso: Math.min(100, Math.max(0, progresso)),
      temInadimplencia: vencidasReceber.length > 0,
    };
  }, [contasReceberFiltradas, vencidasReceber]);

  // Fluxo de caixa projetado (próximos 30 dias)
  const fluxoCaixaProjetado = useMemo(() => {
    const dias = parseInt(periodoFluxo);
    const result = [];
    let saldoAcumulado = saldoTotal;

    for (let i = 0; i < dias; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];

      const receitasDia = contasReceberFiltradas
        .filter(c => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado')
        .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);

      const despesasDia = contasPagarFiltradas
        .filter(c => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado')
        .reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

      saldoAcumulado = saldoAcumulado + receitasDia - despesasDia;

      result.push({
        data: dataStr,
        receitas: receitasDia,
        despesas: despesasDia,
        saldo: saldoAcumulado
      });
    }

    return result;
  }, [contasPagarFiltradas, contasReceberFiltradas, saldoTotal, periodoFluxo, hoje]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6" data-tour="dashboard">
      {/* Header com Filtros */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-display-md text-foreground">Dashboard Executivo</h1>
          <p className="text-muted-foreground mt-1">Visão consolidada com drill-down por empresa e centro de custo</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
            <SelectTrigger className="w-[200px]">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todas Empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Empresas</SelectItem>
              {empresas.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome_fantasia || e.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={centroCustoFilter} onValueChange={setCentroCustoFilter}>
            <SelectTrigger className="w-[200px]">
              <Target className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Todos Centros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Centros de Custo</SelectItem>
              {centrosCusto.map(cc => (
                <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="h-9 px-3 gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Dados em tempo real
          </Badge>
          <Button variant="outline" size="icon" onClick={() => setConfigDialogOpen(true)}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Cockpit do CFO */}
      <motion.div variants={itemVariants}>
        <CockpitCFO />
      </motion.div>

      {/* KPI Cards Principais */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/contas-bancarias">
          <Card className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Saldo Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(saldoTotal)}</p>
                  <p className="text-xs text-muted-foreground">{contasBancariasFiltradas.length} conta(s)</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/50" />
          </Card>
        </Link>

        <Link to="/contas-receber">
          <Card className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalReceber)}</p>
                  <p className="text-xs text-muted-foreground">
                    {receitasMes > 0 && <span className="text-success">{formatCurrency(receitasMes)} este mês</span>}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                  <ArrowDownCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-success to-success/50" />
          </Card>
        </Link>

        <Link to="/contas-pagar">
          <Card className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPagar)}</p>
                  <p className="text-xs text-muted-foreground">
                    {despesasMes > 0 && <span className="text-destructive">{formatCurrency(despesasMes)} este mês</span>}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110">
                  <ArrowUpCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
            <div className="h-1 w-full bg-gradient-to-r from-destructive to-destructive/50" />
          </Card>
        </Link>

        <Link to="/cobrancas">
          <Card className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Inadimplência</p>
                  <p className={cn("text-2xl font-bold", inadimplencia > 10 ? "text-destructive" : inadimplencia > 5 ? "text-warning" : "text-success")}>
                    {inadimplencia.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(totalVencidasReceber)} vencido</p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  inadimplencia > 10 ? "bg-destructive/10 text-destructive" : inadimplencia > 5 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                )}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
            <div className={cn(
              "h-1 w-full",
              inadimplencia > 10 ? "bg-gradient-to-r from-destructive to-destructive/50" : inadimplencia > 5 ? "bg-gradient-to-r from-warning to-warning/50" : "bg-gradient-to-r from-success to-success/50"
            )} />
          </Card>
        </Link>
      </motion.div>

      {/* Streak Card + KPIs Secundários */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <Card className={cn(
          "p-4 col-span-1 overflow-hidden relative",
          streakData.temInadimplencia 
            ? "bg-gradient-to-br from-destructive/10 to-background border-destructive/30"
            : streakData.nivel === 'gold' 
              ? "bg-gradient-to-br from-coins/20 to-coins/5 border-coins/30"
              : streakData.nivel === 'silver'
                ? "bg-gradient-to-br from-muted to-background"
                : "bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30"
        )}>
          {/* Background animation */}
          {!streakData.temInadimplencia && streakData.dias > 0 && (
            <div className="absolute inset-0 opacity-10">
              <div className={cn(
                "absolute top-2 right-2 h-16 w-16 rounded-full blur-xl",
                streakData.nivel === 'gold' && "bg-coins animate-pulse",
                streakData.nivel === 'silver' && "bg-foreground/50",
                streakData.nivel === 'bronze' && "bg-orange-500"
              )} />
            </div>
          )}
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  streakData.temInadimplencia 
                    ? "bg-destructive/20"
                    : streakData.nivel === 'gold' 
                      ? "bg-coins/20"
                      : streakData.nivel === 'silver'
                        ? "bg-foreground/10"
                        : "bg-orange-500/20"
                )}>
                  <Flame className={cn(
                    "h-5 w-5",
                    streakData.temInadimplencia 
                      ? "text-destructive"
                      : streakData.nivel === 'gold' 
                        ? "text-coins animate-fire-pulse"
                        : streakData.nivel === 'silver'
                          ? "text-foreground"
                          : "text-orange-500"
                  )} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Streak de Adimplência</p>
                  <p className={cn(
                    "text-2xl font-bold font-display",
                    streakData.temInadimplencia 
                      ? "text-destructive"
                      : streakData.nivel === 'gold' 
                        ? "text-coins glow-coins"
                        : streakData.nivel === 'silver'
                          ? "text-foreground"
                          : "text-orange-500"
                  )}>
                    {streakData.dias} dias
                  </p>
                </div>
              </div>
              
              {!streakData.temInadimplencia && streakData.dias > 0 && (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                  streakData.nivel === 'gold' && "bg-coins/20 text-coins",
                  streakData.nivel === 'silver' && "bg-foreground/10 text-foreground",
                  streakData.nivel === 'bronze' && "bg-orange-500/20 text-orange-500"
                )}>
                  <Zap className="h-3 w-3" />
                  {streakData.nivel === 'gold' ? 'Ouro' : streakData.nivel === 'silver' ? 'Prata' : 'Bronze'}
                </div>
              )}
            </div>
            
            {!streakData.temInadimplencia && streakData.nivel !== 'gold' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Próximo nível</span>
                  <span>{streakData.proximoNivel} dias</span>
                </div>
                <Progress 
                  value={streakData.progresso} 
                  className={cn(
                    "h-2",
                    streakData.nivel === 'silver' && "[&>div]:bg-coins",
                    streakData.nivel === 'bronze' && "[&>div]:bg-foreground/60"
                  )}
                />
              </div>
            )}
            
            {streakData.temInadimplencia && (
              <p className="text-xs text-destructive">
                Streak interrompido! Regularize as pendências para reiniciar.
              </p>
            )}
          </div>
        </Card>

        {/* KPIs Secundários */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Empresas</p>
                <p className="text-lg font-bold">{empresas.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <CreditCard className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contas Bancárias</p>
                <p className="text-lg font-bold">{contasBancarias.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receber Hoje</p>
                <p className="text-lg font-bold">{venceHojeReceber.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pagar Hoje</p>
                <p className="text-lg font-bold">{venceHojePagar.length}</p>
              </div>
            </div>
          </Card>
          <Link to="/aprovacoes">
            <Card className={cn("p-4 cursor-pointer hover:shadow-md transition-all h-full", aprovacoesPendentes > 0 && "ring-2 ring-warning/50")}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", aprovacoesPendentes > 0 ? "bg-warning/10" : "bg-muted")}>
                  <ShieldAlert className={cn("h-4 w-4", aprovacoesPendentes > 0 ? "text-warning" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aprovações</p>
                  <p className={cn("text-lg font-bold", aprovacoesPendentes > 0 && "text-warning")}>{aprovacoesPendentes}</p>
                </div>
              </div>
            </Card>
          </Link>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencidas</p>
                <p className="text-lg font-bold text-destructive">{vencidasReceber.length + vencidasPagar.length}</p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa Projetado */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Fluxo de Caixa Projetado
                  </CardTitle>
                  <CardDescription>Receitas vs Despesas nos próximos dias</CardDescription>
                </div>
                <Tabs value={periodoFluxo} onValueChange={setPeriodoFluxo}>
                  <TabsList className="h-8">
                    <TabsTrigger value="7" className="text-xs">7d</TabsTrigger>
                    <TabsTrigger value="15" className="text-xs">15d</TabsTrigger>
                    <TabsTrigger value="30" className="text-xs">30d</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fluxoCaixaProjetado}>
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="data" tickFormatter={(v) => v.slice(8)} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip 
                    formatter={(v: number) => formatCurrency(v)} 
                    labelFormatter={(l) => `Data: ${l}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(150, 70%, 42%)" fill="url(#colorReceitas)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(0, 78%, 55%)" fill="url(#colorDespesas)" strokeWidth={2} />
                  <Line type="monotone" dataKey="saldo" name="Saldo Projetado" stroke="hsl(215, 90%, 52%)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Saldo por Banco */}
        <motion.div variants={itemVariants}>
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-secondary" />
                Saldo por Banco
              </CardTitle>
              <CardDescription>Distribuição entre contas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto max-h-[300px]">
              {contasBancariasFiltradas.map((banco, index) => {
                const percentual = saldoTotal > 0 ? (banco.saldo_atual / saldoTotal) * 100 : 0;
                return (
                  <div key={banco.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm font-medium truncate max-w-[120px]">{banco.banco}</span>
                      </div>
                      <span className="text-sm font-bold">{formatCurrency(banco.saldo_atual)}</span>
                    </div>
                    <Progress value={percentual} className="h-2" />
                  </div>
                );
              })}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Consolidado</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(saldoTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Drill-down por Centro de Custo */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Drill-Down por Centro de Custo
            </CardTitle>
            <CardDescription>Clique para expandir detalhes de cada centro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dadosPorCentroCusto.map((cc, index) => (
              <Collapsible 
                key={cc.nome} 
                open={drillDownOpen === cc.nome} 
                onOpenChange={() => setDrillDownOpen(drillDownOpen === cc.nome ? null : cc.nome)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-medium">{cc.nome}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">A Receber</p>
                        <p className="text-sm font-semibold text-success">{formatCurrency(cc.receber)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">A Pagar</p>
                        <p className="text-sm font-semibold text-destructive">{formatCurrency(cc.pagar)}</p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-xs text-muted-foreground">Saldo</p>
                        <p className={cn("text-sm font-bold", cc.saldo >= 0 ? "text-success" : "text-destructive")}>
                          {formatCurrency(cc.saldo)}
                        </p>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", drillDownOpen === cc.nome && "rotate-180")} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 ml-6 p-4 rounded-lg border bg-background space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
                        <p className="text-xs text-muted-foreground mb-1">Total a Receber</p>
                        <p className="text-lg font-bold text-success">{formatCurrency(cc.receber)}</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
                        <p className="text-lg font-bold text-destructive">{formatCurrency(cc.pagar)}</p>
                      </div>
                      <div className={cn("text-center p-3 rounded-lg border", cc.saldo >= 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20")}>
                        <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                        <p className={cn("text-lg font-bold", cc.saldo >= 0 ? "text-success" : "text-destructive")}>
                          {formatCurrency(cc.saldo)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/contas-receber?centro_custo=${encodeURIComponent(cc.nome)}`}>
                          Ver Contas a Receber
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/contas-pagar?centro_custo=${encodeURIComponent(cc.nome)}`}>
                          Ver Contas a Pagar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
            {dadosPorCentroCusto.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível para os filtros selecionados</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Leaderboard de Clientes e Status das Contas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Top 10 Clientes */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="h-[450px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-coins" />
                Top 10 Clientes
              </CardTitle>
              <CardDescription>Por receita gerada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto max-h-[360px] pr-2">
              {topClientesReceita.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
              ) : (
                topClientesReceita.map((cliente, index) => (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]",
                      index === 0 && "bg-gradient-to-r from-coins/20 to-coins/5 border border-coins/30",
                      index === 1 && "bg-gradient-to-r from-muted/80 to-muted/30 border border-border",
                      index === 2 && "bg-gradient-to-r from-orange-500/20 to-orange-500/5 border border-orange-500/30",
                      index > 2 && "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <PositionBadge position={cliente.posicao} size="sm" showIcon={index < 3} />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {cliente.nomeFantasia || cliente.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          Adimplência: 
                        </span>
                        <RankBadge
                          rank={getRankFromScore(cliente.adimplencia, { gold: 90, silver: 70, bronze: 50 })}
                          size="sm"
                          label={`${cliente.adimplencia.toFixed(0)}%`}
                          showIcon={false}
                          animate={false}
                        />
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-sm",
                        index === 0 && "text-coins glow-coins",
                        index === 1 && "text-foreground",
                        index === 2 && "text-orange-500",
                        index > 2 && "text-muted-foreground"
                      )}>
                        {formatCurrency(cliente.receita)}
                      </p>
                      {cliente.pendentes > 0 && (
                        <p className="text-xs text-warning">
                          {formatCurrency(cliente.pendentes)} pendente
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status das Contas */}
        <motion.div variants={itemVariants}>
          <Card className="h-[450px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-warning" />
                Status Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={statusContasPagar} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={50} 
                    outerRadius={80} 
                    paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusContasPagar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-[450px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top Centros de Custo
              </CardTitle>
              <CardDescription>Por volume financeiro</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorCentroCusto.slice(0, 5)} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} fontSize={11} />
                  <YAxis type="category" dataKey="nome" width={100} fontSize={11} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="receber" name="A Receber" fill="hsl(150, 70%, 42%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="pagar" name="A Pagar" fill="hsl(0, 78%, 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Previsão com IA */}
      <motion.div variants={itemVariants}>
        <PrevisaoIA />
      </motion.div>

      {/* Histórico de Análises Preditivas */}
      <motion.div variants={itemVariants}>
        <HistoricoAnalisesPreditivas />
      </motion.div>

      {/* Alertas Preditivos e Simulador de Cenários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <AlertasPreditivosPanel
            saldoAtual={saldoTotal}
            receitasPrevistas={contasReceberFiltradas
              .filter(c => c.status !== 'pago' && c.status !== 'cancelado')
              .map(c => ({
                valor: c.valor - (c.valor_recebido || 0),
                dataVencimento: new Date(c.data_vencimento),
                entidade: c.cliente_nome,
              }))}
            despesasPrevistas={contasPagarFiltradas
              .filter(c => c.status !== 'pago' && c.status !== 'cancelado')
              .map(c => ({
                valor: c.valor - (c.valor_pago || 0),
                dataVencimento: new Date(c.data_vencimento),
                entidade: c.fornecedor_nome,
              }))}
            historicoInadimplencia={vencidasReceber.map(c => ({
              clienteId: c.cliente_id || 'unknown',
              diasAtraso: Math.floor((new Date().getTime() - new Date(c.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)),
            }))}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SimuladorCenarios
            saldoAtual={saldoTotal}
            receitasPrevistas={totalReceber}
            despesasPrevistas={totalPagar}
            taxaInadimplencia={inadimplencia}
          />
        </motion.div>
      </div>

      {/* Dashboard Config Dialog */}
      <DashboardConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        widgets={widgets}
        onToggleWidget={toggleWidget}
        onResizeWidget={resizeWidget}
        onResetToDefault={resetToDefault}
      />
    </motion.div>
  );
};
