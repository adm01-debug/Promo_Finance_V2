// ============================================
// PÁGINA: PF Vinculada — Lei 15.270/2025 (IRPFM)
// Imposto Mínimo PF sobre dividendos > R$ 50k/mês
// ============================================
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowDown, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import {
  calcularIRPFMMensal,
  calcularIRPFMAnual,
  IRPFM_LIMITE_ISENCAO_MENSAL,
} from '@/lib/tributario';
import { formatCurrency } from '@/lib/formatters';

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface LinhaMes {
  dividendos: number;
  irrf: number;
}

export default function PfVinculada() {
  const [linhas, setLinhas] = useState<LinhaMes[]>(
    Array.from({ length: 12 }, () => ({ dividendos: 0, irrf: 0 })),
  );
  const [proLaboreMensal, setProLaboreMensal] = useState(0);

  const resultado = useMemo(() => {
    return calcularIRPFMAnual(
      linhas.map((l) => ({ dividendosMensais: l.dividendos, irrfRetido: l.irrf })),
    );
  }, [linhas]);

  const detalheMes = (idx: number) => {
    const l = linhas[idx];
    return calcularIRPFMMensal({ dividendosMensais: l.dividendos, irrfRetido: l.irrf });
  };

  // Comparativo: distribuir tudo via PJ vs. mover parte para pró-labore (sem IRPFM)
  const comparativo = useMemo(() => {
    const totalDist = linhas.reduce((a, l) => a + l.dividendos, 0);
    const proLaboreAnual = proLaboreMensal * 12;
    // Cenário B: reduz dividendos no valor do pró-labore proposto
    const novoMensal = Math.max(0, totalDist / 12 - proLaboreMensal);
    const cenarioB = calcularIRPFMAnual(
      Array.from({ length: 12 }, () => ({ dividendosMensais: novoMensal })),
    );
    // Pró-labore: ~27,5% IRRF + 11% INSS (teto) — estimativa simplificada
    const cargaProLabore = proLaboreAnual * 0.275 + Math.min(proLaboreAnual, 7507.49 * 12) * 0.11;
    return {
      totalAtualImposto: resultado.totalImposto,
      totalCenarioBImposto: cenarioB.totalImposto + cargaProLabore,
      diferenca: resultado.totalImposto - (cenarioB.totalImposto + cargaProLabore),
      proLaboreAnual,
      cargaProLabore,
    };
  }, [linhas, proLaboreMensal, resultado]);

  const setLinha = (idx: number, campo: keyof LinhaMes, valor: number) => {
    setLinhas((prev) => prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  };

  const preencherUniforme = () => {
    const v = Number(prompt('Valor mensal de dividendos a aplicar nos 12 meses (R$)?') || 0);
    if (v > 0) setLinhas(Array.from({ length: 12 }, () => ({ dividendos: v, irrf: 0 })));
  };

  return (
    <>
      <Helmet>
        <title>PF Vinculada — IRPFM Lei 15.270/2025 | Promo Finance</title>
        <meta
          name="description"
          content="Calcule o Imposto Mínimo PF (IRPFM) sobre dividendos da Lei 15.270/2025 e compare com cenários de pró-labore."
        />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">PF Vinculada — IRPFM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Imposto Mínimo PF sobre dividendos &gt; R$ {IRPFM_LIMITE_ISENCAO_MENSAL.toLocaleString('pt-BR')}/mês.
            Vigência: 2026 (Lei 15.270/2025).
          </p>
        </header>

        <Alert>
          <Info className="h-4 w-4" aria-hidden />
          <AlertTitle>Como funciona o IRPFM</AlertTitle>
          <AlertDescription>
            Aplica-se alíquota progressiva (5%, 7,5% ou 10%) sobre o valor que exceder R$ 50.000 mensais
            em dividendos recebidos por pessoa física. IRRF já retido na fonte é abatido.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição mensal de dividendos</CardTitle>
            <CardDescription>
              Informe o valor recebido em cada mês para calcular o IRPFM apurado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={preencherUniforme}>
                Preencher 12 meses
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Distribuição mensal de dividendos">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-2">Mês</th>
                    <th className="py-2 px-2">Dividendos (R$)</th>
                    <th className="py-2 px-2">IRRF retido (R$)</th>
                    <th className="py-2 px-2">Base IRPFM</th>
                    <th className="py-2 px-2">Alíquota</th>
                    <th className="py-2 px-2 text-right">Imposto líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha, idx) => {
                    const det = detalheMes(idx);
                    return (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="py-1.5 px-2 font-medium">{MESES[idx]}</td>
                        <td className="py-1.5 px-2">
                          <Input
                            type="number"
                            min={0}
                            step={1000}
                            value={linha.dividendos || ''}
                            onChange={(e) => setLinha(idx, 'dividendos', Number(e.target.value))}
                            className="h-8 w-32"
                            aria-label={`Dividendos de ${MESES[idx]}`}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <Input
                            type="number"
                            min={0}
                            step={100}
                            value={linha.irrf || ''}
                            onChange={(e) => setLinha(idx, 'irrf', Number(e.target.value))}
                            className="h-8 w-28"
                            aria-label={`IRRF de ${MESES[idx]}`}
                          />
                        </td>
                        <td className="py-1.5 px-2 text-muted-foreground">
                          {formatCurrency(det.baseCalculo)}
                        </td>
                        <td className="py-1.5 px-2">
                          <Badge variant={det.aliquotaEfetiva > 0 ? 'destructive' : 'secondary'}>
                            {det.aliquotaEfetiva.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-1.5 px-2 text-right font-medium">
                          {formatCurrency(det.impostoLiquido)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="py-2 px-2">Total</td>
                    <td className="py-2 px-2">{formatCurrency(resultado.totalDividendos)}</td>
                    <td className="py-2 px-2" />
                    <td className="py-2 px-2" />
                    <td className="py-2 px-2" />
                    <td className="py-2 px-2 text-right text-destructive">
                      {formatCurrency(resultado.totalLiquido)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {resultado.alertas.length > 0 && (
              <div className="space-y-2 pt-2">
                {resultado.alertas.map((a, i) => (
                  <Alert key={i} variant="default">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                    <AlertDescription>{a}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4" aria-hidden />
              Comparativo: dividendos vs. pró-labore
            </CardTitle>
            <CardDescription>
              Simule mover parte da remuneração para pró-labore (com INSS+IRRF) para escapar da faixa do IRPFM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 max-w-sm">
              <Label htmlFor="prolabore">Pró-labore mensal proposto (R$)</Label>
              <Input
                id="prolabore"
                type="number"
                min={0}
                step={1000}
                value={proLaboreMensal || ''}
                onChange={(e) => setProLaboreMensal(Number(e.target.value))}
              />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4 space-y-1">
                <div className="text-xs text-muted-foreground">Cenário A — só dividendos</div>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(comparativo.totalAtualImposto)}
                </div>
                <div className="text-xs text-muted-foreground">IRPFM anual</div>
              </div>

              <div className="rounded-lg border p-4 space-y-1">
                <div className="text-xs text-muted-foreground">Cenário B — pró-labore + dividendos</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(comparativo.totalCenarioBImposto)}
                </div>
                <div className="text-xs text-muted-foreground">
                  IRPFM + INSS/IRRF pró-labore ({formatCurrency(comparativo.cargaProLabore)})
                </div>
              </div>

              <div
                className={`rounded-lg border p-4 space-y-1 ${
                  comparativo.diferenca > 0 ? 'border-success bg-success/5' : 'border-warning bg-warning/5'
                }`}
              >
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" aria-hidden /> Economia anual
                </div>
                <div
                  className={`text-2xl font-bold ${
                    comparativo.diferenca > 0 ? 'text-success' : 'text-warning'
                  }`}
                >
                  {formatCurrency(Math.abs(comparativo.diferenca))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {comparativo.diferenca > 0
                    ? 'Cenário B é mais vantajoso'
                    : 'Cenário A é mais vantajoso'}
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" aria-hidden />
              <AlertDescription className="text-xs">
                Estimativa simplificada do pró-labore: 27,5% IRRF + 11% INSS (limitado ao teto previdenciário).
                Considere também encargos patronais (~20% INSS) ao planejar a mudança.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
