// DASHBOARD REFORMA TRIBUTÁRIA
// Visão executiva para empresas Lucro Real

import { useState, useCallback, useEffect } from 'react';
import { AssistenteFechamentoMensal } from '@/components/tributario/dashboard/AssistenteFechamentoMensal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import useReformaTributaria, { normalizarEmpresaId } from '@/hooks/useReformaTributaria';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import useAlertasTributarios from '@/hooks/useAlertasTributarios';
import { useApuracoesTributarias } from '@/hooks/useApuracoesTributarias';
import { NavigationTributaria } from './NavigationTributaria';
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
import { itemVariants, containerVariants } from './DashboardReformaTributaria.helpers';
import { DashboardReformaTributariaHeaderWithGlobalEmpresa } from './DashboardReformaTributariaHeaderWithGlobalEmpresa';
import { DashboardReformaTributariaConteudo } from './DashboardReformaTributariaConteudo';
import { DashboardReformaVisaoGeral } from './DashboardReformaVisaoGeral';

export function DashboardReformaTributaria({ initialTab }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'visao-geral');
  const navigate = useNavigate();

  useEffect(() => {
    if (initialTab) {
      setActiveTab((prev) => (prev === initialTab ? prev : initialTab));
    }
  }, [initialTab]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);

      // Mapeamento de abas internas para rotas dedicadas (exposição P16)
      const routeMap: Record<string, string> = {
        'split-payment': '/tributario/split-payment',
        conciliacao: '/tributario/conciliacao',
        incentivos: '/tributario/incentivos',
        auditoria: '/tributario/auditoria',
        comparativo: '/tributario/comparativo',
        cashback: '/tributario/cashback',
        'importacao-xml': '/tributario/importacao-xml',
        exportacao: '/tributario/sped',
        relatorios: '/tributario/relatorios-contabeis',
        'per-dcomp': '/tributario/per-dcomp',
        retencoes: '/tributario/retencoes',
        'fechamento-mensal': '/tributario/fechamento-mensal',
        obrigacoes: '/tributario/obrigacoes',
      };

      if (routeMap[tabId]) {
        navigate(routeMap[tabId]);
      } else {
        navigate(`/reforma-tributaria/${tabId}`);
      }
    },
    [navigate]
  );
  const [empresaId, setEmpresaId] = useState<string>('all');
  const empresaIdFiltro = normalizarEmpresaId(empresaId);

  const {
    anoReferencia,
    setAnoReferencia,
    faseAtual,
    aliquotasAtuais,
    metricas,
    isLoadingMetricas,
  } = useReformaTributaria(empresaIdFiltro);

  // Dados reais
  const { data: empresas = [] } = useAllEmpresas();
  const { alertas: alertasData } = useAlertasTributarios(empresaIdFiltro);
  const { apuracoes } = useApuracoesTributarias(empresaIdFiltro);

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
    const meses = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    return apuracoes
      .sort((a, b) => a.mes - b.mes)
      .map((ap) => ({
        mes: meses[ap.mes - 1] || `M${ap.mes}`,
        cbsIbs: (Number(ap.cbs_a_pagar) || 0) + (Number(ap.ibs_a_pagar) || 0),
        antigosResidual:
          (Number(ap.icms_residual) || 0) +
          (Number(ap.iss_residual) || 0) +
          (Number(ap.pis_residual) || 0) +
          (Number(ap.cofins_residual) || 0),
      }));
  })();

  const dadosDistribuicaoTributos = [
    { name: 'CBS', value: metricas?.cbsSaldoAPagar || 0 },
    { name: 'IBS', value: metricas?.ibsSaldoAPagar || 0 },
    { name: 'Residuais', value: metricas?.tributosAntigosResidual || 0 },
  ];

  // Deep-linking: clicar em KPI muda aba
  const handleKPIClick = useCallback(
    (tabId: string) => {
      handleTabChange(tabId);
    },
    [handleTabChange]
  );

  // Verificar se é primeiro acesso (sem apurações e sem operações)
  const isFirstAccess = !isLoadingMetricas && !apuracoes?.length && !empresaIdFiltro;

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
              onPrimaryAction={() => handleTabChange('importacao-xml')}
              onSecondaryAction={() => handleTabChange('calculadora')}
            />
          );
        }
        return (
          <DashboardReformaVisaoGeral
            dadosComparativoMensal={dadosComparativoMensal}
            dadosDistribuicaoTributos={dadosDistribuicaoTributos}
            handleKPIClick={handleKPIClick}
            aliquotasAtuais={aliquotasAtuais}
          />
        );

      case 'apuracao':
        return <ApuracaoMensal />;
      case 'operacoes':
        return <OperacoesLista />;
      case 'creditos':
        return <GestorCreditosTributarios />;
      case 'calculadora':
        return <CalculadoraTributos />;
      case 'simulador':
        return <SimuladorCenariosTributarios />;
      case 'obrigacoes':
        return <ObrigacoesAcessorias />;
      case 'cronograma':
        return <CronogramaTransicao />;
      case 'irpj-csll':
        return <ModuloIRPJCSLL />;
      case 'retencoes':
        return <RetencoesFonte />;
      case 'exportacao':
        return <ExportacaoSPED />;
      case 'alertas':
        return <AlertasTributarios />;
      case 'relatorios':
        return <RelatoriosContabeisTributarios />;
      case 'metricas':
        return <DashboardMetricasTributarias />;
      case 'split-payment':
        return <SplitPaymentPanel />;
      case 'per-dcomp':
        return <PerDcompPanel />;
      case 'conciliacao':
        return <ConciliacaoTributariaPanel empresaId={empresaIdFiltro || 'default'} />;
      case 'incentivos':
        return <IncentivosFiscaisPanel empresaId={empresaIdFiltro || 'default'} />;
      case 'auditoria':
        return <AuditoriaCompliancePanel empresaId={empresaIdFiltro || 'default'} />;
      case 'comparativo':
        return <ComparativoRegimesPanel />;
      case 'cashback':
        return <CashbackSimuladorPanel />;
      case 'importacao-xml':
        return <ImportacaoXMLPanel empresaId={empresaIdFiltro || 'default'} />;
      case 'fechamento-mensal':
        return (
          <AssistenteFechamentoMensal
            empresaId={empresaIdFiltro || 'default'}
            ano={new Date().getFullYear()}
            mes={new Date().getMonth() + 1}
            isAdmin={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Global Empresa Selector */}
      <DashboardReformaTributariaHeaderWithGlobalEmpresa
        empresaId={empresaId}
        setEmpresaId={setEmpresaId}
        empresas={empresas}
        faseAtual={faseAtual}
        anoReferencia={anoReferencia}
        setAnoReferencia={setAnoReferencia}
      />

      {/* Navegação com badge de alertas */}
      <NavigationTributaria
        activeTab={activeTab}
        onTabChange={handleTabChange}
        alertasCriticos={alertasCriticos}
      />

      {/* Hero KPIs com deep-linking e alertas reais */}
      {activeTab === 'visao-geral' && !isFirstAccess && (
        <DashboardReformaTributariaConteudo
          metricas={metricas}
          aliquotasAtuais={aliquotasAtuais}
          alertasCriticos={alertasCriticos}
          handleKPIClick={handleKPIClick}
        />
      )}

      {/* Progresso da Migração */}
      {activeTab === 'visao-geral' && !isFirstAccess && (
        <motion.div variants={itemVariants}>
          <ProgressoMigracao percentual={metricas?.percentualMigracao || 0} fase={faseAtual} />
        </motion.div>
      )}

      {/* Conteúdo da Aba */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </motion.div>
  );
}

export default DashboardReformaTributaria;
