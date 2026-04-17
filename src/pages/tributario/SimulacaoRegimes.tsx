// ============================================
// PÁGINA: Simulação Comparativa de Regimes Tributários
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, AlertTriangle, Save, TrendingDown, Sparkles, Calculator, FileDown } from 'lucide-react';
import { useSimulacaoRegimes } from '@/hooks/useSimulacaoRegimes';
import { useOportunidadesElisao } from '@/hooks/useOportunidadesElisao';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';
import type { RegimeTributario, ResultadoCenario } from '@/lib/tributario';
import { baixarRelatorioPdf } from '@/lib/tributario/relatorio-pdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';

export default function SimulacaoRegimes() {
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();

  const {
    parametros,
    setParametros,
    regimeAtual,
    setRegimeAtual,
    resultado,
    salvarSimulacao,
    temHistoricoSuficiente,
    historicoSimulacoes,
  } = useSimulacaoRegimes({ empresaId });

  const corPorRegime = (r: RegimeTributario) =>
    r === 'simples_nacional' ? 'hsl(160 84% 39%)' : r === 'lucro_presumido' ? 'hsl(258 90% 66%)' : 'hsl(217 91% 60%)';

  const dadosGrafico = resultado.cenarios
    .filter((c) => c.elegivel)
    .map((c) => ({ name: c.nome, valor: c.totalTributos, regime: c.regime }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            Simulação de Regimes Tributários
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare Simples Nacional, Lucro Presumido e Lucro Real e descubra o regime mais vantajoso.
          </p>
        </div>
        <Button onClick={() => salvarSimulacao.mutate()} disabled={!empresaId || salvarSimulacao.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Simulação
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna 1: Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros</CardTitle>
            <CardDescription>Empresa e dados financeiros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {empresaId && !temHistoricoSuficiente && (
                <p className="text-xs text-warning">
                  ⚠️ Sem 12 meses de histórico — usando estimativa.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Regime Atual (opcional)</Label>
              <Select value={regimeAtual} onValueChange={(v) => setRegimeAtual(v as RegimeTributario)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="lucro_real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Faturamento Anual</Label>
              <Input
                type="number"
                value={parametros.faturamentoAnual}
                onChange={(e) => setParametros({ ...parametros, faturamentoAnual: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Margem (%)</Label>
                <Input
                  type="number"
                  value={parametros.margemLucro}
                  onChange={(e) => setParametros({ ...parametros, margemLucro: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>% Serviços</Label>
                <Input
                  type="number"
                  value={parametros.percentualServicos}
                  onChange={(e) => setParametros({ ...parametros, percentualServicos: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Folha Anual</Label>
              <Input
                type="number"
                value={parametros.folhaAnual || 0}
                onChange={(e) => setParametros({ ...parametros, folhaAnual: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Compras com Crédito (PIS/COFINS/ICMS)</Label>
              <Input
                type="number"
                value={parametros.comprasComCredito || 0}
                onChange={(e) => setParametros({ ...parametros, comprasComCredito: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Despesas Operacionais</Label>
              <Input
                type="number"
                value={parametros.despesasOperacionais || 0}
                onChange={(e) => setParametros({ ...parametros, despesasOperacionais: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Colunas 2-3: Resultado */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recomendação destacada */}
          <Card className="border-success/30 bg-gradient-to-br from-success/5 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <Award className="h-8 w-8 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Regime Recomendado</p>
                  <h2 className="text-3xl font-bold text-success">{resultado.recomendado.nome}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{resultado.justificativa}</p>
                  {resultado.economiaAnualVsAtual !== undefined && resultado.economiaAnualVsAtual > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-semibold">
                        Economia: {formatCurrency(resultado.economiaAnualVsAtual)}/ano
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
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

          {/* Gráfico comparativo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparativo de Carga Tributária</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
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

          {/* Detalhes por regime */}
          <Tabs defaultValue={resultado.recomendado.regime}>
            <TabsList className="grid w-full grid-cols-3">
              {resultado.cenarios.map((c) => (
                <TabsTrigger key={c.regime} value={c.regime} disabled={!c.elegivel}>
                  {c.nome}
                  {c.regime === resultado.recomendado.regime && <Sparkles className="h-3 w-3 ml-1 text-success" />}
                </TabsTrigger>
              ))}
            </TabsList>
            {resultado.cenarios.map((c) => (
              <TabsContent key={c.regime} value={c.regime}>
                <CenarioDetalhes cenario={c} />
              </TabsContent>
            ))}
          </Tabs>

          {/* Histórico */}
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

function CenarioDetalhes({ cenario }: { cenario: ResultadoCenario }) {
  if (!cenario.elegivel) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Regime não elegível</AlertTitle>
            <AlertDescription>{cenario.motivoInelegibilidade}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const linhas = [
    { label: 'IRPJ', valor: cenario.irpj },
    { label: 'CSLL', valor: cenario.csll },
    { label: 'PIS', valor: cenario.pis },
    { label: 'COFINS', valor: cenario.cofins },
    { label: 'CPP (INSS)', valor: cenario.cpp },
    { label: 'ICMS', valor: cenario.icms },
    { label: 'ISS', valor: cenario.iss },
  ].filter((l) => l.valor > 0);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {linhas.map((l) => (
            <div key={l.label} className="p-3 rounded bg-muted/50">
              <p className="text-xs text-muted-foreground">{l.label}</p>
              <p className="text-lg font-semibold">{formatCurrency(l.valor)}</p>
            </div>
          ))}
          <div className="p-3 rounded bg-primary/10 md:col-span-2">
            <p className="text-xs text-muted-foreground">Total Anual</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(cenario.totalTributos)}</p>
            <p className="text-xs">Carga efetiva: {cenario.cargaEfetiva.toFixed(2)}%</p>
          </div>
        </div>

        {(cenario.anexoAplicavel || cenario.faixaAplicavel) && (
          <div className="flex gap-2 flex-wrap">
            {cenario.anexoAplicavel && <Badge variant="outline">Anexo {cenario.anexoAplicavel}</Badge>}
            {cenario.faixaAplicavel && <Badge variant="outline">Faixa {cenario.faixaAplicavel}</Badge>}
            {cenario.fatorR !== undefined && (
              <Badge variant="outline">Fator R: {(cenario.fatorR * 100).toFixed(2)}%</Badge>
            )}
            {cenario.aliquotaNominal !== undefined && (
              <Badge variant="outline">Alíq. nominal: {cenario.aliquotaNominal.toFixed(2)}%</Badge>
            )}
          </div>
        )}

        {cenario.observacoes.length > 0 && (
          <div className="text-sm space-y-1 p-3 rounded bg-muted/30">
            <p className="font-medium">Observações:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              {cenario.observacoes.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
