// ============================================
// DASHBOARD CONSOLIDADO TRIBUTÁRIO
// Painel unificado: regime, oportunidades, alertas, projeção, IRPFM
// ============================================

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calculator,
  Sparkles,
  TrendingUp,
  Bell,
  Award,
  ArrowRight,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useSimulacaoRegimes } from '@/hooks/useSimulacaoRegimes';
import { useOportunidadesElisao } from '@/hooks/useOportunidadesElisao';
import useAlertasTributarios from '@/hooks/useAlertasTributarios';
import { formatCurrency } from '@/lib/formatters';
import { projetarReforma } from '@/lib/tributario/projecao-reforma';

const REGIME_LABEL: Record<string, string> = {
  simples_nacional: 'Simples Nacional',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
};

export default function DashboardTributario() {
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();

  const { resultado, parametros } = useSimulacaoRegimes({ empresaId });
  const { relatorio: relatorioElisao, isLoading: isLoadingElisao } = useOportunidadesElisao({ empresaId });
  const { criticos = [], proximosVencimentos = [], isLoading: isLoadingAlertas } = useAlertasTributarios(empresaId);

  const projecao2026 = useMemo(() => {
    if (!parametros?.faturamentoAnual) return null;
    return projetarReforma({
      faturamentoAnual: parametros.faturamentoAnual,
      percentualServicos: parametros.percentualServicos ?? 50,
      pisCofinsAtual: 9.25,
      icmsAtual: 18,
      issAtual: 5,
    });
  }, [parametros]);

  const top3Oportunidades = (relatorioElisao?.oportunidades ?? [])
    .filter((o) => o.aplicavel)
    .slice(0, 3);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            Dashboard Tributário
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão consolidada: regime ideal, elisão fiscal, alertas e projeção 2026-2033.
          </p>
        </div>
        <div className="w-full md:w-72">
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger><SelectValue placeholder="Selecionar empresa" /></SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!empresaId && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Selecione uma empresa</AlertTitle>
          <AlertDescription>
            Escolha uma empresa para ver o panorama tributário consolidado.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Award className="h-4 w-4" /> Regime recomendado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resultado?.recomendado ? REGIME_LABEL[resultado.recomendado.regime] : '—'}
            </div>
            {resultado?.economiaAnualVsAtual && resultado.economiaAnualVsAtual > 0 && (
              <p className="text-xs text-success mt-1">
                Economia anual: {formatCurrency(resultado.economiaAnualVsAtual)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Oportunidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingElisao ? <Skeleton className="h-7 w-12" /> : (relatorioElisao?.oportunidades.filter((o) => o.aplicavel).length ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Economia potencial: {formatCurrency(relatorioElisao?.economia_total_estimada ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><Bell className="h-4 w-4" /> Alertas críticos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoadingAlertas ? <Skeleton className="h-7 w-12" /> : criticos.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{proximosVencimentos.length} vencimentos próximos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Carga 2026 (CBS/IBS)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projecao2026 ? `${projecao2026.projecoes[0].cargaEfetiva.toFixed(2)}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs atual: {projecao2026 ? `${projecao2026.cargaAtual.toFixed(2)}%` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Calculator className="h-5 w-5 text-primary" /> Simular Regimes</CardTitle>
            <CardDescription>Compare Simples, Presumido e Real.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/tributario/simulacao-regimes">Abrir simulador <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-5 w-5 text-primary" /> Elisão Fiscal</CardTitle>
            <CardDescription>9 estratégias com base legal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/tributario/oportunidades-elisao">Ver oportunidades <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-5 w-5 text-primary" /> Projeção 2026-2033</CardTitle>
            <CardDescription>Cronograma CBS/IBS ano a ano.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/tributario/projecao-reforma">Ver projeção <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 oportunidades */}
      {top3Oportunidades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 3 oportunidades de elisão</CardTitle>
            <CardDescription>Maior economia estimada anual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3Oportunidades.map((o) => (
              <div key={o.estrategia} className="flex items-start justify-between gap-4 p-3 rounded-lg border hover:bg-muted/30">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{o.nome}</h4>
                    <Badge variant={o.risco === 'baixo' ? 'secondary' : o.risco === 'medio' ? 'default' : 'destructive'}>
                      Risco {o.risco}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{o.justificativa}</p>
                  <p className="text-xs text-muted-foreground mt-1">{o.base_legal}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-success">{formatCurrency(o.economia_estimada)}</div>
                  <div className="text-xs text-muted-foreground">economia/ano</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alertas críticos */}
      {criticos.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Alertas tributários críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticos.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{a.titulo}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.mensagem}</p>
                </div>
                <Badge variant="destructive">{a.prioridade}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
