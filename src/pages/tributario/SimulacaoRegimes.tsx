import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useSimulacaoRegimes } from '@/hooks/useSimulacaoRegimes';
import { useOportunidadesElisao } from '@/hooks/useOportunidadesElisao';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { baixarRelatorioPdf } from '@/lib/tributario/relatorio-pdf';
import { toast } from 'sonner';
import { SimulacaoHeaderActions } from '@/components/tributario/simulacao/SimulacaoHeaderActions';
import { ParametrosForm } from '@/components/tributario/simulacao/ParametrosForm';
import { AjustesParametrosAlert } from '@/components/tributario/simulacao/AjustesParametrosAlert';
import { diagnosticarParametros } from '@/lib/tributario/diagnostico-parametros';
import { ConfirmarSalvamentoAjustesDialog } from '@/components/tributario/simulacao/ConfirmarSalvamentoAjustesDialog';
import {
  filtrarHistorico,
  montarLinhasAuditoriaCsv,
  ordenarHistorico,
  paginarHistorico,
} from '@/lib/tributario/historico-simulacao';
import type { OrdenacaoHistorico } from '@/lib/tributario/historico-simulacao';
import { exportToCSV } from '@/lib/export-utils';
import {
  RegimeRecomendadoCard,
  AlertasSimulacaoCard,
  ComparativoCargaCard,
  CenariosTabs,
  HistoricoSimulacoesCard,
} from './SimulacaoRegimes.parts';
import { COLUNAS_AUDITORIA } from './SimulacaoRegimes.helpers';

