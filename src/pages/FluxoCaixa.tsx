import { motion } from 'framer-motion';
import { Settings2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { QuickDateFilters } from '@/components/ui/quick-date-filters';
import { CenarioSelector } from '@/components/fluxo-caixa/CenarioSelector';
import { AlertasRuptura } from '@/components/fluxo-caixa/AlertasRuptura';
import { GraficoCenarios } from '@/components/fluxo-caixa/GraficoCenarios';
import { ResumosCenarios } from '@/components/fluxo-caixa/ResumosCenarios';
import { IndicadorCobertura } from '@/components/fluxo-caixa/IndicadorCobertura';
import { SimulacaoMonteCarlo } from '@/components/fluxo-caixa/SimulacaoMonteCarlo';
import { InsightsFluxoIA } from '@/components/fluxo-caixa/InsightsFluxoIA';
import { SimuladorAntecipacao } from '@/components/simuladores/SimuladorAntecipacao';
import { FluxoCaixaHeader } from '@/components/fluxo-caixa/FluxoCaixaHeader';
import { FluxoCaixaKPIs } from '@/components/fluxo-caixa/FluxoCaixaKPIs';
import { FluxoCaixaBarChart } from '@/components/fluxo-caixa/FluxoCaixaBarChart';
import { ProjecaoDiariaGrid } from '@/components/fluxo-caixa/ProjecaoDiariaGrid';
import { useFluxoCaixaPage } from '@/hooks/useFluxoCaixaPage';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

export default function FluxoCaixa() {
  const {
    periodo,
    setPeriodo,
    cenarioAtivo,
    setCenarioAtivo,
    filterType,
    handleFilterChange,
    kpis,
    projecoes,
    metricasCenarios,
    alertas,
    dadosCenarioAtivo,
    metricaAtiva,
    totalReceitas,
    totalDespesas,
    saldoFinal,
    saldoInicial,
    variacao,
    barData,
    dias,
    isLoading,
    loadingKpis,
    loadingFluxo,
    handleDismissAlerta,
    handleVerDetalhesAlerta,
    handleRefresh,
  } = useFluxoCaixaPage();

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <FluxoCaixaHeader
          periodo={periodo}
          onPeriodoChange={setPeriodo}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          dadosCenarioAtivo={dadosCenarioAtivo}
          cenarioAtivo={cenarioAtivo}
        />

        <motion.div variants={itemVariants}>
          <QuickDateFilters
            value={filterType}
            onChange={handleFilterChange}
            extended
          />
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CenarioSelector 
            cenarioAtivo={cenarioAtivo} 
            onCenarioChange={setCenarioAtivo}
            metricas={metricasCenarios}
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings2 className="h-4 w-4" />
            <span>Limites: Ruptura R$ 0 | Risco R$ 50K</span>
          </div>
        </motion.div>

        <FluxoCaixaKPIs
          saldoAtual={kpis?.saldoTotal || 0}
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
          saldoFinal={saldoFinal}
          variacao={variacao}
          diasCriticos={metricaAtiva?.diasCriticos || 0}
          cenarioAtivo={cenarioAtivo}
          loadingKpis={loadingKpis}
          loadingFluxo={loadingFluxo}
        />

        <motion.div variants={itemVariants}>
          <ResumosCenarios 
            metricas={metricasCenarios}
            saldoAtual={kpis?.saldoTotal || 0}
            cenarioAtivo={cenarioAtivo}
            onCenarioClick={setCenarioAtivo}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            {isLoading ? (
              <Card className="card-elevated h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </Card>
            ) : (
              <GraficoCenarios 
                projecoes={projecoes}
                cenarioDestaque={cenarioAtivo}
                limiteRuptura={0}
                limiteRiscoAlto={50000}
              />
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <AlertasRuptura 
              alertas={alertas}
              onDismiss={handleDismissAlerta}
              onVerDetalhes={handleVerDetalhesAlerta}
            />
          </motion.div>
        </div>

        <FluxoCaixaBarChart
          barData={barData}
          cenarioAtivo={cenarioAtivo}
          isLoading={isLoading}
        />

        <ProjecaoDiariaGrid
          dados={dadosCenarioAtivo}
          cenarioAtivo={cenarioAtivo}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants}>
            <IndicadorCobertura 
              saldoAtual={kpis?.saldoTotal || 0}
              despesaMediaDiaria={totalDespesas / dias}
              isLoading={loadingKpis}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <SimulacaoMonteCarlo
              projecoes={dadosCenarioAtivo}
              saldoInicial={saldoInicial}
              isLoading={loadingFluxo}
            />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <InsightsFluxoIA
            projecoes={dadosCenarioAtivo}
            saldoAtual={kpis?.saldoTotal || 0}
            cenarioAtivo={cenarioAtivo}
            diasCobertura={Math.floor((kpis?.saldoTotal || 0) / (totalDespesas / dias || 1))}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <SimuladorAntecipacao />
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
