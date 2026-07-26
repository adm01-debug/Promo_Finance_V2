import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, AlertTriangle, TrendingDown, Sparkles, RefreshCw, History as HistoryIcon } from 'lucide-react';
import { useSimulacaoRegimes } from '@/hooks/useSimulacaoRegimes';
import { useOportunidadesElisao } from '@/hooks/useOportunidadesElisao';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';
import type { RegimeTributario } from '@/lib/tributario';
import { baixarRelatorioPdf } from '@/lib/tributario/relatorio-pdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { SimulacaoHeaderActions } from '@/components/tributario/simulacao/SimulacaoHeaderActions';
import { ParametrosForm } from '@/components/tributario/simulacao/ParametrosForm';
import { AjustesParametrosAlert } from '@/components/tributario/simulacao/AjustesParametrosAlert';
import { diagnosticarParametros } from '@/lib/tributario/diagnostico-parametros';
import { ConfirmarSalvamentoAjustesDialog } from '@/components/tributario/simulacao/ConfirmarSalvamentoAjustesDialog';
import { CenarioDetalhes } from '@/components/tributario/simulacao/CenarioDetalhes';

export default function SimulacaoRegimes() {
  const navigate = useNavigate();
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();
  const [autoLoaded, setAutoLoaded] = useState(false);

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

  const corPorRegime = (r: RegimeTributario) =>
    r === 'simples_nacional' ? 'hsl(160 84% 39%)' : r === 'lucro_presumido' ? 'hsl(258 90% 66%)' : 'hsl(217 91% 60%)';

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
          <Card className="border-success/30 bg-gradient-to-br from-success/5 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <Award className="h-8 w-8 text-success" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Regime Recomendado</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-success">{resultado.recomendado.nome}</h2>
                    {isRecomendacaoIA && (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse">
                        <Sparkles className="h-3 w-3 mr-1" /> IA
                      </Badge>
                    )}
                    {resultado.fromCache && (
                      <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20">
                        Cached
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{resultado.justificativaIA || resultado.justificativa}</p>
                  {resultado.economiaAnualVsAtual !== undefined && resultado.economiaAnualVsAtual > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success">
                      <TrendingDown className="h-4 w-4" aria-hidden="true" />
                      <span className="font-semibold">
                        Economia: {formatCurrency(resultado.economiaAnualVsAtual)}/ano
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {resultado.alertas.length > 0 && (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1 mt-2">
                  {resultado.alertas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparativo de Carga Tributária</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="h-[220px]"
                role="img"
                aria-label="Gráfico de barras comparando carga tributária dos regimes elegíveis"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={130} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                      {dadosGrafico.map((d, i) => (
                        <Cell key={i} fill={corPorRegime(d.regime as RegimeTributario)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={resultado.recomendado.regime}>
            <TabsList className="grid w-full grid-cols-3">
              {resultado.cenarios.map((c) => (
                <TabsTrigger key={c.regime} value={c.regime} disabled={!c.elegivel}>
                  {c.nome}
                  {c.regime === resultado.recomendado.regime && (
                    <Sparkles className="h-3 w-3 ml-1 text-success" aria-hidden="true" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {resultado.cenarios.map((c) => (
              <TabsContent key={c.regime} value={c.regime}>
                <CenarioDetalhes cenario={c} />
              </TabsContent>
            ))}
          </Tabs>

          {historicoSimulacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Simulações Anteriores</CardTitle>
                <p className="text-xs text-muted-foreground">Motor tributário v{versaoMotor}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {resumoAuditoria.saudavel ? (
                    <Badge variant="outline" className="text-success border-success/40">
                      {resumoAuditoria.total} snapshot{resumoAuditoria.total > 1 ? 's' : ''} sem pendências
                    </Badge>
                  ) : (
                    <>
                      {resumoAuditoria.divergentes > 0 && (
                        <Badge variant="outline" className="text-warning border-warning/40">
                          {resumoAuditoria.divergentes} divergente{resumoAuditoria.divergentes > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {resumoAuditoria.motorDesatualizado > 0 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {resumoAuditoria.motorDesatualizado} com motor antigo
                        </Badge>
                      )}
                      {resumoAuditoria.comAjustes > 0 && (
                        <Badge
                          variant="outline"
                          className={
                            resumoAuditoria.comAjustesCriticos > 0
                              ? 'text-destructive border-destructive/40'
                              : 'text-warning border-warning/40'
                          }
                        >
                          {resumoAuditoria.comAjustes} com ajustes
                          {resumoAuditoria.comAjustesCriticos > 0
                            ? ` (${resumoAuditoria.comAjustesCriticos} crítico${resumoAuditoria.comAjustesCriticos > 1 ? 's' : ''})`
                            : ''}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {historicoSimulacoes.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 p-2 rounded border text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{h.regime_recomendado}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.data_simulacao).toLocaleString('pt-BR')}
                        {h.versao_motor ? ` · v${h.versao_motor}` : ' · versão não registrada'}
                      </p>
                      {h.divergente && h.regimeRecalculado && (
                        <p className="text-xs text-warning">
                          Recálculo atual indica {h.regimeRecalculado}
                        </p>
                      )}
                      {h.ajustesAplicados.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          Ajustes: {h.ajustesAplicados.map((a) => `${a.rotulo} ${a.informado}→${a.aplicado}`).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {h.ajustesAplicados.length > 0 && (
                        <Badge
                          variant="outline"
                          className={
                            h.ajustesAplicados.some((a) => a.severidade === 'critico')
                              ? 'text-destructive border-destructive/40'
                              : 'text-warning border-warning/40'
                          }
                          title={h.ajustesAplicados.map((a) => `${a.rotulo}: ${a.motivo}`).join('\n')}
                        >
                          {h.ajustesAplicados.length} ajuste{h.ajustesAplicados.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {h.divergente && (
                        <Badge variant="outline" className="text-warning border-warning/40">
                          Divergente
                        </Badge>
                      )}
                      {!h.divergente && h.motorDesatualizado && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Motor antigo
                        </Badge>
                      )}

                      {h.economia_anual_estimada !== null && h.economia_anual_estimada !== undefined && (
                        <Badge variant="outline" className="text-success">
                          {formatCurrency(Number(h.economia_anual_estimada))}/ano
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restaurarSimulacao(h)}
                        aria-label={`Restaurar simulação de ${new Date(h.data_simulacao).toLocaleString('pt-BR')}`}
                      >
                        <HistoryIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
