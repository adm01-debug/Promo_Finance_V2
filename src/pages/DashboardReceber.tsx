import { useMemo } from "react";
import { motion } from "framer-motion";
import { Filter, Calendar, Users, Building2, Clock, Eye, PieChart as PieChartIcon } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContasReceber, useEmpresas, useClientes } from "@/hooks/useFinancialData";
import { useVendedores } from "@/hooks/useInadimplenciaSegmentada";
import { format, subDays, addDays, startOfMonth, endOfMonth, differenceInDays, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ReceberKpisCards, ReceberInadimplenciaBar } from "@/components/dashboard-receber/ReceberKpis";
import { ReceberChartsSection } from "@/components/dashboard-receber/ReceberCharts";
import { useManagedFilters } from "@/hooks/useManagedFilters";
import { ClearFiltersButton } from "@/components/filters/ClearFiltersButton";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface ReceberFilters extends Record<string, unknown> {
  empresaId: string;
  vendedorId: string;
  ramoAtividade: string;
  statusFilter: string;
  clienteId: string;
  periodo: string;
  dataInicioIso: string;
  dataFimIso: string;
}

const RECEBER_DEFAULTS: ReceberFilters = {
  empresaId: "todas",
  vendedorId: "todos",
  ramoAtividade: "todos",
  statusFilter: "todos",
  clienteId: "todos",
  periodo: "30",
  dataInicioIso: subDays(new Date(), 30).toISOString(),
  dataFimIso: new Date().toISOString(),
};

