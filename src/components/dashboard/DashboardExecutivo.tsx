import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { PrevisaoIA } from './PrevisaoIA';
import { AlertasPreditivosPanel } from './AlertasPreditivosPanel';
import { SimuladorCenarios } from './SimuladorCenarios';
import { DashboardConfigDialog } from './DashboardConfigDialog';
import { HistoricoAnalisesPreditivas } from './HistoricoAnalisesPreditivas';
import { CockpitCFO } from './CockpitCFO';
import { DashboardSkeleton } from './DashboardSkeleton';
import { HeroKPICard, HeroKPIGrid } from './HeroKPICards';
import { DashboardFiltersHeader } from './DashboardFiltersHeader';
import { StreakCard } from './StreakCard';
import { SecondaryKPICards } from './SecondaryKPICards';
import { FluxoCaixaChart } from './FluxoCaixaChart';
import { SaldoPorBancoCard } from './SaldoPorBancoCard';
import { CentroCustoDrillDown } from './CentroCustoDrillDown';
import { TopClientesLeaderboard } from './TopClientesLeaderboard';
import { StatusContasPieChart } from './StatusContasPieChart';
import { TopCentrosCustoChart } from './TopCentrosCustoChart';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

export const DashboardExecutivo = () => {
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [periodoFluxo, setPeriodoFluxo] = useState('30');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  const { widgets, toggleWidget, resizeWidget, resetToDefault } = useDashboardConfig();

  const metrics = useDashboardMetrics({
    empresaFilter,
    centroCustoFilter,
    periodoFluxo,
  });

  if (metrics.isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6" data-tour="dashboard">
      <DashboardFiltersHeader
        empresas={metrics.empresas}
        centrosCusto={metrics.centrosCusto}
        empresaFilter={empresaFilter}
        setEmpresaFilter={setEmpresaFilter}
        centroCustoFilter={centroCustoFilter}
        setCentroCustoFilter={setCentroCustoFilter}
        onOpenConfig={() => setConfigDialogOpen(true)}
      />

      <motion.div variants={itemVariants}>
        <CockpitCFO />
      </motion.div>

      <motion.div variants={itemVariants}>
        <HeroKPIGrid layout="hero-first">
          <HeroKPICard
            title="Saldo Total"
            value={metrics.saldoTotal}
            icon={Wallet}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            accentColor="hsl(24, 95%, 46%)"
            href="/contas-bancarias"
            size="hero"
            badge={`${metrics.contasBancariasFiltradas.length} conta(s)`}
            tooltip="Soma de todos os saldos das contas bancárias"
            insight="Mantenha reserva de 3 meses de despesas"
          />
          <HeroKPICard
            title="A Receber"
            value={metrics.totalReceber}
            previousValue={metrics.totalReceber - metrics.receitasMes}
            icon={ArrowDownCircle}
            iconColor="text-success"
            iconBg="bg-success/10"
            accentColor="hsl(150, 70%, 42%)"
            href="/contas-receber"
            size="primary"
            badge={metrics.receitasMes > 0 ? formatCurrency(metrics.receitasMes) + " este mês" : undefined}
          />
          <HeroKPICard
            title="A Pagar"
            value={metrics.totalPagar}
            previousValue={metrics.totalPagar - metrics.despesasMes}
            icon={ArrowUpCircle}
            iconColor="text-destructive"
            iconBg="bg-destructive/10"
            accentColor="hsl(0, 78%, 55%)"
            href="/contas-pagar"
            size="primary"
            badge={metrics.despesasMes > 0 ? formatCurrency(metrics.despesasMes) + " este mês" : undefined}
          />
          <HeroKPICard
            title="Inadimplência"
            value={metrics.inadimplencia}
            icon={AlertTriangle}
            iconColor={metrics.inadimplencia > 10 ? "text-destructive" : metrics.inadimplencia > 5 ? "text-warning" : "text-success"}
            iconBg={metrics.inadimplencia > 10 ? "bg-destructive/10" : metrics.inadimplencia > 5 ? "bg-warning/10" : "bg-success/10"}
            accentColor={metrics.inadimplencia > 10 ? "hsl(0, 78%, 55%)" : metrics.inadimplencia > 5 ? "hsl(42, 95%, 48%)" : "hsl(150, 70%, 42%)"}
            href="/cobrancas"
            size="primary"
            isPercentage
            isCurrency={false}
            badge={formatCurrency(metrics.totalVencidasReceber) + " vencido"}
          />
        </HeroKPIGrid>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StreakCard streakData={metrics.streakData} />
        <SecondaryKPICards
          empresasCount={metrics.empresas.length}
          contasBancariasCount={metrics.contasBancarias.length}
          venceHojeReceberCount={metrics.venceHojeReceber.length}
          venceHojePagarCount={metrics.venceHojePagar.length}
          aprovacoesPendentes={metrics.aprovacoesPendentes}
          vencidasTotal={metrics.vencidasReceber.length + metrics.vencidasPagar.length}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FluxoCaixaChart
          data={metrics.fluxoCaixaProjetado}
          periodoFluxo={periodoFluxo}
          setPeriodoFluxo={setPeriodoFluxo}
        />
        <SaldoPorBancoCard
          contasBancariasFiltradas={metrics.contasBancariasFiltradas}
          saldoTotal={metrics.saldoTotal}
        />
      </div>

      <CentroCustoDrillDown dadosPorCentroCusto={metrics.dadosPorCentroCusto} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopClientesLeaderboard topClientesReceita={metrics.topClientesReceita} />
        <StatusContasPieChart statusContasPagar={metrics.statusContasPagar} />
        <TopCentrosCustoChart dadosPorCentroCusto={metrics.dadosPorCentroCusto} />
      </div>

      <motion.div variants={itemVariants}>
        <PrevisaoIA />
      </motion.div>

      <motion.div variants={itemVariants}>
        <HistoricoAnalisesPreditivas />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <AlertasPreditivosPanel
            saldoAtual={metrics.saldoTotal}
            receitasPrevistas={metrics.contasReceberFiltradas
              .filter(c => c.status !== 'pago' && c.status !== 'cancelado')
              .map(c => ({
                valor: c.valor - (c.valor_recebido || 0),
                dataVencimento: new Date(c.data_vencimento),
                entidade: c.cliente_nome,
              }))}
            despesasPrevistas={metrics.contasPagarFiltradas
              .filter(c => c.status !== 'pago' && c.status !== 'cancelado')
              .map(c => ({
                valor: c.valor - (c.valor_pago || 0),
                dataVencimento: new Date(c.data_vencimento),
                entidade: c.fornecedor_nome,
              }))}
            historicoInadimplencia={metrics.vencidasReceber.map(c => ({
              clienteId: c.cliente_id || 'unknown',
              diasAtraso: Math.floor((new Date().getTime() - new Date(c.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)),
            }))}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <SimuladorCenarios
            saldoAtual={metrics.saldoTotal}
            receitasPrevistas={metrics.totalReceber}
            despesasPrevistas={metrics.totalPagar}
            taxaInadimplencia={metrics.inadimplencia}
          />
        </motion.div>
      </div>

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
