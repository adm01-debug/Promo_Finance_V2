// ============================================
// PÁGINA: Simulação Comparativa de Regimes Tributários
// Modularizada — sub-componentes em components/tributario/simulacao/
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, AlertTriangle, TrendingDown, Sparkles, Calculator, RefreshCw } from 'lucide-react';
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
    faturamentoMensal,
    folhaMensal,
  } = useSimulacaoRegimes({ empresaId });

  const { relatorio: relatorioElisao, persistirOportunidades } = useOportunidadesElisao({
    empresaId,
    contexto: {
      regime_atual:
        regimeAtual === 'lucro_real' ? 'real' : regimeAtual === 'lucro_presumido' ? 'presumido' : 'simples',
    },
  });

  const empresaSelecionada = empresas.find((e) => e.id === empresaId);

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
    const percentualServicos =
      faturamentoAnual > 0 ? (totalServicos / faturamentoAnual) * 100 : parametros.percentualServicos;

    setParametros({
      ...parametros,
      faturamentoAnual,
      folhaAnual,
      percentualServicos: Math.round(percentualServicos),
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
      elisao: relatorioElisao,
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

  const dadosGrafico = resultado.cenarios
    .filter((c) => c.elegivel)
    .map((c) => ({ name: c.nome, valor: c.totalTributos, regime: c.regime }));

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Calculator className="h-7 w-7 md:h-8 md:w-8 text-primary" aria-hidden="true" />
            Simulação de Regimes Tributários
          </h1>
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
          onSalvar={() => salvarSimulacao.mutate()}
          isAnalisandoElisao={persistirOportunidades.isPending}
          isSalvando={salvarSimulacao.isPending}
        />
      </div>

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
                  <h2 className="text-2xl md:text-3xl font-bold text-success">{resultado.recomendado.nome}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{resultado.justificativa}</p>
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
              </CardHeader>
              <CardContent className="space-y-2">
                {historicoSimulacoes.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <p className="font-medium">{h.regime_recomendado}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.data_simulacao).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {h.economia_anual_estimada && (
                      <Badge variant="outline" className="text-success">
                        {formatCurrency(Number(h.economia_anual_estimada))}/ano
                      </Badge>
                    )}
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