export default function SimulacaoRegimes() {
  const navigate = useNavigate();
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [somentePendencias, setSomentePendencias] = useState(false);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoHistorico>('data_desc');
  const [paginaHistorico, setPaginaHistorico] = useState(1);
  const TAMANHO_PAGINA_HISTORICO = 5;

  const {
    parametros,
    setParametros,
    regimeAtual,
    setRegimeAtual,
    resultado,
    salvarSimulacao,
    temHistoricoSuficiente,
    historicoSimulacoes,
    resumoAuditoria,
    restaurarSimulacao,
    versaoMotor,
    faturamentoMensal,
    folhaMensal,
    sincronizarComServer,
    isSincronizando,
    isRecomendacaoIA,
  } = useSimulacaoRegimes({ empresaId });

  const { relatorio: relatorioElisao, persistirOportunidades } = useOportunidadesElisao({
    empresaId,
    contexto: {
      regime_atual:
        regimeAtual === 'lucro_real' ? 'real' : regimeAtual === 'lucro_presumido' ? 'presumido' : 'simples',
    },
  });

  // Transparência fiscal: expõe todo ajuste automático aplicado aos parâmetros
  // pela camada de sanitização do motor, evitando cálculos silenciosamente corrigidos.
  const ajustesParametros = useMemo(() => diagnosticarParametros(parametros), [parametros]);

  // Histórico exibido: opcionalmente restrito aos snapshots que exigem atenção
  // e ordenado conforme o critério escolhido (helpers puros, sem mutação).
  const historicoVisivel = useMemo(
    () => ordenarHistorico(filtrarHistorico(historicoSimulacoes, somentePendencias), ordenacao),
    [historicoSimulacoes, somentePendencias, ordenacao],
  );

  // Volta ao início sempre que o recorte muda, evitando página órfã.
  useEffect(() => {
    setPaginaHistorico(1);
  }, [somentePendencias, ordenacao, empresaId]);


  // O clamp acontece no helper puro: se a lista encurtar, a página é ajustada.
  const pagina = useMemo(
    () => paginarHistorico(historicoVisivel, paginaHistorico, TAMANHO_PAGINA_HISTORICO),
    [historicoVisivel, paginaHistorico],
  );

  // Ajustes críticos exigem confirmação explícita antes de persistir o snapshot,
  // preservando a integridade auditável da base histórica de simulações.
  const ajustesCriticos = useMemo(
    () => ajustesParametros.filter((a) => a.severidade === 'critico'),
    [ajustesParametros],
  );
  const [confirmarSalvamento, setConfirmarSalvamento] = useState(false);

  const handleSalvar = () => {
    if (ajustesCriticos.length > 0) {
      setConfirmarSalvamento(true);
      return;
    }
    salvarSimulacao.mutate();
  };

  /**
   * Exporta a trilha de auditoria do histórico visível. Usa o mesmo recorte
   * exibido na tela (respeitando o filtro de pendências) para que o arquivo
   * seja fiel ao que o contador está analisando no momento.
   */
  const handleExportarAuditoria = () => {
    const linhas = montarLinhasAuditoriaCsv(historicoVisivel);
    if (linhas.length === 0) {
      toast.error('Nenhum snapshot para exportar.');
      return;
    }
    exportToCSV(linhas, COLUNAS_AUDITORIA, 'auditoria_simulacoes_regimes');
    toast.success(`Trilha exportada (${linhas.length} snapshot(s)).`);
  };



  const empresaSelecionada = useMemo(() => empresas.find((e) => e.id === empresaId), [empresas, empresaId]);

  // Carrega os parâmetros de folha cadastrados na empresa (CNAE, RAT/FAP e
  // terceiros). Valores nulos permanecem indefinidos para que o motor derive
  // a alíquota de terceiros a partir do CNAE.
  useEffect(() => {
    if (!empresaSelecionada) return;
    setParametros((atual) => ({
      ...atual,
      cnaePrincipal: empresaSelecionada.cnae_principal ?? atual.cnaePrincipal,
      aliquotaRAT:
        empresaSelecionada.aliquota_rat !== null && empresaSelecionada.aliquota_rat !== undefined
          ? Number(empresaSelecionada.aliquota_rat)
          : atual.aliquotaRAT,
      aliquotaTerceiros:
        empresaSelecionada.aliquota_terceiros !== null && empresaSelecionada.aliquota_terceiros !== undefined
          ? Number(empresaSelecionada.aliquota_terceiros)
          : atual.aliquotaTerceiros,
    }));
  }, [empresaSelecionada, setParametros]);

  /**
   * Lista de parâmetros de folha ausentes no cadastro da empresa. Quando algum
   * está ausente, o motor usa defaults genéricos (RAT 2%, Terceiros 5,8%), o que
   * pode distorcer a comparação de regimes com folha relevante (Anexo IV, Lucro
   * Presumido e Lucro Real).
   */
  const parametrosFolhaAusentes = useMemo(() => {
    if (!empresaSelecionada) return [] as string[];
    const faltando: string[] = [];
    if (!empresaSelecionada.cnae_principal) faltando.push('CNAE principal');
    if (empresaSelecionada.aliquota_rat === null || empresaSelecionada.aliquota_rat === undefined)
      faltando.push('Alíquota RAT/FAP');
    if (empresaSelecionada.aliquota_terceiros === null || empresaSelecionada.aliquota_terceiros === undefined)
      faltando.push('Alíquota de Terceiros');
    return faltando;
  }, [empresaSelecionada]);



  const popularDoHistorico = () => {
    if (faturamentoMensal.length === 0) {
      toast.error('Sem histórico de faturamento para esta empresa.');
      return;
    }
    const ultimos12 = faturamentoMensal.slice(0, 12);
    const ultimos12Folha = folhaMensal.slice(0, 12);
    const faturamentoAnual = ultimos12.reduce((s, m) => s + Number(m.receita_bruta || 0), 0);
    const totalServicos = ultimos12.reduce((s, m) => s + Number(m.receita_servicos || 0), 0);
    const folhaAnual = ultimos12Folha.reduce((s, m) => s + Number(m.total_folha || 0), 0);
    const totalIndustria = ultimos12.reduce((s, m) => s + Number(m.receita_industria || 0), 0);
    const totalRevenda = ultimos12.reduce((s, m) => s + Number(m.receita_revenda || 0), 0);
    const percentualServicos =
      faturamentoAnual > 0 ? (totalServicos / faturamentoAnual) * 100 : parametros.percentualServicos;
    const percentualIndustria =
      faturamentoAnual > 0 ? (totalIndustria / faturamentoAnual) * 100 : (parametros.percentualIndustria ?? 0);
    const percentualRevenda =
      faturamentoAnual > 0
        ? (totalRevenda > 0
            ? (totalRevenda / faturamentoAnual) * 100
            : Math.max(0, 100 - percentualServicos - percentualIndustria))
        : (parametros.percentualRevenda ?? 0);

    setParametros({
      ...parametros,
      faturamentoAnual,
      folhaAnual,
      percentualServicos: Math.round(percentualServicos),
      percentualIndustria: Math.round(percentualIndustria),
      percentualRevenda: Math.round(percentualRevenda),
    });
    setAutoLoaded(true);
    toast.success(`Parâmetros carregados de ${ultimos12.length} meses de histórico.`);
  };

  useEffect(() => {
    if (!empresaId) return;
    setAutoLoaded(false);
  }, [empresaId]);

  useEffect(() => {
    if (empresaId && !autoLoaded && faturamentoMensal.length >= 6) {
      popularDoHistorico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, faturamentoMensal.length, folhaMensal.length]);

  const exportarPdf = () => {
    baixarRelatorioPdf({
      empresaNome: empresaSelecionada?.razao_social ?? 'Empresa',
      cnpj: empresaSelecionada?.cnpj ?? undefined,
      parametros,
      decisao: resultado,
      elisao: relatorioElisao || undefined,
      regimeAtual,
      projetarReformaTimeline: true,
    });
  };

  const analisarElisao = async () => {
    if (!empresaId) {
      toast.error('Selecione uma empresa.');
      return;
    }
    try {
      await persistirOportunidades.mutateAsync();
      navigate('/tributario/oportunidades-elisao');
    } catch {
      // toast já tratado
    }
  };

  const dadosGrafico = useMemo(() =>
    resultado.cenarios
      .filter((c) => c.elegivel)
      .map((c) => ({ name: c.nome, valor: c.totalTributos, regime: c.regime })),
    [resultado.cenarios]
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">
              Simulação de Regimes Tributários
            </h1>
            {isSincronizando && (
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Compare Simples Nacional, Lucro Presumido e Lucro Real e descubra o regime mais vantajoso.
          </p>
        </div>
        <SimulacaoHeaderActions
          empresaId={empresaId}
          faturamentoCount={faturamentoMensal.length}
          onRecarregarHistorico={popularDoHistorico}
          onAnalisarElisao={analisarElisao}
          onExportarPdf={exportarPdf}
          onSalvar={handleSalvar}
          onSincronizarIA={sincronizarComServer}
          isAnalisandoElisao={persistirOportunidades.isPending}
          isSalvando={salvarSimulacao.isPending}
          isSincronizando={isSincronizando}
        />
      </div>

      <ConfirmarSalvamentoAjustesDialog
        open={confirmarSalvamento}
        onOpenChange={setConfirmarSalvamento}
        ajustesCriticos={ajustesCriticos}
        onConfirmar={() => {
          setConfirmarSalvamento(false);
          salvarSimulacao.mutate();
        }}
      />


      {empresaId && autoLoaded && (
        <Alert role="status" aria-live="polite">
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Dados carregados automaticamente</AlertTitle>
          <AlertDescription>
            Parâmetros preenchidos com base nos últimos {Math.min(faturamentoMensal.length, 12)} meses de histórico.
            Você pode ajustar manualmente os valores abaixo.
          </AlertDescription>
        </Alert>
      )}

      {empresaId && parametrosFolhaAusentes.length > 0 && (
        <Alert variant="default" role="status" aria-live="polite">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Parâmetros de folha incompletos</AlertTitle>
          <AlertDescription>
            A empresa selecionada não possui {parametrosFolhaAusentes.join(', ')} no cadastro. A simulação usará
            valores padrão (RAT 2% e Terceiros 5,8%), o que pode distorcer os encargos patronais. Preencha em{' '}
            <Link to="/empresas" className="font-medium underline underline-offset-4">
              Cadastro de Empresas
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}



      <AjustesParametrosAlert ajustes={ajustesParametros} />

      <div className="grid gap-6 lg:grid-cols-3">
        <ParametrosForm
          empresas={empresas}
          empresaId={empresaId}
          setEmpresaId={setEmpresaId}
          regimeAtual={regimeAtual}
          setRegimeAtual={setRegimeAtual}
          parametros={parametros}
          setParametros={setParametros}
          temHistoricoSuficiente={temHistoricoSuficiente}
        />

        <div className="lg:col-span-2 space-y-4">
          <RegimeRecomendadoCard resultado={resultado} isRecomendacaoIA={isRecomendacaoIA} />

          {resultado.alertas.length > 0 && (
            <AlertasSimulacaoCard alertas={resultado.alertas} />
          )}

          <ComparativoCargaCard dadosGrafico={dadosGrafico} />

          <CenariosTabs resultado={resultado} />

          {historicoSimulacoes.length > 0 && (
            <HistoricoSimulacoesCard
              historicoVisivel={historicoVisivel}
              pagina={pagina}
              resumoAuditoria={resumoAuditoria}
              versaoMotor={versaoMotor}
              somentePendencias={somentePendencias}
              onSomentePendenciasChange={setSomentePendencias}
              ordenacao={ordenacao}
              onOrdenacaoChange={setOrdenacao}
              onExportarAuditoria={handleExportarAuditoria}
              onRestaurar={restaurarSimulacao}
              onPaginaChange={setPaginaHistorico}
            />
          )}

        </div>
      </div>
    </div>
  );
}
