import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle, BarChart3, Brain, Target, ShieldCheck } from 'lucide-react';
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
import { DraggableDashboard } from './DraggableDashboard';
import { CentroAcoesInteligentes } from './CentroAcoesInteligentes';
import { BlingNFeTab } from '@/components/bling/BlingNFeTab';
import { BlingFinanceiroPanel } from '@/components/bling/BlingFinanceiroPanel';
import { InadimplenciaSegmentada } from '@/components/analytics/InadimplenciaSegmentada';
import { BenchmarkingSetorial } from '@/components/analytics/BenchmarkingSetorial';
import { RelatoriosModelos } from '@/components/relatorios/RelatoriosModelos';
import { ShieldAlert, FileText, Download, TrendingUp, Target as TargetIcon, History } from 'lucide-react';
import { AlertasOrcamento } from './AlertasOrcamento';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { toast } from 'sonner';


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
  const { currentEmpresaId } = useAuth();
  const [empresaFilter, setEmpresaFilter] = useState<string>(currentEmpresaId || 'all');
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

  const { data: auditLogs } = useQuery({
    queryKey: ['dashboard-audit-logs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    }
  });

  if (metrics.isLoading) {
    return <DashboardSkeleton />;
  }

  const inadimplenciaBadge = metrics.totalVencidasReceber > 0
    ? formatCurrency(metrics.totalVencidasReceber) + " overdue"
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
      <div id={widget.id} className={cn(isTarget && "ring-2 ring-primary ring-offset-4 ring-offset-background rounded-[2.5rem] transition-all duration-1000")}>
        {widgetContent}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[140px] animate-[pulse_4s_infinite]" />
        <div className="absolute bottom-[10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-blue-600/15 blur-[120px] animate-[pulse_6s_infinite]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[5%] w-[45%] h-[45%] rounded-full bg-purple-600/15 blur-[150px] animate-[pulse_5s_infinite]" style={{ animationDelay: '4s' }} />
        <div className="absolute middle-0 left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[130px] animate-[pulse_7s_infinite]" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_100%)]" />
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
              title="Total Liquidity Index"
              value={metrics.saldoTotal}
              icon={Wallet}
              iconColor="text-primary"
              iconBg="bg-primary/10"
              accentColor="hsl(24, 95%, 46%)"
              href="/contas-bancarias"
              size="hero"
              badge={`${metrics.contasBancariasFiltradas.length} active nodes`}
              tooltip="Consolidado bancário neural em tempo real"
              insight="Otimize aplicações para CDI superior"
            />
            <HeroKPICard
              title="Projected Inbound"
              value={metrics.totalReceber}
              previousValue={metrics.totalReceber - metrics.receitasMes}
              icon={ArrowDownCircle}
              iconColor="text-success"
              iconBg="bg-success/10"
              accentColor="hsl(150, 70%, 42%)"
              href="/contas-receber"
              size="primary"
              badge={metrics.receitasMes > 0 ? formatCurrency(metrics.receitasMes) + " realized" : undefined}
              emptyStateMessage={metrics.totalReceber === 0 ? "Aguardando faturamento..." : undefined}
              emptyStateHref="/contas-receber"
            />
            <HeroKPICard
              title="Cash Exposure Index"
              value={metrics.totalPagar}
              previousValue={metrics.totalPagar - metrics.despesasMes}
              icon={ArrowUpCircle}
              iconColor="text-destructive"
              iconBg="bg-destructive/10"
              accentColor="hsl(0, 78%, 55%)"
              href="/contas-pagar"
              size="primary"
              badge={metrics.despesasMes > 0 ? formatCurrency(metrics.despesasMes) + " settled" : undefined}
              emptyStateMessage={metrics.totalPagar === 0 ? "Nenhum compromisso pendente" : undefined}
              emptyStateHref="/contas-pagar"
            />
            <HeroKPICard
              title="Delinquency Matrix"
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
              emptyStateMessage={metrics.inadimplencia === 0 ? "Performance 10/10 — Zero Atrasos" : undefined}
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
            <div className="space-y-6">
              <SectionDivider label="Cyber-Neural Matrix: Strategic Analytics 10/10" icon={BarChart3} />
              
              {/* Intelligent Purchasing 360 & Anti-Duplicity Hub */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <motion.div variants={itemVariants} className="premium-card p-6 border border-white/10 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-md rounded-[2rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="h-12 w-12 text-primary" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">
                      <ShieldAlert className="h-3 w-3" /> Anti-Duplicity Engine
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Cyber-Sentinel: Anti-Duplicidade</h3>
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Proteção Ativa</span>
                        <span className="text-sm font-bold text-primary">{formatCurrency(duplicateStats?.totalValue || 0)} economizados</span>
                      </div>
                      <div className="h-8 w-px bg-white/10 mx-2" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Bloqueios</span>
                        <span className="text-sm font-bold">{duplicateStats?.count || 0} tentativas</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Bloqueio automático de pagamentos duplicados e auditoria cyber-neural em tempo real.</p>
                    <div className="flex items-center gap-3 pt-2">
                      <Button asChild size="sm" className="rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Link to="/contas-pagar/bloqueios">Ver Auditoria</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="rounded-xl font-bold text-muted-foreground hover:text-primary">
                        <Link to="/configuracoes">Regras de Bloqueio</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="premium-card p-6 border border-white/10 bg-gradient-to-br from-blue-500/5 to-transparent backdrop-blur-md rounded-[2rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FileText className="h-12 w-12 text-blue-400" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                      <Download className="h-3 w-3" /> Conciliation Reports
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Relatórios & Conciliação</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">Exporte trilhas de auditoria completas em PDF/CSV para conciliações bancárias impecáveis.</p>
                    <div className="flex items-center gap-3 pt-2">
                      <Button asChild size="sm" variant="secondary" className="rounded-xl font-bold">
                        <Link to="/relatorios">Painel de Relatórios</Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-xl font-bold gap-2"
                        onClick={() => {
                          if (!auditLogs?.length) {
                            toast.error('Nenhum log para exportar');
                            return;
                          }
                          exportToCSV(auditLogs, [
                            { key: 'created_at', header: 'Data' },
                            { key: 'user_email', header: 'Usuário' },
                            { key: 'action', header: 'Ação' },
                            { key: 'table_name', header: 'Tabela' },
                            { key: 'details', header: 'Detalhes' }
                          ], 'audit_logs_executivo');
                          toast.success('Logs exportados com sucesso');
                        }}
                      >
                        <History className="h-3.5 w-3.5" /> Export Audit Logs
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

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
            <SectionDivider label="Quantum Forecasting & Neural Node Matrix" icon={Brain} />
            <div className="space-y-6">
              {renderWidget({ id: 'previsao-ia', title: 'Previsão IA', type: 'previsao-ia', visible: true, order: 0, size: 'lg' })}
              {renderWidget({ id: 'alertas-preditivos', title: 'Alertas Preditivos', type: 'kpi-vencidas', visible: true, order: 1, size: 'md' })}
              {renderWidget({ id: 'metas', title: 'Metas', type: 'kpi-saldo', visible: true, order: 2, size: 'md' })}
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
