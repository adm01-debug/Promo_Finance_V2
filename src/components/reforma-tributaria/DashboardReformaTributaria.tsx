// ============================================
// DASHBOARD REFORMA TRIBUTÁRIA
// Visão executiva para empresas Lucro Real
// ============================================

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Receipt, Landmark, AlertTriangle, CheckCircle2, Building2 } from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import useReformaTributaria from '@/hooks/useReformaTributaria';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import useAlertasTributarios from '@/hooks/useAlertasTributarios';
import { useApuracoesTributarias } from '@/hooks/useApuracoesTributarias';
import { formatCurrency } from '@/lib/formatters';

// Componentes internos
import { NavigationTributaria } from './NavigationTributaria';
import { HeroKPIs } from './HeroKPIs';
import { ProgressoMigracao } from './ProgressoMigracao';
import { SimuladorCenariosTributarios } from './SimuladorCenariosTributarios';
import { CronogramaTransicao } from './CronogramaTransicao';
import { CalculadoraTributos } from './CalculadoraTributos';
import { GestorCreditosTributarios } from './GestorCreditosTributarios';
import { ApuracaoMensal } from './ApuracaoMensal';
import { OperacoesLista } from './OperacoesLista';
import { ModuloIRPJCSLL } from './ModuloIRPJCSLL';
import { ObrigacoesAcessorias } from './ObrigacoesAcessorias';
import { RetencoesFonte } from './RetencoesFonte';
import { ExportacaoSPED } from './ExportacaoSPED';
import { AlertasTributarios } from './AlertasTributarios';
import { RelatoriosContabeisTributarios } from './RelatoriosContabeisTributarios';
import { DashboardMetricasTributarias } from './DashboardMetricasTributarias';
import { SplitPaymentPanel } from './SplitPaymentPanel';
import { PerDcompPanel } from './PerDcompPanel';
import { ConciliacaoTributariaPanel } from './ConciliacaoTributariaPanel';
import { IncentivosFiscaisPanel } from './IncentivosFiscaisPanel';
import { AuditoriaCompliancePanel } from './AuditoriaCompliancePanel';
import { ComparativoRegimesPanel } from './ComparativoRegimesPanel';
import { CashbackSimuladorPanel } from './CashbackSimuladorPanel';
import { ImportacaoXMLPanel } from './ImportacaoXMLPanel';
import { EmptyStateTributario } from './EmptyStateTributario';
import { GlossarioTooltip } from './GlossarioTooltip';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--muted-foreground))'];

