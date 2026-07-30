import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Users } from 'lucide-react';
import {
  ALIQUOTAS_CPRB, FAP_MAXIMO, FAP_MINIMO, TABELA_FPAS,
  calcularEncargosPatronais, compararDesoneracaoFolha, type GrauRisco,
} from '@/lib/tributario/folha';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}%`;

const GRAUS: { value: GrauRisco; label: string }[] = [
  { value: 'leve', label: 'Leve — RAT 1%' },
  { value: 'medio', label: 'Médio — RAT 2%' },
  { value: 'grave', label: 'Grave — RAT 3%' },
];

export default function FolhaEncargosPage() {
  const [folha, setFolha] = useState(1_000_000);
  const [proLabore, setProLabore] = useState(120_000);
  const [grauRisco, setGrauRisco] = useState<GrauRisco>('medio');
  const [fap, setFap] = useState(1);
  const [fpas, setFpas] = useState('515');
  const [simplesNacional, setSimplesNacional] = useState(false);
  const [receitaBruta, setReceitaBruta] = useState(10_000_000);
  const [aliquotaCprb, setAliquotaCprb] = useState(0.045);

  const encargos = useMemo(
    () => calcularEncargosPatronais({ folha, proLabore, grauRisco, fap, fpas, simplesNacional }),
    [folha, proLabore, grauRisco, fap, fpas, simplesNacional],
  );

  const desoneracao = useMemo(
    () => compararDesoneracaoFolha({
      receitaBruta, aliquotaCprb,
      encargos: { folha, proLabore, grauRisco, fap, fpas, simplesNacional },
    }),
    [receitaBruta, aliquotaCprb, folha, proLabore, grauRisco, fap, fpas, simplesNacional],
  );

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
          <PageHeader
            title="Encargos de Folha — RAT, FAP e Terceiros"
            subtitle="Apuração precisa da contribuição patronal e comparativo com a desoneração (CPRB)."
            badge="Etapa B"
            icon={Users}
            gradientFrom="from-primary/80"
            gradientVia="via-primary"
            gradientTo="to-success"
          />

          <Card>
            <CardHeader>
              <CardTitle>Parâmetros da folha</CardTitle>
              <CardDescription>
                O pró-labore integra a CPP de 20%, mas não compõe a base de RAT, Terceiros e FGTS.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="folha">Folha anual (R$)</Label>
                <Input id="folha" type="number" min={0} value={folha} onChange={(e) => setFolha(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prolabore">Pró-labore anual (R$)</Label>
                <Input id="prolabore" type="number" min={0} value={proLabore} onChange={(e) => setProLabore(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grau">Grau de risco (RAT nominal)</Label>
                <Select value={grauRisco} onValueChange={(v) => setGrauRisco(v as GrauRisco)}>
                  <SelectTrigger id="grau"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRAUS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fap">FAP ({FAP_MINIMO.toFixed(4)} a {FAP_MAXIMO.toFixed(4)})</Label>
                <Input
                  id="fap" type="number" step="0.0001" min={FAP_MINIMO} max={FAP_MAXIMO}
                  value={fap} onChange={(e) => setFap(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fpas">Código FPAS (Terceiros)</Label>
                <Select value={fpas} onValueChange={setFpas}>
                  <SelectTrigger id="fpas"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TABELA_FPAS.map((f) => (
                      <SelectItem key={f.fpas} value={f.fpas}>
                        {f.fpas} — {f.descricao} ({pct(f.aliquotaTerceiros)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="simples" className="cursor-pointer">Optante do Simples (Anexos I a III)</Label>
                <Switch id="simples" checked={simplesNacional} onCheckedChange={setSimplesNacional} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { titulo: 'RAT ajustado', valor: pct(encargos.ratAjustado), nota: `RAT ${pct(encargos.ratNominal)} × FAP ${encargos.fap.toFixed(4)}` },
              { titulo: 'Total INSS patronal', valor: brl(encargos.totalInss), nota: 'CPP + RAT + Terceiros' },
              { titulo: 'FGTS', valor: brl(encargos.fgts), nota: '8% da remuneração de empregados' },
              { titulo: 'Encargos sobre a folha', valor: pct(encargos.percentualSobreFolha), nota: brl(encargos.totalEncargos) },
            ].map((card) => (
              <Card key={card.titulo}>
                <CardHeader className="pb-2">
                  <CardDescription>{card.titulo}</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{card.valor}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{card.nota}</CardContent>
              </Card>
            ))}
          </div>

          {encargos.alertas.map((a) => (
            <Alert key={a}><Info className="h-4 w-4" /><AlertDescription>{a}</AlertDescription></Alert>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Memória de cálculo</CardTitle>
              <CardDescription>Rubricas, bases, alíquotas e fundamento legal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rubrica</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Alíquota</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Fundamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {encargos.linhas.map((l) => (
                      <TableRow key={l.rubrica}>
                        <TableCell>{l.rubrica}</TableCell>
                        <TableCell className="text-right tabular-nums">{brl(l.base)}</TableCell>
                        <TableCell className="text-right tabular-nums">{pct(l.aliquota)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{brl(l.valor)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.fundamento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desoneração da folha (CPRB)</CardTitle>
              <CardDescription>
                Comparativo entre a contribuição sobre a folha e a contribuição sobre a receita bruta
                (Lei 12.546/11). RAT, Terceiros e FGTS permanecem devidos na desoneração.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="receita">Receita bruta anual (R$)</Label>
                  <Input id="receita" type="number" min={0} value={receitaBruta} onChange={(e) => setReceitaBruta(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cprb">Alíquota CPRB</Label>
                  <Select value={String(aliquotaCprb)} onValueChange={(v) => setAliquotaCprb(Number(v))}>
                    <SelectTrigger id="cprb"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALIQUOTAS_CPRB.map((a) => (
                        <SelectItem key={a.setor} value={String(a.aliquota)}>
                          {a.setor} — {pct(a.aliquota)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-md border border-border p-4">
                  <p className="text-xs text-muted-foreground">Folha onerada</p>
                  <p className="text-xl font-semibold tabular-nums">{brl(desoneracao.totalOnerado)}</p>
                </div>
                <div className="rounded-md border border-border p-4">
                  <p className="text-xs text-muted-foreground">Folha desonerada (CPRB)</p>
                  <p className="text-xl font-semibold tabular-nums">{brl(desoneracao.totalDesonerado)}</p>
                </div>
                <div className="rounded-md border border-border p-4">
                  <p className="text-xs text-muted-foreground">Resultado</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {brl(Math.abs(desoneracao.economia))}
                  </p>
                  <Badge variant="outline" className={desoneracao.recomendacao === 'cprb' ? 'border-success/40 text-success' : 'text-muted-foreground'}>
                    {desoneracao.recomendacao === 'cprb' ? 'CPRB é mais vantajosa' : 'Manter folha onerada'}
                  </Badge>
                </div>
              </div>

              {desoneracao.alertas.map((a) => (
                <Alert key={a}><Info className="h-4 w-4" /><AlertDescription>{a}</AlertDescription></Alert>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
