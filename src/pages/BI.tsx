import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Calendar, CalendarIcon, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmpresas, useContasPagar, useContasReceber, useContasBancarias, useClientes, useCentrosCusto } from "@/hooks/useFinancialData";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BIMainKpis, BISecondaryKpis } from "@/components/bi/BIKpis";
import { BIEvolucaoChart, BIAgingChart, BICentrosChart } from "@/components/bi/BICharts";
import { BIEmpresasTab } from "@/components/bi/BIEmpresasTab";
import { InadimplenciaSegmentada } from "@/components/analytics/InadimplenciaSegmentada";
import { BenchmarkingSetorial } from "@/components/analytics/BenchmarkingSetorial";
import { HistoricoAnalisesPreditivasPanel } from "@/components/analytics/HistoricoAnalisesPreditivasPanel";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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

  const filteredPagar = useMemo(() => empresaId === "todas" ? contasPagar : contasPagar.filter(c => c.empresa_id === empresaId), [contasPagar, empresaId]);
  const filteredReceber = useMemo(() => empresaId === "todas" ? contasReceber : contasReceber.filter(c => c.empresa_id === empresaId), [contasReceber, empresaId]);
  const filteredContas = useMemo(() => empresaId === "todas" ? contasBancarias : contasBancarias.filter(c => c.empresa_id === empresaId), [contasBancarias, empresaId]);

  const kpis = useMemo(() => {
    const saldoTotal = filteredContas.reduce((acc, c) => acc + (c.saldo_atual || 0), 0);
    const totalReceber = filteredReceber.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((acc, c) => acc + c.valor, 0);
    const totalPagar = filteredPagar.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((acc, c) => acc + c.valor, 0);
    const vencidasReceber = filteredReceber.filter(c => c.status === 'vencido');
    const totalVencidasReceber = vencidasReceber.reduce((acc, c) => acc + c.valor, 0);
    const inadimplencia = totalReceber > 0 ? (totalVencidasReceber / totalReceber) * 100 : 0;
    const receitaMes = filteredReceber.filter(c => c.status === 'pago' && c.data_recebimento && new Date(c.data_recebimento).getMonth() === new Date().getMonth()).reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
    const despesaMes = filteredPagar.filter(c => c.status === 'pago' && c.data_pagamento && new Date(c.data_pagamento).getMonth() === new Date().getMonth()).reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
    const lucroMes = receitaMes - despesaMes;
    const margemLucro = receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0;
    const lastMonth = subMonths(new Date(), 1);
    const receitaMesAnterior = filteredReceber.filter(c => c.status === 'pago' && c.data_recebimento && new Date(c.data_recebimento).getMonth() === lastMonth.getMonth()).reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
    const variacaoReceita = receitaMesAnterior > 0 ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;
    return { saldoTotal, totalReceber, totalPagar, totalVencidasReceber, inadimplencia, receitaMes, despesaMes, lucroMes, margemLucro, variacaoReceita, liquidez: totalPagar > 0 ? saldoTotal / totalPagar : 0, clientesAtivos: clientes.filter(c => c.ativo).length, contasAtivas: filteredContas.filter(c => c.ativo).length };
  }, [filteredContas, filteredReceber, filteredPagar, clientes]);

  const evolucaoMensal = useMemo(() => {
    const data = [];
    if (usarPeriodoCustom && dataInicio && dataFim) {
      let current = startOfMonth(dataInicio);
      const endDate = endOfMonth(dataFim);
      while (current <= endDate) {
        const inicio = startOfMonth(current); const fim = endOfMonth(current);
        const receitas = filteredReceber.filter(c => c.status === 'pago' && c.data_recebimento && new Date(c.data_recebimento) >= inicio && new Date(c.data_recebimento) <= fim).reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
        const despesas = filteredPagar.filter(c => c.status === 'pago' && c.data_pagamento && new Date(c.data_pagamento) >= inicio && new Date(c.data_pagamento) <= fim).reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
        data.push({ mes: format(current, "MMM/yy", { locale: ptBR }), receitas, despesas, lucro: receitas - despesas, margem: receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0 });
        current = subMonths(current, -1);
      }
    } else {
      const meses = parseInt(periodo);
      for (let i = meses - 1; i >= 0; i--) {
        const mesRef = subMonths(new Date(), i); const inicio = startOfMonth(mesRef); const fim = endOfMonth(mesRef);
        const receitas = filteredReceber.filter(c => c.status === 'pago' && c.data_recebimento && new Date(c.data_recebimento) >= inicio && new Date(c.data_recebimento) <= fim).reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
        const despesas = filteredPagar.filter(c => c.status === 'pago' && c.data_pagamento && new Date(c.data_pagamento) >= inicio && new Date(c.data_pagamento) <= fim).reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
        data.push({ mes: format(mesRef, "MMM/yy", { locale: ptBR }), receitas, despesas, lucro: receitas - despesas, margem: receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0 });
      }
    }
    return data;
  }, [filteredReceber, filteredPagar, periodo, usarPeriodoCustom, dataInicio, dataFim]);

  const statusReceber = useMemo(() => {
    const statusCount = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    filteredReceber.forEach(c => { if (statusCount[c.status as keyof typeof statusCount] !== undefined) statusCount[c.status as keyof typeof statusCount]++; });
    return [
      { name: 'Pago', value: statusCount.pago, color: 'hsl(var(--success))' },
      { name: 'Pendente', value: statusCount.pendente, color: 'hsl(var(--warning))' },
      { name: 'Vencido', value: statusCount.vencido, color: 'hsl(var(--destructive))' },
      { name: 'Parcial', value: statusCount.parcial, color: 'hsl(var(--chart-4))' }
    ].filter(s => s.value > 0);
  }, [filteredReceber]);

  const agingReceber = useMemo(() => {
    const hoje = new Date();
    const aging = { aVencer: 0, ate30: 0, ate60: 0, ate90: 0, mais90: 0 };
    filteredReceber.filter(c => c.status !== 'pago' && c.status !== 'cancelado').forEach(c => {
      const dias = differenceInDays(hoje, new Date(c.data_vencimento));
      if (dias < 0) aging.aVencer += c.valor; else if (dias <= 30) aging.ate30 += c.valor; else if (dias <= 60) aging.ate60 += c.valor; else if (dias <= 90) aging.ate90 += c.valor; else aging.mais90 += c.valor;
    });
    return [
      { faixa: 'A Vencer', valor: aging.aVencer, fill: 'hsl(var(--success))' },
      { faixa: '1-30 dias', valor: aging.ate30, fill: 'hsl(var(--warning))' },
      { faixa: '31-60 dias', valor: aging.ate60, fill: 'hsl(var(--chart-4))' },
      { faixa: '61-90 dias', valor: aging.ate90, fill: 'hsl(var(--destructive))' },
      { faixa: '+90 dias', valor: aging.mais90, fill: 'hsl(142, 76%, 36%)' }
    ];
  }, [filteredReceber]);

  const topClientes = useMemo(() => {
    const clienteMap = new Map<string, number>();
    filteredReceber.filter(c => c.status === 'pago').forEach(c => { const nome = c.cliente_nome || 'Sem cliente'; clienteMap.set(nome, (clienteMap.get(nome) || 0) + (c.valor_recebido || c.valor)); });
    return Array.from(clienteMap.entries()).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [filteredReceber]);

  const distribuicaoCentros = useMemo(() => {
    const centroMap = new Map<string, number>();
    filteredPagar.filter(c => c.status === 'pago').forEach(c => { const centro = centrosCusto.find(cc => cc.id === c.centro_custo_id); const nome = centro?.nome || 'Sem centro'; centroMap.set(nome, (centroMap.get(nome) || 0) + (c.valor_pago || c.valor)); });
    return Array.from(centroMap.entries()).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor).slice(0, 6);
  }, [filteredPagar, centrosCusto]);

  const comparativoEmpresas = useMemo(() => {
    return empresas.filter(e => e.ativo).map(empresa => {
      const er = contasReceber.filter(c => c.empresa_id === empresa.id);
      const ep = contasPagar.filter(c => c.empresa_id === empresa.id);
      const ec = contasBancarias.filter(c => c.empresa_id === empresa.id);
      const receitas = er.filter(c => c.status === 'pago').reduce((acc, c) => acc + (c.valor_recebido || c.valor), 0);
      const despesas = ep.filter(c => c.status === 'pago').reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
      const saldo = ec.reduce((acc, c) => acc + c.saldo_atual, 0);
      const aReceber = er.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((acc, c) => acc + c.valor, 0);
      const aPagar = ep.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((acc, c) => acc + c.valor, 0);
      const vencidas = er.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0);
      const inadimplencia = aReceber > 0 ? (vencidas / aReceber) * 100 : 0;
      const lucro = receitas - despesas;
      const margem = receitas > 0 ? (lucro / receitas) * 100 : 0;
      const liquidez = aPagar > 0 ? saldo / aPagar : 0;
      const ticketMedio = er.filter(c => c.status === 'pago').length > 0 ? receitas / er.filter(c => c.status === 'pago').length : 0;
      return { id: empresa.id, nome: empresa.nome_fantasia || empresa.razao_social, cnpj: empresa.cnpj, receitas, despesas, lucro, margem, saldo, aReceber, aPagar, inadimplencia, liquidez, contasCount: ec.filter(c => c.ativo).length, ticketMedio, saldoProjetado: saldo + aReceber - aPagar };
    }).sort((a, b) => b.lucro - a.lucro);
  }, [empresas, contasReceber, contasPagar, contasBancarias]);

  return (
    <MainLayout>
      <motion.div className="space-y-6 p-6" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Business Intelligence</h1>
            <p className="text-muted-foreground">Visão executiva consolidada para gestão estratégica</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-[200px]"><Building2 className="w-4 h-4 mr-2" /><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Empresas</SelectItem>
                {empresas.filter(e => e.ativo).map(empresa => <SelectItem key={empresa.id} value={empresa.id}>{empresa.nome_fantasia || empresa.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={usarPeriodoCustom ? "custom" : periodo} onValueChange={(val) => { if (val === "custom") { setUsarPeriodoCustom(true); } else { setUsarPeriodoCustom(false); setPeriodo(val); setDataInicio(undefined); setDataFim(undefined); } }}>
              <SelectTrigger className="w-[160px]"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {usarPeriodoCustom && (
              <div className="flex items-center gap-2">
                {[{ state: dataInicio, setter: setDataInicio, label: "Início" }, { state: dataFim, setter: setDataFim, label: "Fim" }].map((item) => (
                  <Popover key={item.label}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[130px] justify-start text-left font-normal", !item.state && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />{item.state ? format(item.state, "dd/MM/yyyy") : item.label}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={item.state} onSelect={item.setter} initialFocus className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <BIMainKpis kpis={kpis} />
        <BISecondaryKpis kpis={kpis} />

        <Tabs defaultValue="evolucao" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="evolucao" className="flex items-center gap-2"><LineChartIcon className="w-4 h-4" />Evolução</TabsTrigger>
            <TabsTrigger value="aging" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />Aging</TabsTrigger>
            <TabsTrigger value="centros" className="flex items-center gap-2"><PieChartIcon className="w-4 h-4" />Custos</TabsTrigger>
            <TabsTrigger value="empresas" className="flex items-center gap-2"><Building2 className="w-4 h-4" />Empresas</TabsTrigger>
          </TabsList>
          <TabsContent value="evolucao"><BIEvolucaoChart evolucaoMensal={evolucaoMensal} statusReceber={statusReceber} /></TabsContent>
          <TabsContent value="aging"><BIAgingChart agingReceber={agingReceber} topClientes={topClientes} /></TabsContent>
          <TabsContent value="centros"><BICentrosChart distribuicaoCentros={distribuicaoCentros} /></TabsContent>
          <TabsContent value="empresas"><BIEmpresasTab comparativoEmpresas={comparativoEmpresas} /></TabsContent>
        </Tabs>

        <motion.div variants={itemVariants} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Inadimplência Segmentada</CardTitle>
              <CardDescription>Análise de inadimplência por ramo de atividade e vendedor</CardDescription>
            </CardHeader>
            <CardContent><InadimplenciaSegmentada /></CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-6"><BenchmarkingSetorial /></motion.div>
        <motion.div variants={itemVariants} className="mt-6"><HistoricoAnalisesPreditivasPanel /></motion.div>
      </motion.div>
    </MainLayout>
  );
}
