import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle, BarChart3, Brain, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useDashboardConfig, DashboardWidget } from '@/hooks/useDashboardConfig';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { PrevisaoIA } from './PrevisaoIA';
import { AlertasPreditivosPanel } from './AlertasPreditivosPanel';
import { MetasFinanceirasPanel } from './MetasFinanceirasPanel';
import { DashboardConfigDialog } from './DashboardConfigDialog';
import { DashboardSkeleton } from './DashboardSkeleton';
import { HeroKPICard, HeroKPIGrid } from './HeroKPICards';
import { DashboardFiltersHeader } from './DashboardFiltersHeader';
import { SecondaryKPICards } from './SecondaryKPICards';
import { FluxoCaixaChart } from './FluxoCaixaChart';
import { SaldoPorBancoCard } from './SaldoPorBancoCard';
import { TopClientesLeaderboard } from './TopClientesLeaderboard';
import { StatusContasPieChart } from './StatusContasPieChart';
import { TopCentrosCustoChart } from './TopCentrosCustoChart';
import { DraggableDashboard } from './DraggableDashboard';
import { CentroAcoesInteligentes } from './CentroAcoesInteligentes';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

function SectionDivider({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-primary/[0.06] flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary/70" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          {label}
        </span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-border/60 via-border/30 to-transparent" />
    </div>
  );
}

export const DashboardExecutivo = () => {
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [periodoFluxo, setPeriodoFluxo] = useState('30');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const {
    widgets,
    isEditing,
    setIsEditing,
    toggleWidget,
    reorderWidgets,
    resizeWidget,
    resetToDefault,
  } = useDashboardConfig();

  const metrics = useDashboardMetrics({
    empresaFilter,
    centroCustoFilter,
    periodoFluxo,
  });

  if (metrics.isLoading) {
    return <DashboardSkeleton />;
  }

  const inadimplenciaBadge = metrics.totalVencidasReceber > 0
    ? formatCurrency(metrics.totalVencidasReceber) + " vencido"
    : undefined;

  const inadimplenciaBadgeVariant = metrics.totalVencidasReceber > 0
    ? 'destructive' as const
    : 'secondary' as const;

  const renderWidget = (widget: DashboardWidget): ReactNode => {
    switch (widget.id) {
      case 'fluxo-caixa':
        return (
          <FluxoCaixaChart
            data={metrics.fluxoCaixaProjetado}
            periodoFluxo={periodoFluxo}
            setPeriodoFluxo={setPeriodoFluxo}
          />
        );
      case 'composicao':
        return <SaldoPorBancoCard contasBancariasFiltradas={metrics.contasBancariasFiltradas} saldoTotal={metrics.saldoTotal} />;
      case 'top-clientes':
        return <TopClientesLeaderboard topClientesReceita={metrics.topClientesReceita} />;
      case 'vencimentos':
        return <StatusContasPieChart statusContasPagar={metrics.statusContasPagar} />;
      case 'previsao-ia':
        return <PrevisaoIA />;
      case 'aprovacoes':
        return <TopCentrosCustoChart dadosPorCentroCusto={metrics.dadosPorCentroCusto} />;
      case 'alertas-preditivos':
        return (
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
        );
      case 'metas':
        return <MetasFinanceirasPanel />;
      default:
        return <div className="p-4 text-sm text-muted-foreground">Widget: {widget.title}</div>;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="relative z-10 space-y-8 sm:space-y-10 pb-20" 
        data-tour="dashboard"
      >
        {/* Header Section */}
        <DashboardFiltersHeader
          empresas={metrics.empresas}
          centrosCusto={metrics.centrosCusto}
          empresaFilter={empresaFilter}
          setEmpresaFilter={setEmpresaFilter}
          centroCustoFilter={centroCustoFilter}
          setCentroCustoFilter={setCentroCustoFilter}
          onOpenConfig={() => setConfigDialogOpen(true)}
        />

        {/* Hero KPIs Section */}
        <motion.div variants={itemVariants} className="px-1">
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
              emptyStateMessage={metrics.totalReceber === 0 ? "Crie sua primeira conta a receber →" : undefined}
              emptyStateHref="/contas-receber"
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
              emptyStateMessage={metrics.totalPagar === 0 ? "Registre seu primeiro pagamento →" : undefined}
              emptyStateHref="/contas-pagar"
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
              badge={inadimplenciaBadge}
              badgeVariant={inadimplenciaBadgeVariant}
              emptyStateMessage={metrics.inadimplencia === 0 ? "✓ Nenhuma inadimplência — excelente!" : undefined}
            />
          </HeroKPIGrid>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-10">
            {/* Secondary KPIs */}
            <motion.div variants={itemVariants}>
              <SecondaryKPICards
                empresasCount={metrics.empresas.length}
                contasBancariasCount={metrics.contasBancarias.length}
                venceHojeReceberCount={metrics.venceHojeReceber.length}
                venceHojePagarCount={metrics.venceHojePagar.length}
                aprovacoesPendentes={metrics.aprovacoesPendentes}
                vencidasTotal={metrics.vencidasReceber.length + metrics.vencidasPagar.length}
              />
            </motion.div>

            {/* Smart Actions Panel */}
            <motion.div variants={itemVariants}>
              <CentroAcoesInteligentes empresaId={empresaFilter !== 'all' ? empresaFilter : undefined} />
            </motion.div>

            {/* Analytics Section */}
            <div className="space-y-6">
              <SectionDivider label="Analytics & Inteligência" icon={BarChart3} />
              <DraggableDashboard
                widgets={widgets}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onReorder={reorderWidgets}
                onToggle={toggleWidget}
                onResize={resizeWidget}
                renderWidget={renderWidget}
              />
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            {/* AI Insights & Previsions */}
            <SectionDivider label="IA & Insights" icon={Brain} />
            <div className="space-y-6">
              {renderWidget({ id: 'previsao-ia', title: 'Previsão IA', type: 'chart' })}
              {renderWidget({ id: 'alertas-preditivos', title: 'Alertas Preditivos', type: 'list' })}
              {renderWidget({ id: 'metas', title: 'Metas', type: 'list' })}
            </div>
          </aside>
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
    </div>
  );
};
};