export default function DashboardReceber() {
  const filtersController = useManagedFilters<ReceberFilters>({
    entityType: "dashboard-receber",
    defaults: RECEBER_DEFAULTS,
    localStorageKey: "app-dashboard-receber-filters",
  });
  const { empresaId, vendedorId, ramoAtividade, statusFilter, clienteId, periodo, dataInicioIso, dataFimIso } = filtersController.values;
  const dataInicio = dataInicioIso ? new Date(dataInicioIso) : undefined;
  const dataFim = dataFimIso ? new Date(dataFimIso) : undefined;
  const setEmpresaId = (v: string) => filtersController.setField('empresaId', v);
  const setVendedorId = (v: string) => filtersController.setField('vendedorId', v);
  const setRamoAtividade = (v: string) => filtersController.setField('ramoAtividade', v);
  const setStatusFilter = (v: string) => filtersController.setField('statusFilter', v);
  const setClienteId = (v: string) => filtersController.setField('clienteId', v);

  const { data: contasReceber = [] } = useContasReceber();
  const { data: empresas = [] } = useEmpresas();
  const { data: clientes = [] } = useClientes();
  const { data: vendedores = [] } = useVendedores();

  const ramosAtividade = useMemo(() => {
    return ([...new Set(clientes.map(c => c.ramo_atividade).filter(Boolean))] as string[]).sort();
  }, [clientes]);

  const filteredContas = useMemo(() => {
    let filtered = [...contasReceber];
    if (empresaId !== "todas") filtered = filtered.filter(c => c.empresa_id === empresaId);
    if (vendedorId !== "todos") filtered = filtered.filter(c => c.vendedor_id === vendedorId);
    if (clienteId !== "todos") filtered = filtered.filter(c => c.cliente_id === clienteId);
    if (statusFilter !== "todos") filtered = filtered.filter(c => c.status === statusFilter);
    if (ramoAtividade !== "todos") {
      const clientesDoRamo = clientes.filter(c => c.ramo_atividade === ramoAtividade).map(c => c.id);
      filtered = filtered.filter(c => clientesDoRamo.includes(c.cliente_id || ''));
    }
    if (dataInicio && dataFim) {
      filtered = filtered.filter(c => { const d = parseISO(c.data_vencimento); return isWithinInterval(d, { start: dataInicio, end: dataFim }); });
    }
    return filtered;
  }, [contasReceber, empresaId, vendedorId, clienteId, statusFilter, ramoAtividade, dataInicio, dataFim, clientes]);

  const kpis = useMemo(() => {
    const hoje = new Date(); const hojeStr = format(hoje, "yyyy-MM-dd");
    const em7dias = format(addDays(hoje, 7), "yyyy-MM-dd"); const em30dias = format(addDays(hoje, 30), "yyyy-MM-dd");
    const inicioMes = format(startOfMonth(hoje), "yyyy-MM-dd"); const fimMes = format(endOfMonth(hoje), "yyyy-MM-dd");
    const pendentes = filteredContas.filter(c => ["pendente", "vencido", "parcial"].includes(c.status));
    const totalReceber = pendentes.reduce((acc, c) => acc + (c.valor - (c.valor_recebido || 0)), 0);
    const vencido = pendentes.filter(c => c.data_vencimento < hojeStr).reduce((acc, c) => acc + (c.valor - (c.valor_recebido || 0)), 0);
    const venceHoje = pendentes.filter(c => c.data_vencimento === hojeStr).reduce((acc, c) => acc + (c.valor - (c.valor_recebido || 0)), 0);
    const venceSemana = pendentes.filter(c => c.data_vencimento > hojeStr && c.data_vencimento <= em7dias).reduce((acc, c) => acc + (c.valor - (c.valor_recebido || 0)), 0);
    const venceMes = pendentes.filter(c => c.data_vencimento > hojeStr && c.data_vencimento <= em30dias).reduce((acc, c) => acc + (c.valor - (c.valor_recebido || 0)), 0);
    const recebidoMes = filteredContas.filter(c => c.status === "pago" && c.data_recebimento >= inicioMes && c.data_recebimento <= fimMes).reduce((acc, c) => acc + (c.valor_recebido || 0), 0);
    return { totalReceber, vencido, venceHoje, venceSemana, venceMes, recebidoMes, taxaInadimplencia: totalReceber > 0 ? (vencido / totalReceber) * 100 : 0, contasVencidas: pendentes.filter(c => c.data_vencimento < hojeStr).length, contasPendentes: pendentes.length };
  }, [filteredContas]);

  const agingData = useMemo(() => {
    const hoje = new Date(); const hojeStr = format(hoje, "yyyy-MM-dd");
    const pendentes = filteredContas.filter(c => ["pendente", "vencido", "parcial"].includes(c.status));
    const calc = (pred: (dias: number) => boolean) => pendentes.filter(c => { const d = differenceInDays(hoje, parseISO(c.data_vencimento)); return pred(d); }).reduce((acc, c) => acc + (c.valor - (c.valor_recebido || 0)), 0);
    return [
      { name: "A Vencer", value: calc(d => d < 0), fill: "hsl(var(--chart-2))" },
      { name: "1-7 dias", value: calc(d => d > 0 && d <= 7), fill: "hsl(var(--warning))" },
      { name: "8-15 dias", value: calc(d => d > 7 && d <= 15), fill: "hsl(var(--chart-4))" },
      { name: "16-30 dias", value: calc(d => d > 15 && d <= 30), fill: "hsl(var(--destructive)/0.7)" },
      { name: "+30 dias", value: calc(d => d > 30), fill: "hsl(var(--destructive))" },
    ];
  }, [filteredContas]);

  const topClientes = useMemo(() => {
    const porCliente = new Map<string, { nome: string; valor: number; vencido: number }>();
    const hoje = format(new Date(), "yyyy-MM-dd");
    filteredContas.filter(c => ["pendente", "vencido", "parcial"].includes(c.status)).forEach(c => {
      const valor = c.valor - (c.valor_recebido || 0); const isVencido = c.data_vencimento < hoje;
      if (!porCliente.has(c.cliente_nome)) porCliente.set(c.cliente_nome, { nome: c.cliente_nome, valor: 0, vencido: 0 });
      const cl = porCliente.get(c.cliente_nome)!; cl.valor += valor; if (isVencido) cl.vencido += valor;
    });
    return Array.from(porCliente.values()).sort((a, b) => b.valor - a.valor).slice(0, 10);
  }, [filteredContas]);

  const evolucaoMensal = useMemo(() => {
    const meses: Record<string, { recebido: number; aReceber: number; vencido: number }> = {};
    for (let i = 5; i >= 0; i--) { const d = subDays(new Date(), i * 30); meses[format(d, "MMM/yy", { locale: ptBR })] = { recebido: 0, aReceber: 0, vencido: 0 }; }
    contasReceber.forEach(c => {
      const mesAno = format(parseISO(c.data_vencimento), "MMM/yy", { locale: ptBR });
      if (meses[mesAno]) { const v = c.valor - (c.valor_recebido || 0); if (c.status === "pago") meses[mesAno].recebido += c.valor_recebido || 0; else if (c.status === "vencido") meses[mesAno].vencido += v; else meses[mesAno].aReceber += v; }
    });
    return Object.entries(meses).map(([mes, dados]) => ({ mes, ...dados }));
  }, [contasReceber]);

  const contasVencidasDetalhes = useMemo(() => {
    const hoje = format(new Date(), "yyyy-MM-dd");
    return filteredContas.filter(c => c.data_vencimento < hoje && ["pendente", "vencido", "parcial"].includes(c.status)).sort((a, b) => (b.valor - (b.valor_recebido || 0)) - (a.valor - (a.valor_recebido || 0))).slice(0, 15);
  }, [filteredContas]);

  const handlePeriodoChange = (value: string) => {
    const hoje = new Date();
    let ini = subDays(hoje, 30);
    if (value === "7") ini = subDays(hoje, 7);
    else if (value === "30") ini = subDays(hoje, 30);
    else if (value === "90") ini = subDays(hoje, 90);
    else if (value === "365") ini = subDays(hoje, 365);
    filtersController.setValues({
      ...filtersController.values,
      periodo: value,
      dataInicioIso: ini.toISOString(),
      dataFimIso: hoje.toISOString(),
    });
  };

  const activeFiltersCount = [empresaId !== "todas", vendedorId !== "todos", ramoAtividade !== "todos", statusFilter !== "todos", clienteId !== "todos"].filter(Boolean).length;

  return (
    <MainLayout>
      <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Recebíveis</h1>
            <p className="text-muted-foreground">Análise completa dos valores a receber com filtros avançados</p>
          </div>
          <Button variant="outline" asChild><Link to="/contas-receber"><Eye className="h-4 w-4 mr-2" />Ver Lançamentos</Link></Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Filter className="h-5 w-5" />Filtros{activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount} ativos</Badge>}</CardTitle>
              <ClearFiltersButton
                controller={filtersController}
                entityLabel="dashboard de recebíveis"
                describeFilters={(v) => [
                  { label: 'Empresa', value: v.empresaId, isActive: v.empresaId !== 'todas' },
                  { label: 'Vendedor', value: v.vendedorId, isActive: v.vendedorId !== 'todos' },
                  { label: 'Ramo', value: v.ramoAtividade, isActive: v.ramoAtividade !== 'todos' },
                  { label: 'Status', value: v.statusFilter, isActive: v.statusFilter !== 'todos' },
                  { label: 'Cliente', value: v.clienteId, isActive: v.clienteId !== 'todos' },
                  { label: 'Período', value: v.periodo, isActive: v.periodo !== '30' },
                ]}
                label="Limpar filtros"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={periodo} onValueChange={handlePeriodoChange}><SelectTrigger><Calendar className="h-4 w-4 mr-2" /><SelectValue placeholder="Período" /></SelectTrigger><SelectContent><SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="30">Últimos 30 dias</SelectItem><SelectItem value="90">Últimos 90 dias</SelectItem><SelectItem value="365">Último ano</SelectItem></SelectContent></Select>
              <Select value={empresaId} onValueChange={setEmpresaId}><SelectTrigger><Building2 className="h-4 w-4 mr-2" /><SelectValue placeholder="Empresa" /></SelectTrigger><SelectContent><SelectItem value="todas">Todas empresas</SelectItem>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}</SelectContent></Select>
              <Select value={vendedorId} onValueChange={setVendedorId}><SelectTrigger><Users className="h-4 w-4 mr-2" /><SelectValue placeholder="Vendedor" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos vendedores</SelectItem>{vendedores.map(v => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}</SelectContent></Select>
              <Select value={ramoAtividade} onValueChange={setRamoAtividade}><SelectTrigger><PieChartIcon className="h-4 w-4 mr-2" /><SelectValue placeholder="Ramo" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos ramos</SelectItem>{ramosAtividade.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><Clock className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos status</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="vencido">Vencido</SelectItem><SelectItem value="parcial">Parcial</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent></Select>
              <Select value={clienteId} onValueChange={setClienteId}><SelectTrigger><Users className="h-4 w-4 mr-2" /><SelectValue placeholder="Cliente" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos clientes</SelectItem>{clientes.slice(0, 50).map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</SelectItem>)}</SelectContent></Select>
            </div>
          </CardContent>
        </Card>

        <ReceberKpisCards kpis={kpis} />
        <ReceberInadimplenciaBar kpis={kpis} />
        <ReceberChartsSection agingData={agingData} topClientes={topClientes} evolucaoMensal={evolucaoMensal} contasVencidasDetalhes={contasVencidasDetalhes} />
      </motion.div>
    </MainLayout>
  );
}
