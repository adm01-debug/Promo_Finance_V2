// ============================================
// PÁGINA: Recomendação Executiva (FASE 3 - Roadmap)
// Resumo executivo do regime ótimo + 3 cenários ranqueados
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Award, TrendingDown, AlertTriangle, FileText, ArrowRight, CheckCircle2, Scale, Send, Loader2 } from 'lucide-react';
import { useSimulacaoRegimes } from '@/hooks/useSimulacaoRegimes';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useGerarPdfTributario, useEnviarBitrix24Tributario } from '@/hooks/usePdfTributario';
import { baixarRelatorioPdf } from '@/lib/tributario/relatorio-pdf';
import { toast } from 'sonner';
import type { RegimeTributario, ResultadoCenario } from '@/lib/tributario';

const REGIME_LABEL: Record<RegimeTributario, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
};

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const formatPct = (n: number) => `${n.toFixed(2)}%`;

export default function RecomendacaoExecutiva() {
  const navigate = useNavigate();
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();
  const { resultado, regimeAtual, setRegimeAtual, parametros, salvarSimulacao } =
    useSimulacaoRegimes({ empresaId });
  const gerarPdf = useGerarPdfTributario();
  const enviarBitrix = useEnviarBitrix24Tributario();

  const cenariosOrdenados: ResultadoCenario[] = [...resultado.cenarios]
    .filter((c) => c.elegivel)
    .sort((a, b) => a.totalTributos - b.totalTributos);

  const empresaSelecionada = empresas.find((e) => e.id === empresaId);

  const handleExportPDF = () => {
    try {
      baixarRelatorioPdf({
        empresaNome: empresaSelecionada?.razao_social ?? 'Empresa',
        cnpj: empresaSelecionada?.cnpj ?? undefined,
        parametros,
        decisao: resultado,
        regimeAtual,
        projetarReformaTimeline: true,
      });
      toast.success('Relatório PDF gerado');
    } catch (e) {
      toast.error('Falha ao gerar PDF: ' + (e as Error).message);
    }
  };

  return (
    <main id="main" className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-7 w-7 text-primary" aria-hidden />
            Recomendação Executiva
          </h1>
          <p className="text-muted-foreground mt-1">
            Resumo do regime tributário ótimo com base nos parâmetros e histórico da empresa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/tributario/simulacao-regimes')}>
            Ajustar parâmetros
          </Button>
          <Button onClick={handleExportPDF} aria-label="Exportar relatório em PDF">
            <FileText className="h-4 w-4 mr-2" aria-hidden />
            Exportar PDF
          </Button>
        </div>
      </header>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contexto da análise</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="empresa-select" className="text-sm font-medium mb-1.5 block">
              Empresa
            </label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger id="empresa-select">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {(empresas || []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="regime-atual" className="text-sm font-medium mb-1.5 block">
              Regime atual (para comparativo)
            </label>
            <Select
              value={regimeAtual ?? 'none'}
              onValueChange={(v) => setRegimeAtual(v === 'none' ? undefined : (v as RegimeTributario))}
            >
              <SelectTrigger id="regime-atual">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informado</SelectItem>
                <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                <SelectItem value="lucro_real">Lucro Real</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Card de Recomendação */}
      <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Badge variant="default" className="mb-2">Regime recomendado</Badge>
              <CardTitle className="text-3xl">{resultado.recomendado.nome}</CardTitle>
              <CardDescription className="mt-2 text-base">{resultado.justificativa}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Carga tributária estimada</p>
              <p className="text-3xl font-bold text-primary">
                {formatPct(resultado.recomendado.cargaEfetiva)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatBRL(resultado.recomendado.totalTributos)} / ano
              </p>
            </div>
          </div>
        </CardHeader>
        {resultado.economiaAnualVsAtual !== undefined && resultado.economiaAnualVsAtual > 0 && (
          <CardContent>
            <Alert className="border-success/40 bg-success/5">
              <TrendingDown className="h-4 w-4 text-success" aria-hidden />
              <AlertTitle>Economia potencial</AlertTitle>
              <AlertDescription>
                Migrar do regime atual ({REGIME_LABEL[regimeAtual!]}) para{' '}
                <strong>{resultado.recomendado.nome}</strong> geraria economia anual de{' '}
                <strong className="text-success">{formatBRL(resultado.economiaAnualVsAtual)}</strong>.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Alertas */}
      {resultado.alertas.length > 0 && (
        <div className="space-y-2">
          {resultado.alertas.map((alerta, i) => (
            <Alert key={i} variant="default">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              <AlertDescription>{alerta}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Ranking de Cenários */}
      <section aria-labelledby="ranking-heading">
        <h2 id="ranking-heading" className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Scale className="h-5 w-5" aria-hidden />
          Comparativo dos 3 regimes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resultado.cenarios.map((cenario) => {
            const posicao = cenariosOrdenados.findIndex((c) => c.regime === cenario.regime) + 1;
            const eRecomendado = cenario.regime === resultado.recomendado.regime;
            return (
              <Card
                key={cenario.regime}
                className={eRecomendado ? 'border-primary shadow-md' : undefined}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cenario.nome}</CardTitle>
                    {eRecomendado && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                        Ótimo
                      </Badge>
                    )}
                    {!eRecomendado && cenario.elegivel && posicao > 0 && (
                      <Badge variant="outline">#{posicao}</Badge>
                    )}
                    {!cenario.elegivel && <Badge variant="destructive">Inelegível</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cenario.elegivel ? (
                    <>
                      <div>
                        <p className="text-2xl font-bold">{formatBRL(cenario.totalTributos)}</p>
                        <p className="text-sm text-muted-foreground">
                          Carga efetiva: {formatPct(cenario.cargaEfetiva)}
                        </p>
                      </div>
                      <Separator />
                      <dl className="text-sm space-y-1">
                        {cenario.irpj > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">IRPJ</dt>
                            <dd>{formatBRL(cenario.irpj)}</dd>
                          </div>
                        )}
                        {cenario.csll > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">CSLL</dt>
                            <dd>{formatBRL(cenario.csll)}</dd>
                          </div>
                        )}
                        {(cenario.pis + cenario.cofins) > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">PIS/COFINS</dt>
                            <dd>{formatBRL(cenario.pis + cenario.cofins)}</dd>
                          </div>
                        )}
                        {cenario.cpp > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">CPP (INSS)</dt>
                            <dd>{formatBRL(cenario.cpp)}</dd>
                          </div>
                        )}
                        {cenario.icms > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">ICMS</dt>
                            <dd>{formatBRL(cenario.icms)}</dd>
                          </div>
                        )}
                        {cenario.iss > 0 && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">ISS</dt>
                            <dd>{formatBRL(cenario.iss)}</dd>
                          </div>
                        )}
                      </dl>
                      {cenario.anexoAplicavel && (
                        <p className="text-xs text-muted-foreground pt-2 border-t">
                          Anexo {cenario.anexoAplicavel}
                          {cenario.fatorR !== undefined && ` · Fator R: ${(cenario.fatorR * 100).toFixed(1)}%`}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {cenario.motivoInelegibilidade ?? 'Regime não aplicável aos parâmetros informados.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Próximos passos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos passos sugeridos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => navigate('/tributario/oportunidades-elisao')}
          >
            <span>Identificar oportunidades de elisão fiscal lícita</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => navigate('/tributario/projecao-reforma')}
          >
            <span>Simular impacto da Reforma Tributária (CBS + IBS)</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => salvarSimulacao.mutate()}
            disabled={!empresaId || salvarSimulacao.isPending}
          >
            <span>Salvar esta análise no histórico da empresa</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
