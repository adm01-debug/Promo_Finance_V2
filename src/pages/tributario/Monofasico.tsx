import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Beaker, Download, FileText, Info } from 'lucide-react';
import { MixEditor, POSICOES } from '@/components/tributario/monofasico/MixEditor';
import { ResumoCards } from '@/components/tributario/monofasico/ResumoCards';
import { DetalhamentoTable } from '@/components/tributario/monofasico/DetalhamentoTable';
import { exportMonofasicoCSV, exportMonofasicoPDF } from '@/components/tributario/monofasico/exporters';
import {
  calcularMixMonofasico, calcularRecuperacaoRetroativa,
  type ItemMonofasico, type PosicaoCadeia, type RegimeApuracaoPisCofins,
} from '@/lib/tributario/monofasico';

const REGIMES: { value: RegimeApuracaoPisCofins; label: string }[] = [
  { value: 'presumido', label: 'Lucro Presumido (cumulativo 3,65%)' },
  { value: 'real', label: 'Lucro Real (não cumulativo 9,25%)' },
  { value: 'simples', label: 'Simples Nacional (PGDAS-D)' },
];

const ITENS_INICIAIS: ItemMonofasico[] = [{ ncm: '3004.10.00', receita: 1_000_000 }];

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MonofasicoPage() {
  const [itens, setItens] = useState<ItemMonofasico[]>(ITENS_INICIAIS);
  const [posicaoPadrao, setPosicaoPadrao] = useState<PosicaoCadeia>('varejo');
  const [regime, setRegime] = useState<RegimeApuracaoPisCofins>('presumido');

  const resumo = useMemo(
    () => calcularMixMonofasico(itens, posicaoPadrao, regime),
    [itens, posicaoPadrao, regime],
  );

  const recuperacao = useMemo(
    () => calcularRecuperacaoRetroativa(resumo.receitaMonofasica / 12, regime),
    [resumo.receitaMonofasica, regime],
  );

  const temDados = resumo.itens.length > 0;

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
          <PageHeader
            title="Regime Monofásico PIS/COFINS"
            subtitle="Classificação por NCM, apuração da etapa concentrada e recuperação de indébito."
            badge="Etapa 36"
            icon={Beaker}
            gradientFrom="from-primary/80"
            gradientVia="via-primary"
            gradientTo="to-success"
          />

          <Card>
            <CardHeader>
              <CardTitle>Parâmetros da apuração</CardTitle>
              <CardDescription>
                Informe o mix de NCMs comercializados no período. NCMs fora do catálogo monofásico
                voltam automaticamente para as alíquotas do regime selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="posicao-padrao">Posição padrão na cadeia</Label>
                  <Select value={posicaoPadrao} onValueChange={(v) => setPosicaoPadrao(v as PosicaoCadeia)}>
                    <SelectTrigger id="posicao-padrao"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSICOES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regime">Regime de apuração</Label>
                  <Select value={regime} onValueChange={(v) => setRegime(v as RegimeApuracaoPisCofins)}>
                    <SelectTrigger id="regime"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REGIMES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <MixEditor itens={itens} onChange={setItens} />
            </CardContent>
          </Card>

          <ResumoCards resumo={resumo} />

          {resumo.alertas.map((alerta) => (
            <Alert key={alerta}>
              <Info className="h-4 w-4" />
              <AlertDescription>{alerta}</AlertDescription>
            </Alert>
          ))}

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Memória de cálculo</CardTitle>
                <CardDescription>Detalhamento por NCM, alíquotas aplicadas e base legal.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!temDados} onClick={() => exportMonofasicoCSV(resumo)}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" size="sm" disabled={!temDados} onClick={() => exportMonofasicoPDF(resumo)}>
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {temDados ? (
                <DetalhamentoTable itens={resumo.itens} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Adicione NCMs para visualizar a memória de cálculo.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recuperação de indébito (5 anos)</CardTitle>
              <CardDescription>
                Estimativa de PIS/COFINS pagos indevidamente sobre receita monofásica, limitada ao prazo
                decadencial do art. 168 do CTN.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Crédito mensal médio:{' '}
                <span className="font-semibold tabular-nums">{brl(recuperacao.creditoMensalMedio)}</span>
              </p>
              <p>
                Total recuperável em {recuperacao.meses} meses:{' '}
                <span className="font-semibold tabular-nums text-success">{brl(recuperacao.totalRecuperavel)}</span>
              </p>
              <ul className="list-inside list-disc text-muted-foreground">
                {recuperacao.observacoes.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
