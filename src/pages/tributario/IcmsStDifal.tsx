import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Truck } from 'lucide-react';
import {
  ALIQUOTAS_UF, UFS, calcularDifal, calcularIcmsSt, type OrigemMercadoria, type UF,
} from '@/lib/tributario/icms';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`;

const ORIGENS: { value: OrigemMercadoria; label: string }[] = [
  { value: 0, label: '0 — Nacional' },
  { value: 1, label: '1 — Importação direta' },
  { value: 2, label: '2 — Adquirida no mercado interno (importada)' },
  { value: 3, label: '3 — Nacional com conteúdo de importação > 40%' },
  { value: 4, label: '4 — Nacional com processo produtivo básico' },
  { value: 5, label: '5 — Nacional com conteúdo de importação ≤ 40%' },
  { value: 6, label: '6 — Importada sem similar nacional' },
  { value: 7, label: '7 — Adquirida no mercado interno, sem similar' },
  { value: 8, label: '8 — Nacional com conteúdo de importação > 70%' },
];

function UfSelect({ id, value, onChange, label }: {
  id: string; value: UF; onChange: (uf: UF) => void; label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as UF)}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          {UFS.map((uf) => (
            <SelectItem key={uf} value={uf}>
              {uf} — {ALIQUOTAS_UF[uf].nome} ({pct(ALIQUOTAS_UF[uf].interna)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MemoriaTable({ linhas }: { linhas: { rubrica: string; base: number; aliquota: number; valor: number; fundamento: string }[] }) {
  return (
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
          {linhas.map((l) => (
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
  );
}

function SubstituicaoTributaria() {
  const [ufOrigem, setUfOrigem] = useState<UF>('SP');
  const [ufDestino, setUfDestino] = useState<UF>('BA');
  const [valorProduto, setValorProduto] = useState(10_000);
  const [frete, setFrete] = useState(0);
  const [ipi, setIpi] = useState(0);
  const [descontos, setDescontos] = useState(0);
  const [mvaOriginal, setMvaOriginal] = useState(0.4025);
  const [origem, setOrigem] = useState<OrigemMercadoria>(0);
  const [pmpf, setPmpf] = useState(0);
  const [aplicarFcp, setAplicarFcp] = useState(false);

  const r = useMemo(() => calcularIcmsSt({
    ufOrigem, ufDestino, valorProduto, frete, ipi, descontos, mvaOriginal, origem,
    pmpf: pmpf || undefined, aplicarFcp,
  }), [ufOrigem, ufDestino, valorProduto, frete, ipi, descontos, mvaOriginal, origem, pmpf, aplicarFcp]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operação</CardTitle>
          <CardDescription>
            MVA ajustada conforme o Convênio ICMS 52/2017; informe PMPF para substituir a MVA por pauta fiscal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UfSelect id="st-origem" label="UF de origem" value={ufOrigem} onChange={setUfOrigem} />
          <UfSelect id="st-destino" label="UF de destino" value={ufDestino} onChange={setUfDestino} />
          <div className="space-y-2">
            <Label htmlFor="st-origem-merc">Origem da mercadoria (CST)</Label>
            <Select value={String(origem)} onValueChange={(v) => setOrigem(Number(v) as OrigemMercadoria)}>
              <SelectTrigger id="st-origem-merc"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORIGENS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-valor">Valor dos produtos (R$)</Label>
            <Input id="st-valor" type="number" min={0} value={valorProduto} onChange={(e) => setValorProduto(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-frete">Frete + despesas (R$)</Label>
            <Input id="st-frete" type="number" min={0} value={frete} onChange={(e) => setFrete(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-ipi">IPI destacado (R$)</Label>
            <Input id="st-ipi" type="number" min={0} value={ipi} onChange={(e) => setIpi(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-desc">Descontos incondicionais (R$)</Label>
            <Input id="st-desc" type="number" min={0} value={descontos} onChange={(e) => setDescontos(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-mva">MVA-ST original (decimal)</Label>
            <Input id="st-mva" type="number" step="0.0001" min={0} value={mvaOriginal} onChange={(e) => setMvaOriginal(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-pmpf">PMPF / pauta (R$ — 0 desativa)</Label>
            <Input id="st-pmpf" type="number" min={0} value={pmpf} onChange={(e) => setPmpf(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3 md:col-span-3">
            <Label htmlFor="st-fcp" className="cursor-pointer">
              Aplicar FCP da UF de destino ({pct(ALIQUOTAS_UF[ufDestino].fcp)})
            </Label>
            <Switch id="st-fcp" checked={aplicarFcp} onCheckedChange={setAplicarFcp} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { t: 'Alíquota interestadual', v: pct(r.aliquotaInterestadual), n: r.operacaoInterestadual ? 'RSF 22/1989 e 13/2012' : 'Operação interna' },
          { t: 'MVA ajustada', v: r.usouPmpf ? '—' : pct(r.mvaAjustada), n: `MVA original ${pct(r.mvaOriginal)}` },
          { t: 'Base da ST', v: brl(r.baseSt), n: r.usouPmpf ? 'PMPF/pauta' : 'Base própria + IPI × (1 + MVA aj.)' },
          { t: 'Total a recolher', v: brl(r.totalRecolher), n: `ST ${brl(r.icmsSt)} + FCP ${brl(r.fcpSt)}` },
        ].map((c) => (
          <Card key={c.t}>
            <CardHeader className="pb-2">
              <CardDescription>{c.t}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{c.v}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{c.n}</CardContent>
          </Card>
        ))}
      </div>

      {r.alertas.map((a) => (
        <Alert key={a}><Info className="h-4 w-4" /><AlertDescription>{a}</AlertDescription></Alert>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Memória de cálculo da ST</CardTitle>
          <CardDescription>Valor total da nota ao adquirente: {brl(r.valorTotalNota)}</CardDescription>
        </CardHeader>
        <CardContent><MemoriaTable linhas={r.linhas} /></CardContent>
      </Card>
    </div>
  );
}

function DiferencialAliquotas() {
  const [ufOrigem, setUfOrigem] = useState<UF>('SP');
  const [ufDestino, setUfDestino] = useState<UF>('MG');
  const [valorOperacao, setValorOperacao] = useState(10_000);
  const [contribuinte, setContribuinte] = useState(false);
  const [aplicarFcp, setAplicarFcp] = useState(true);
  const [origem, setOrigem] = useState<OrigemMercadoria>(0);

  const r = useMemo(() => calcularDifal({
    ufOrigem, ufDestino, valorOperacao, destinatarioContribuinte: contribuinte, aplicarFcp, origem,
  }), [ufOrigem, ufDestino, valorOperacao, contribuinte, aplicarFcp, origem]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operação interestadual a consumidor final</CardTitle>
          <CardDescription>
            Base dupla para não contribuinte (LC 190/2022, art. 13) e base única para contribuinte do ICMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UfSelect id="df-origem" label="UF de origem" value={ufOrigem} onChange={setUfOrigem} />
          <UfSelect id="df-destino" label="UF de destino" value={ufDestino} onChange={setUfDestino} />
          <div className="space-y-2">
            <Label htmlFor="df-valor">Valor da operação (R$)</Label>
            <Input id="df-valor" type="number" min={0} value={valorOperacao} onChange={(e) => setValorOperacao(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="df-origem-merc">Origem da mercadoria (CST)</Label>
            <Select value={String(origem)} onValueChange={(v) => setOrigem(Number(v) as OrigemMercadoria)}>
              <SelectTrigger id="df-origem-merc"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORIGENS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="df-contrib" className="cursor-pointer">Destinatário contribuinte do ICMS</Label>
            <Switch id="df-contrib" checked={contribuinte} onCheckedChange={setContribuinte} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="df-fcp" className="cursor-pointer">Aplicar FCP ({pct(ALIQUOTAS_UF[ufDestino].fcp)})</Label>
            <Switch id="df-fcp" checked={aplicarFcp} onCheckedChange={setAplicarFcp} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { t: 'Interestadual × interna', v: `${pct(r.aliquotaInterestadual)} → ${pct(r.aliquotaInternaDestino)}`, n: 'Alíquotas da operação' },
          { t: 'Base de destino', v: brl(r.baseDestino), n: contribuinte ? 'Base única' : 'Base dupla (por dentro)' },
          { t: 'DIFAL', v: brl(r.difal), n: 'Devido à UF de destino' },
          { t: 'Total a recolher', v: brl(r.totalRecolher), n: `DIFAL + FCP ${brl(r.fcp)}` },
        ].map((c) => (
          <Card key={c.t}>
            <CardHeader className="pb-2">
              <CardDescription>{c.t}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{c.v}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{c.n}</CardContent>
          </Card>
        ))}
      </div>

      {r.alertas.map((a) => (
        <Alert key={a}><Info className="h-4 w-4" /><AlertDescription>{a}</AlertDescription></Alert>
      ))}

      <Card>
        <CardHeader><CardTitle>Memória de cálculo do DIFAL</CardTitle></CardHeader>
        <CardContent><MemoriaTable linhas={r.linhas} /></CardContent>
      </Card>
    </div>
  );
}

export default function IcmsStDifalPage() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
          <PageHeader
            title="ICMS — Substituição Tributária e DIFAL"
            subtitle="MVA ajustada, PMPF, FCP e diferencial de alíquotas nas 27 unidades federativas."
            badge="Etapa C"
            icon={Truck}
            gradientFrom="from-primary/80"
            gradientVia="via-primary"
            gradientTo="to-warning"
          />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              As alíquotas internas cadastradas são as modais de cada UF. Produtos com alíquota
              específica devem ser calculados com o override de alíquota interna.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="st">
            <TabsList>
              <TabsTrigger value="st">Substituição Tributária</TabsTrigger>
              <TabsTrigger value="difal">DIFAL</TabsTrigger>
              <TabsTrigger value="tabela">Tabela por UF</TabsTrigger>
            </TabsList>
            <TabsContent value="st" className="mt-6"><SubstituicaoTributaria /></TabsContent>
            <TabsContent value="difal" className="mt-6"><DiferencialAliquotas /></TabsContent>
            <TabsContent value="tabela" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alíquotas modais internas e FCP</CardTitle>
                  <CardDescription>Vigência 2025/2026 — 27 unidades federativas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>UF</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Região</TableHead>
                          <TableHead className="text-right">Interna</TableHead>
                          <TableHead className="text-right">FCP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {UFS.map((uf) => (
                          <TableRow key={uf}>
                            <TableCell className="font-medium">{uf}</TableCell>
                            <TableCell>{ALIQUOTAS_UF[uf].nome}</TableCell>
                            <TableCell><Badge variant="outline">{ALIQUOTAS_UF[uf].regiao}</Badge></TableCell>
                            <TableCell className="text-right tabular-nums">{pct(ALIQUOTAS_UF[uf].interna)}</TableCell>
                            <TableCell className="text-right tabular-nums">{pct(ALIQUOTAS_UF[uf].fcp)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
