import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building2, CreditCard, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useEmpresas, useCentrosCusto, useContasBancarias, useContasPagar, useContasReceber, useClientes, useFornecedores } from '@/hooks/useFinancialData';
import { MainLayout } from '@/components/layout/MainLayout';
import { EmpresaKpiCards } from '@/components/dashboard-empresa/EmpresaKpis';
import { EmpresaChartsSection } from '@/components/dashboard-empresa/EmpresaCharts';
import { EmpresaDrillDownSection } from '@/components/dashboard-empresa/EmpresaDrillDown';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } } as const;
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } } as const;
const COLORS = ['hsl(24, 95%, 46%)', 'hsl(215, 90%, 42%)', 'hsl(150, 70%, 32%)', 'hsl(275, 75%, 48%)', 'hsl(42, 95%, 48%)'];

export default function DashboardEmpresa() {
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [periodoAnalise, setPeriodoAnalise] = useState('30');

  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: contasPagar = [] } = useContasPagar();
  const { data: contasReceber = [] } = useContasReceber();

  const empresaId = selectedEmpresa || (empresas.length > 0 ? empresas[0].id : '');
  const empresa = empresas.find((e) => e.id === empresaId);

  const contasBancariasEmpresa = useMemo(() => contasBancarias.filter((c) => c.empresa_id === empresaId), [contasBancarias, empresaId]);
  const contasPagarEmpresa = useMemo(() => contasPagar.filter((c) => c.empresa_id === empresaId), [contasPagar, empresaId]);
  const contasReceberEmpresa = useMemo(() => contasReceber.filter((c) => c.empresa_id === empresaId), [contasReceber, empresaId]);

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const saldoTotal = contasBancariasEmpresa.reduce((sum, c) => sum + c.saldo_atual, 0);
  const saldoDisponivel = contasBancariasEmpresa.reduce((sum, c) => sum + c.saldo_disponivel, 0);
  const totalReceber = contasReceberEmpresa.filter((c) => c.status !== 'pago' && c.status !== 'cancelado').reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  const totalPagar = contasPagarEmpresa.filter((c) => c.status !== 'pago' && c.status !== 'cancelado').reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);
  const totalVencidasReceber = contasReceberEmpresa.filter((c) => c.status === 'vencido').reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  const totalVencidasPagar = contasPagarEmpresa.filter((c) => c.status === 'vencido').reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);
  const saldoProjetado = saldoTotal + totalReceber - totalPagar;

  const statusReceberData = useMemo(() => {
    const counts = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    contasReceberEmpresa.forEach((c) => { if (counts[c.status as keyof typeof counts] !== undefined) counts[c.status as keyof typeof counts]++; });
    return [{ name: 'Recebidas', value: counts.pago, fill: COLORS[2] }, { name: 'Pendentes', value: counts.pendente, fill: COLORS[4] }, { name: 'Vencidas', value: counts.vencido, fill: 'hsl(0, 78%, 55%)' }, { name: 'Parciais', value: counts.parcial, fill: COLORS[3] }].filter((s) => s.value > 0);
  }, [contasReceberEmpresa]);

  const statusPagarData = useMemo(() => {
    const counts = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    contasPagarEmpresa.forEach((c) => { if (counts[c.status as keyof typeof counts] !== undefined) counts[c.status as keyof typeof counts]++; });
    return [{ name: 'Pagas', value: counts.pago, fill: COLORS[2] }, { name: 'Pendentes', value: counts.pendente, fill: COLORS[4] }, { name: 'Vencidas', value: counts.vencido, fill: 'hsl(0, 78%, 55%)' }, { name: 'Parciais', value: counts.parcial, fill: COLORS[3] }].filter((s) => s.value > 0);
  }, [contasPagarEmpresa]);

  const fluxoCaixaProjetado = useMemo(() => {
    const dias = parseInt(periodoAnalise); const result = []; let saldoAcumulado = saldoTotal;
    for (let i = 0; i < dias; i++) {
      const data = new Date(hoje); data.setDate(data.getDate() + i); const dataStr = data.toISOString().split('T')[0];
      const receitasDia = contasReceberEmpresa.filter((c) => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado').reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
      const despesasDia = contasPagarEmpresa.filter((c) => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado').reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);
      saldoAcumulado = saldoAcumulado + receitasDia - despesasDia;
      if (i % Math.ceil(dias / 15) === 0 || i === dias - 1) result.push({ data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), receitas: receitasDia, despesas: despesasDia, saldo: saldoAcumulado });
    }
    return result;
  }, [contasPagarEmpresa, contasReceberEmpresa, saldoTotal, periodoAnalise, hoje]);

  const topClientesReceber = useMemo(() => {
    const map = new Map<string, { nome: string; valor: number; vencido: number }>();
    contasReceberEmpresa.filter((c) => c.status !== 'pago' && c.status !== 'cancelado').forEach((c) => {
      if (!map.has(c.cliente_nome)) map.set(c.cliente_nome, { nome: c.cliente_nome, valor: 0, vencido: 0 });
      const cur = map.get(c.cliente_nome)!; cur.valor += c.valor - (c.valor_recebido || 0); if (c.status === 'vencido') cur.vencido += c.valor - (c.valor_recebido || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [contasReceberEmpresa]);

  const topFornecedoresPagar = useMemo(() => {
    const map = new Map<string, { nome: string; valor: number; vencido: number }>();
    contasPagarEmpresa.filter((c) => c.status !== 'pago' && c.status !== 'cancelado').forEach((c) => {
      if (!map.has(c.fornecedor_nome)) map.set(c.fornecedor_nome, { nome: c.fornecedor_nome, valor: 0, vencido: 0 });
      const cur = map.get(c.fornecedor_nome)!; cur.valor += c.valor - (c.valor_pago || 0); if (c.status === 'vencido') cur.vencido += c.valor - (c.valor_pago || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [contasPagarEmpresa]);

  const transacoesRecentes = useMemo(() => {
    const receberRecentes = contasReceberEmpresa.filter((c) => c.status === 'pago' && c.data_recebimento).map((c) => ({ tipo: 'receber' as const, descricao: c.descricao, nome: c.cliente_nome, valor: c.valor_recebido || c.valor, data: c.data_recebimento! }));
    const pagarRecentes = contasPagarEmpresa.filter((c) => c.status === 'pago' && c.data_pagamento).map((c) => ({ tipo: 'pagar' as const, descricao: c.descricao, nome: c.fornecedor_nome, valor: c.valor_pago || c.valor, data: c.data_pagamento! }));
    return [...receberRecentes, ...pagarRecentes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 10);
  }, [contasReceberEmpresa, contasPagarEmpresa]);

  if (loadingEmpresas) return <MainLayout><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  if (empresas.length === 0) return <MainLayout><div className="flex flex-col items-center justify-center h-96 gap-4"><Building2 className="h-16 w-16 text-muted-foreground" /><h2 className="text-xl font-semibold">Nenhuma empresa cadastrada</h2><p className="text-muted-foreground">Cadastre uma empresa para visualizar o dashboard</p><Button asChild><Link to="/empresas">Ir para Empresas</Link></Button></div></MainLayout>;

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div><h1 className="text-display-md text-foreground">Dashboard por Empresa</h1><p className="text-muted-foreground mt-1">Análise detalhada com drill-down financeiro</p></div>
          <div className="flex items-center gap-3">
            <Select value={empresaId} onValueChange={setSelectedEmpresa}><SelectTrigger className="w-[280px]"><Building2 className="h-4 w-4 mr-2" /><SelectValue placeholder="Selecione a empresa" /></SelectTrigger><SelectContent>{empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}</SelectContent></Select>
            <Select value={periodoAnalise} onValueChange={setPeriodoAnalise}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 dias</SelectItem><SelectItem value="15">15 dias</SelectItem><SelectItem value="30">30 dias</SelectItem><SelectItem value="60">60 dias</SelectItem><SelectItem value="90">90 dias</SelectItem></SelectContent></Select>
          </div>
        </motion.div>

        {empresa && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-primary/20 text-primary flex items-center justify-center"><Building2 className="h-7 w-7" /></div>
                    <div><h2 className="text-xl font-bold">{empresa.nome_fantasia || empresa.razao_social}</h2><p className="text-sm text-muted-foreground">CNPJ: {empresa.cnpj}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1"><CreditCard className="h-3 w-3" />{contasBancariasEmpresa.length} conta(s)</Badge>
                    <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />{contasReceberEmpresa.length + contasPagarEmpresa.length} lançamentos</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <EmpresaKpiCards saldoTotal={saldoTotal} saldoDisponivel={saldoDisponivel} totalReceber={totalReceber} totalPagar={totalPagar} totalVencidasReceber={totalVencidasReceber} totalVencidasPagar={totalVencidasPagar} saldoProjetado={saldoProjetado} />
        <EmpresaChartsSection fluxoCaixaProjetado={fluxoCaixaProjetado} statusReceberData={statusReceberData} statusPagarData={statusPagarData} periodoAnalise={periodoAnalise} />
        <EmpresaDrillDownSection contasBancarias={contasBancariasEmpresa} topClientesReceber={topClientesReceber} topFornecedoresPagar={topFornecedoresPagar} transacoesRecentes={transacoesRecentes} totalReceber={totalReceber} totalPagar={totalPagar} />
      </motion.div>
    </MainLayout>
  );
}
