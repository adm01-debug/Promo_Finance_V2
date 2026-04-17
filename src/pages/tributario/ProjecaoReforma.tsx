// ============================================
// PÁGINA: Projeção Reforma Tributária 2026-2033
// ============================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, ScrollText } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { projetarReforma, type ParametrosProjecao } from '@/lib/tributario/projecao-reforma';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

const SETORES: Array<{ value: NonNullable<ParametrosProjecao['setor']>; label: string }> = [
  { value: 'geral', label: 'Geral / Comércio comum' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'comercio', label: 'Comércio' },
  { value: 'industria', label: 'Indústria' },
  { value: 'saude', label: 'Saúde (redução 60%)' },
  { value: 'educacao', label: 'Educação (redução 60%)' },
  { value: 'agro', label: 'Agronegócio (redução 60%)' },
];

export default function ProjecaoReforma() {
  const [params, setParams] = useState<ParametrosProjecao>({
    faturamentoAnual: 1_200_000,
    percentualServicos: 60,
    percentualComercio: 40,
    pisCofinsAtual: 9.25,
    icmsAtual: 18,
    issAtual: 5,
    setor: 'geral',
  });

  const projecao = useMemo(() => projetarReforma(params), [params]);

  const dadosGrafico = projecao.projecoes.map((p) => ({
    ano: p.ano,
    'Carga Atual': Number(projecao.cargaAtual.toFixed(2)),
    'Carga Projetada': Number(p.cargaEfetiva.toFixed(2)),
    CBS: Number(((p.cbs / p.faturamento) * 100).toFixed(2)),
    IBS: Number(((p.ibs / p.faturamento) * 100).toFixed(2)),
    Antigos: Number((((p.pisCofins + p.icms + p.iss) / p.faturamento) * 100).toFixed(2)),
  }));

  const update = <K extends keyof ParametrosProjecao>(k: K, v: ParametrosProjecao[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          Projeção Reforma Tributária 2026-2033
        </h1>
        <p className="text-muted-foreground mt-1">
          Simule o impacto da transição CBS/IBS na sua carga tributária ano a ano (EC 132/2023 + LC 214/2025).
        </p>
      </div>

      {/* Parâmetros */}
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros da Projeção</CardTitle>
          <CardDescription>Ajuste para refletir a realidade da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Faturamento anual (R$)</Label>
            <Input
              type="number"
              value={params.faturamentoAnual}
              onChange={(e) => update('faturamentoAnual', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>% Serviços</Label>
            <Input
              type="number"
              value={params.percentualServicos}
              onChange={(e) => {
                const s = Number(e.target.value);
                update('percentualServicos', s);
                update('percentualComercio', Math.max(0, 100 - s));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>% Comércio/Indústria</Label>
            <Input type="number" value={params.percentualComercio ?? 0} disabled />
          </div>
          <div className="space-y-2">
            <Label>PIS+COFINS atual (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={params.pisCofinsAtual ?? 0}
              onChange={(e) => update('pisCofinsAtual', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>ICMS médio atual (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={params.icmsAtual ?? 0}
              onChange={(e) => update('icmsAtual', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>ISS atual (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={params.issAtual ?? 0}
              onChange={(e) => update('issAtual', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>Setor</Label>
            <Select value={params.setor} onValueChange={(v) => update('setor', v as ParametrosProjecao['setor'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SETORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Carga atual (2025)</CardDescription></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projecao.cargaAtual.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">PIS+COFINS + ICMS + ISS</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Pico tributário (transição)</CardDescription></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{projecao.picoTributario.cargaEfetiva.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ano {projecao.picoTributario.ano} — {projecao.picoTributario.fase}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Economia/Custo acumulado 2026-2033</CardDescription></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${projecao.economiaAcumulada >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(projecao.economiaAcumulada)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {projecao.economiaAcumulada >= 0 ? 'Economia projetada' : 'Aumento de carga projetado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {projecao.picoTributario.variacaoVsAtual > 1 && (
        <Alert variant="default" className="border-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pico de carga em {projecao.picoTributario.ano}</AlertTitle>
          <AlertDescription>
            A carga sobe <strong>{projecao.picoTributario.variacaoVsAtual.toFixed(2)} p.p.</strong> em relação a 2025.
            Avalie créditos plenos de CBS/IBS, regimes especiais ou reorganização societária.
          </AlertDescription>
        </Alert>
      )}

      {/* Gráfico Linha — Carga Efetiva */}
      <Card>
        <CardHeader>
          <CardTitle>Carga Tributária Efetiva (% do faturamento)</CardTitle>
        </CardHeader>
        <CardContent
          style={{ height: 360 }}
          role="img"
          aria-label="Gráfico de linha: carga tributária efetiva ano a ano de 2026 a 2033"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="ano" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" unit="%" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="Carga Atual" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="Carga Projetada" stroke="hsl(var(--primary))" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico Área — Composição */}
      <Card>
        <CardHeader>
          <CardTitle>Composição da Carga por Tributo</CardTitle>
        </CardHeader>
        <CardContent
          style={{ height: 360 }}
          role="img"
          aria-label="Gráfico de área: composição da carga tributária por tributo (CBS, IBS, Antigos)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="ano" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" unit="%" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Area type="monotone" dataKey="CBS" stackId="1" stroke="hsl(var(--cbs, 217 91% 60%))" fill="hsl(var(--cbs, 217 91% 60%))" />
              <Area type="monotone" dataKey="IBS" stackId="1" stroke="hsl(var(--ibs, 258 90% 66%))" fill="hsl(var(--ibs, 258 90% 66%))" />
              <Area type="monotone" dataKey="Antigos" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela ano a ano */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento ano a ano</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">Ano</th>
                <th>Fase</th>
                <th className="text-right">CBS</th>
                <th className="text-right">IBS</th>
                <th className="text-right">PIS/COFINS</th>
                <th className="text-right">ICMS</th>
                <th className="text-right">ISS</th>
                <th className="text-right">Total</th>
                <th className="text-right">Carga %</th>
                <th className="text-right">Δ vs atual</th>
              </tr>
            </thead>
            <tbody>
              {projecao.projecoes.map((p) => (
                <tr key={p.ano} className="border-b hover:bg-muted/40">
                  <td className="py-2 font-semibold">{p.ano}</td>
                  <td className="text-xs text-muted-foreground">{p.fase}</td>
                  <td className="text-right">{formatCurrency(p.cbs)}</td>
                  <td className="text-right">{formatCurrency(p.ibs)}</td>
                  <td className="text-right">{formatCurrency(p.pisCofins)}</td>
                  <td className="text-right">{formatCurrency(p.icms)}</td>
                  <td className="text-right">{formatCurrency(p.iss)}</td>
                  <td className="text-right font-semibold">{formatCurrency(p.totalTributos)}</td>
                  <td className="text-right">{p.cargaEfetiva.toFixed(2)}%</td>
                  <td className="text-right">
                    <Badge variant={p.variacaoVsAtual > 0 ? 'destructive' : 'secondary'}>
                      {p.variacaoVsAtual > 0 ? '+' : ''}{p.variacaoVsAtual.toFixed(2)} p.p.
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Alert>
        <ScrollText className="h-4 w-4" />
        <AlertTitle>Base legal</AlertTitle>
        <AlertDescription className="text-xs">
          EC 132/2023 (Reforma Tributária) • LC 214/2025 (regras CBS/IBS) • Cronograma de transição definido pelo
          Comitê Gestor do IBS. Setores beneficiados (saúde, educação, agro, transporte coletivo) recebem redução
          de 60% sobre a alíquota padrão.
        </AlertDescription>
      </Alert>
    </div>
  );
}
