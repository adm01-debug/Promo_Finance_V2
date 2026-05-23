import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle, BarChart3, ShieldCheck, ShieldAlert, FileText, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
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
import { CentroAcoesInteligentes } from './CentroAcoesInteligentes';
import { BlingNFeTab } from '@/components/bling/BlingNFeTab';
import { BlingFinanceiroPanel } from '@/components/bling/BlingFinanceiroPanel';
import { InadimplenciaSegmentada } from '@/components/analytics/InadimplenciaSegmentada';
import { BenchmarkingSetorial } from '@/components/analytics/BenchmarkingSetorial';
import { AlertasOrcamento } from './AlertasOrcamento';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
} as const;

function SectionDivider({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center border border-border">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export const DashboardExecutivo = () => {
  const { currentEmpresaId } = useAuth();
  const [empresaFilter, setEmpresaFilter] = useState<string>(currentEmpresaId || 'all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [periodoFluxo, setPeriodoFluxo] = useState('30');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const {
    widgets,
    resetToDefault,
  } = useDashboardConfig();

  const metrics = useDashboardMetrics({
    empresaFilter,
    centroCustoFilter,
    periodoFluxo,
  });
  
  const { data: duplicateStats } = useQuery({
    queryKey: ['bloqueios-duplicidade-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bloqueios_duplicidade')
        .select('valor_bloqueado')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return {
        count: data?.length || 0,
        totalValue: data?.reduce((acc, curr) => acc + (Number(curr.valor_bloqueado) || 0), 0) || 0
      };
    }
  });

  if (metrics.isLoading) {
    return <DashboardSkeleton />;
  }

  const inadimplenciaBadge = metrics.totalVencidasReceber > 0
    ? formatCurrency(metrics.totalVencidasReceber) + " atrasado"
    : undefined;

  const inadimplenciaBadgeVariant = metrics.totalVencidasReceber > 0
    ? 'destructive' as const
    : 'secondary' as const;

  const renderWidget = (widget: DashboardWidget): ReactNode => {
    const isTarget = window.location.hash === `#${widget.id}`;
    
    const widgetContent = (() => {
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
          return <PrevisaoIA className="h-full" />;
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
              defaultExpanded={isTarget}
            />
          );
        case 'metas':
          return <MetasFinanceirasPanel defaultExpanded={isTarget} />;
        case 'bling-nfe':
          return <BlingNFeTab />;
        case 'bling-financeiro':
          return <BlingFinanceiroPanel />;
        case 'inadimplencia-segmentada':
          return <InadimplenciaSegmentada />;
        case 'benchmarking':
          return <BenchmarkingSetorial />;
        case 'alertas-orcamento':
          return <AlertasOrcamento />;

        default:
          return <div className="p-4 text-sm text-muted-foreground">Widget: {widget.title}</div>;
      }
    })();

    return (
      <div id={widget.id} className={cn(isTarget && "ring-2 ring-primary ring-offset-2 rounded-lg")}>
        {widgetContent}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="relative z-10 space-y-8 pb-20" 
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
        <motion.div variants={itemVariants}>
          <HeroKPIGrid layout="hero-first">
            <HeroKPICard
              title="Saldo Consolidado"
              value={metrics.saldoTotal}
              icon={Wallet}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              accentColor="hsl(221 100% 50%)"
              href="/contas-bancarias"
              size="hero"
              badge={`${metrics.contasBancariasFiltradas.length} contas ativas`}
              tooltip="Saldo total disponível em todas as contas conectadas"
            />
            <HeroKPICard
              title="Previsão de Recebimento"
              value={metrics.totalReceber}
              previousValue={metrics.totalReceber - metrics.receitasMes}
              icon={ArrowDownCircle}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
              accentColor="hsl(150, 70%, 42%)"
              href="/contas-receber"
              size="primary"
              badge={metrics.receitasMes > 0 ? formatCurrency(metrics.receitasMes) + " recebido" : undefined}
            />
            <HeroKPICard
              title="Compromissos a Pagar"
              value={metrics.totalPagar}
              previousValue={metrics.totalPagar - metrics.despesasMes}
              icon={ArrowUpCircle}
              iconColor="text-rose-600"
              iconBg="bg-rose-50"
              accentColor="hsl(0, 78%, 55%)"
              href="/contas-pagar"
              size="primary"
              badge={metrics.despesasMes > 0 ? formatCurrency(metrics.despesasMes) + " pago" : undefined}
            />
            <HeroKPICard
              title="Índice de Inadimplência"
              value={metrics.inadimplencia}
              icon={AlertTriangle}
              iconColor={metrics.inadimplencia > 10 ? "text-rose-600" : metrics.inadimplencia > 5 ? "text-amber-600" : "text-emerald-600"}
              iconBg={metrics.inadimplencia > 10 ? "bg-rose-50" : metrics.inadimplencia > 5 ? "bg-amber-50" : "bg-emerald-50"}
              accentColor={metrics.inadimplencia > 10 ? "hsl(0, 78%, 55%)" : metrics.inadimplencia > 5 ? "hsl(42, 95%, 48%)" : "hsl(150, 70%, 42%)"}
              href="/cobrancas"
              size="primary"
              isPercentage
              isCurrency={false}
              badge={inadimplenciaBadge}
              badgeVariant={inadimplenciaBadgeVariant}
            />
          </HeroKPIGrid>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Secondary KPIs */}
            <motion.div variants={itemVariants}>
              <SecondaryKPICards
                empresasCount={metrics.empresas.length}
                contasBancariasCount={metrics.contasBancarias.length}
                venceHojeReceberCount={metrics.venceHojeReceber.length}
                venceHojePagarCount={metrics.venceHojePagar.length}
                aprovacoesPendentes={metrics.aprovacoesPendentes}
                vencidasTotal={metrics.vencidasReceber.length + metrics.vencidasPagar.length}
                totalDivergencias={metrics.totalDivergencias}
                boletosAbertos={metrics.boletosStats?.countGerado || 0}
                taxaRecuperacao={metrics.cobrancaKpis?.taxaRecuperacao || 0}
              />
            </motion.div>

            {/* Smart Actions Panel */}
            <motion.div variants={itemVariants}>
              <CentroAcoesInteligentes empresaId={empresaFilter !== 'all' ? empresaFilter : undefined} />
            </motion.div>

            {/* Analytics Section */}
            <div className="space-y-4">
              <SectionDivider label="Análises Estratégicas" icon={BarChart3} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <motion.div variants={itemVariants} className="premium-card p-6 border border-border bg-card rounded-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      <ShieldAlert className="h-3 w-3" /> Anti-Duplicidade
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">Sentinel: Proteção de Caixa</h3>
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Proteção</span>
                        <span className="text-sm font-semibold text-emerald-600">{formatCurrency(duplicateStats?.totalValue || 0)}</span>
                      </div>
                      <div className="h-6 w-px bg-border mx-2" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Bloqueios</span>
                        <span className="text-sm font-semibold">{duplicateStats?.count || 0} ocorrências</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Bloqueio automático de pagamentos duplicados e auditoria contínua.</p>
                    <div className="flex items-center gap-2 pt-2">
                      <Button asChild size="sm" className="rounded-md font-medium bg-primary text-white h-9 px-4">
                        <Link to="/contas-pagar/bloqueios">Ver Auditoria</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="rounded-md font-medium text-muted-foreground hover:text-foreground h-9 px-4">
                        <Link to="/configuracoes">Configurar</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="premium-card p-6 border border-border bg-card rounded-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText className="h-10 w-10 text-indigo-400" />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                      <Download className="h-3 w-3" /> Relatórios
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">Relatórios & Conciliação</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">Exporte trilhas de auditoria completas para conciliações bancárias impecáveis.</p>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" className="rounded-md font-medium bg-primary text-white h-9 px-4">
                        Gerar PDF
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-md font-medium text-muted-foreground hover:text-foreground h-9 px-4">
                        Outros formatos
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="space-y-6">
                {widgets.filter(w => w.visible).map(widget => (
                  <div key={widget.id} className="w-full">
                    {renderWidget(widget)}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <motion.div variants={itemVariants}>
              <PrevisaoIA />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetasFinanceirasPanel />
            </motion.div>
            <motion.div variants={itemVariants}>
              <AlertasOrcamento />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <DashboardConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        widgets={widgets}
        onToggleWidget={() => {}}
        onResizeWidget={() => {}}
        onResetToDefault={resetToDefault}
      />

    </div>
  );
};