export function DashboardReformaTributaria() {
  const {
    anoReferencia, setAnoReferencia, faseAtual, aliquotasAtuais,
    metricas, isLoadingMetricas,
  } = useReformaTributaria();

  const [activeTab, setActiveTab] = useState('visao-geral');
  const [empresaId, setEmpresaId] = useState<string>('');

  // Dados reais
  const { data: empresas = [] } = useAllEmpresas();
  const { alertas: alertasData } = useAlertasTributarios(empresaId || undefined);
  const { apuracoes } = useApuracoesTributarias(empresaId || undefined);

  // Contagem real de alertas críticos
  const alertasCriticos = (alertasData || []).filter(
    (a: { prioridade: string; resolvido: boolean }) => 
      (a.prioridade === 'critica' || a.prioridade === 'alta') && !a.resolvido
  ).length;

  // Dados REAIS para gráfico de evolução (baseado em apurações)
  const dadosComparativoMensal = (() => {
    if (!apuracoes || apuracoes.length === 0) {
      return [
        { mes: 'Jan', cbsIbs: 0, antigosResidual: 0 },
        { mes: 'Fev', cbsIbs: 0, antigosResidual: 0 },
        { mes: 'Mar', cbsIbs: 0, antigosResidual: 0 },
      ];
    }
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return apuracoes
      .sort((a, b) => a.mes - b.mes)
      .map(ap => ({
        mes: meses[ap.mes - 1] || `M${ap.mes}`,
        cbsIbs: (Number(ap.cbs_a_pagar) || 0) + (Number(ap.ibs_a_pagar) || 0),
        antigosResidual: (Number(ap.icms_residual) || 0) + (Number(ap.iss_residual) || 0) +
          (Number(ap.pis_residual) || 0) + (Number(ap.cofins_residual) || 0),
      }));
  })();

  const dadosDistribuicaoTributos = [
    { name: 'CBS', value: metricas?.cbsSaldoAPagar || 0 },
    { name: 'IBS', value: metricas?.ibsSaldoAPagar || 0 },
    { name: 'Residuais', value: metricas?.tributosAntigosResidual || 0 },
  ];

  // Deep-linking: clicar em KPI muda aba
  const handleKPIClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Verificar se é primeiro acesso (sem apurações e sem operações)
  const isFirstAccess = !isLoadingMetricas && !apuracoes?.length && !empresaId;

  if (isLoadingMetricas) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'visao-geral':
        if (isFirstAccess) {
          return (
            <EmptyStateTributario
              type="onboarding"
              onPrimaryAction={() => setActiveTab('importacao-xml')}
              onSecondaryAction={() => setActiveTab('calculadora')}
            />
          );
        }
        return (
          <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6">
            {/* Gráficos */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base">Evolução Tributária</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    <GlossarioTooltip termo="CBS">CBS</GlossarioTooltip>/<GlossarioTooltip termo="IBS">IBS</GlossarioTooltip> vs residuais
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[200px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dadosComparativoMensal}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" dataKey="cbsIbs" name="CBS + IBS" stackId="1"
                          stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="antigosResidual" name="Residuais" stackId="1"
                          stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-sm sm:text-base">Distribuição dos Tributos</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Composição atual</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[200px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dadosDistribuicaoTributos} cx="50%" cy="50%" labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius="70%" dataKey="value">
                          {dadosDistribuicaoTributos.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cards de Alíquotas com Glossário */}
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
              <Card className="border-primary/20 bg-primary/5 hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => handleKPIClick('apuracao')}>
                <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2">
                    <Receipt className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <GlossarioTooltip termo="CBS" showIcon={false}>CBS</GlossarioTooltip>
                    <span className="hidden md:inline truncate">- Contribuição Federal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-primary">{aliquotasAtuais.cbs}%</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
                    Substitui PIS e COFINS
                  </p>
                </CardContent>
              </Card>

              <Card className="border-success/20 bg-success/5 hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => handleKPIClick('apuracao')}>
                <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2">
                    <Landmark className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <GlossarioTooltip termo="IBS" showIcon={false}>IBS</GlossarioTooltip>
                    <span className="hidden md:inline truncate">- Est/Municipal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-success">{aliquotasAtuais.ibs}%</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
                    Substitui ICMS e ISS
                  </p>
                </CardContent>
              </Card>

              <Card className="border-warning/20 bg-warning/5 hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => handleKPIClick('simulador')}>
                <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <GlossarioTooltip termo="IS" showIcon={false}>IS</GlossarioTooltip>
                    <span className="hidden md:inline truncate">- Seletivo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="text-lg sm:text-2xl md:text-3xl font-bold text-warning">Var.</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
                    Produtos nocivos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Destaques com Glossário */}
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: 'Não-Cumulatividade Plena', desc: 'Crédito amplo em todas as aquisições', termo: 'Não-Cumulatividade', tab: 'creditos' },
                { label: 'Destino', desc: 'Tributo no local de consumo', tab: 'calculadora' },
                { label: 'Split Payment', desc: 'Recolhimento automático na transação', termo: 'Split Payment', tab: 'split-payment' },
                { label: 'Cashback', desc: 'Devolução para famílias de baixa renda', termo: 'Cashback', tab: 'cashback' },
              ].map((item, i) => (
                <Card key={i} className="hover:shadow-md transition-all cursor-pointer" onClick={() => handleKPIClick(item.tab)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        {item.termo ? (
                          <GlossarioTooltip termo={item.termo} showIcon={false}>
                            <p className="font-medium text-sm">{item.label}</p>
                          </GlossarioTooltip>
                        ) : (
                          <p className="font-medium text-sm">{item.label}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        );

      case 'apuracao': return <ApuracaoMensal />;
      case 'operacoes': return <OperacoesLista />;
      case 'creditos': return <GestorCreditosTributarios />;
      case 'calculadora': return <CalculadoraTributos />;
      case 'simulador': return <SimuladorCenariosTributarios />;
      case 'obrigacoes': return <ObrigacoesAcessorias />;
      case 'cronograma': return <CronogramaTransicao />;
      case 'irpj-csll': return <ModuloIRPJCSLL />;
      case 'retencoes': return <RetencoesFonte />;
      case 'exportacao': return <ExportacaoSPED />;
      case 'alertas': return <AlertasTributarios />;
      case 'relatorios': return <RelatoriosContabeisTributarios />;
      case 'metricas': return <DashboardMetricasTributarias />;
      case 'split-payment': return <SplitPaymentPanel />;
      case 'per-dcomp': return <PerDcompPanel />;
      case 'conciliacao': return <ConciliacaoTributariaPanel empresaId={empresaId || 'default'} />;
      case 'incentivos': return <IncentivosFiscaisPanel empresaId={empresaId || 'default'} />;
      case 'auditoria': return <AuditoriaCompliancePanel empresaId={empresaId || 'default'} />;
      case 'comparativo': return <ComparativoRegimesPanel />;
      case 'cashback': return <CashbackSimuladorPanel />;
      case 'importacao-xml': return <ImportacaoXMLPanel empresaId={empresaId || 'default'} />;
      default: return null;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header with Global Empresa Selector */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
              Reforma Tributária
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              Gestão contábil - LC 214/2025
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
            {/* Seletor de Empresa Global */}
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-36 sm:w-48 h-8 sm:h-10 text-xs sm:text-sm">
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <SelectValue placeholder="Todas empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Empresas</SelectItem>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.razao_social || emp.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline" className="px-2 sm:px-4 py-1 sm:py-2 text-xs whitespace-nowrap">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Fase: </span>
              {faseAtual.replace('_', ' ').toUpperCase()}
            </Badge>
            
            <Select value={String(anoReferencia)} onValueChange={(v) => setAnoReferencia(Number(v))}>
              <SelectTrigger className="w-20 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map((ano) => (
                  <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Navegação com badge de alertas */}
      <NavigationTributaria activeTab={activeTab} onTabChange={setActiveTab} alertasCriticos={alertasCriticos} />

      {/* Hero KPIs com deep-linking e alertas reais */}
      {activeTab === 'visao-geral' && !isFirstAccess && (
        <motion.div variants={itemVariants}>
          <HeroKPIs
            cargaTributaria={metricas?.cargaTributariaEfetiva || 0}
            cbsSaldo={metricas?.cbsSaldoAPagar || 0}
            ibsSaldo={metricas?.ibsSaldoAPagar || 0}
            creditosDisponiveis={metricas?.creditosDisponiveis || 0}
            creditosUtilizados={metricas?.creditosUtilizados || 0}
            creditosAcumulados={metricas?.creditosAcumulados || 0}
            percentualMigracao={metricas?.percentualMigracao || 0}
            aliquotaCbs={aliquotasAtuais.cbs}
            aliquotaIbs={aliquotasAtuais.ibs}
            alertasCriticos={alertasCriticos}
            onKPIClick={handleKPIClick}
          />
        </motion.div>
      )}

      {/* Progresso da Migração */}
      {activeTab === 'visao-geral' && !isFirstAccess && (
        <motion.div variants={itemVariants}>
          <ProgressoMigracao percentual={metricas?.percentualMigracao || 0} fase={faseAtual} />
        </motion.div>
      )}

      {/* Conteúdo da Aba */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {renderContent()}
      </motion.div>
    </motion.div>
  );
}

export default DashboardReformaTributaria;
