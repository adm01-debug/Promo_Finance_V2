import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Plus, Receipt, Trash2 } from 'lucide-react';
import {
  LABEL_RECEITA,
  REGRAS_CREDITO,
  apurarPisCofins,
  type ItemCredito,
  type ItemReceita,
  type LinhaMemoria,
  type NaturezaCredito,
  type NaturezaReceita,
} from '@/lib/tributario/pis-cofins';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`;

const NATUREZAS_RECEITA = Object.keys(LABEL_RECEITA) as NaturezaReceita[];
const NATUREZAS_CREDITO = Object.keys(REGRAS_CREDITO) as NaturezaCredito[];

const num = (v: string) => {
  const parsed = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

function MemoriaTable({ linhas }: { linhas: LinhaMemoria[] }) {
  if (linhas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum lançamento no período.</p>;
  }
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
          {linhas.map((l, i) => (
            <TableRow key={`${l.rubrica}-${i}`}>
              <TableCell>{l.rubrica}</TableCell>
              <TableCell className="text-right tabular-nums">{brl(l.base)}</TableCell>
              <TableCell className="text-right tabular-nums">{l.aliquota ? pct(l.aliquota) : '—'}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{brl(l.valor)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{l.fundamento}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PisCofinsCreditos() {
  const [receitas, setReceitas] = useState<ItemReceita[]>([
    { descricao: 'Vendas no mercado interno', valor: 500_000, natureza: 'tributada', icmsDestacado: 90_000 },
  ]);
  const [creditos, setCreditos] = useState<ItemCredito[]>([
    { descricao: 'Insumos de produção', natureza: 'insumos', valor: 180_000, icmsDestacado: 32_400 },
  ]);
  const [saldoPis, setSaldoPis] = useState(0);
  const [saldoCofins, setSaldoCofins] = useState(0);
  const [retPis, setRetPis] = useState(0);
  const [retCofins, setRetCofins] = useState(0);

  const resultado = useMemo(
    () =>
      apurarPisCofins({
        receitas,
        creditos,
        saldoCredorAnteriorPis: saldoPis,
        saldoCredorAnteriorCofins: saldoCofins,
        retencoesPis: retPis,
        retencoesCofins: retCofins,
      }),
    [receitas, creditos, saldoPis, saldoCofins, retPis, retCofins],
  );

  const patchReceita = (i: number, patch: Partial<ItemReceita>) =>
    setReceitas((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const patchCredito = (i: number, patch: Partial<ItemCredito>) =>
    setCreditos((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
        <PageHeader
          title="PIS/COFINS não cumulativo"
          subtitle="Apuração de débitos e créditos com exclusão do ICMS da base (Tema 69), rateio de receitas mistas e controle de saldo credor."
          badge="Etapa E"
          icon={Receipt}
          gradientFrom="from-primary/80"
          gradientVia="via-primary"
          gradientTo="to-success"
        />


        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Receita bruta ajustada</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{brl(resultado.receitaBruta)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Tributada: {brl(resultado.receitaTributada)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Créditos apropriados</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {brl(resultado.pis.creditoPeriodo + resultado.cofins.creditoPeriodo)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Rateio aplicado: {pct(resultado.percentualRateio)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total a recolher</CardDescription>
              <CardTitle className="text-2xl tabular-nums text-primary">{brl(resultado.totalARecolher)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              PIS {brl(resultado.pis.aRecolher)} · COFINS {brl(resultado.cofins.aRecolher)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Carga efetiva</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{pct(resultado.cargaEfetiva)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Saldo credor: {brl(resultado.pis.saldoCredorFinal + resultado.cofins.saldoCredorFinal)}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="receitas" className="mt-6">
          <TabsList>
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="creditos">Créditos</TabsTrigger>
            <TabsTrigger value="apuracao">Apuração</TabsTrigger>
            <TabsTrigger value="regras">Rol de créditos</TabsTrigger>
          </TabsList>

          <TabsContent value="receitas" className="space-y-4">
            {receitas.map((r, i) => (
              <Card key={`receita-${i}`}>
                <CardContent className="grid gap-4 pt-6 md:grid-cols-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Input
                      value={r.descricao ?? ''}
                      onChange={(e) => patchReceita(i, { descricao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Natureza</Label>
                    <Select
                      value={r.natureza}
                      onValueChange={(v) => patchReceita(i, { natureza: v as NaturezaReceita })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NATUREZAS_RECEITA.map((n) => (
                          <SelectItem key={n} value={n}>{LABEL_RECEITA[n]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      inputMode="decimal"
                      value={String(r.valor)}
                      onChange={(e) => patchReceita(i, { valor: num(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ICMS destacado</Label>
                    <Input
                      inputMode="decimal"
                      value={String(r.icmsDestacado ?? 0)}
                      onChange={(e) => patchReceita(i, { icmsDestacado: num(e.target.value) })}
                    />
                  </div>
                  <div className="md:col-span-5 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReceitas((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => setReceitas((prev) => [...prev, { valor: 0, natureza: 'tributada' }])}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar receita
            </Button>
          </TabsContent>

          <TabsContent value="creditos" className="space-y-4">
            {creditos.map((c, i) => (
              <Card key={`credito-${i}`}>
                <CardContent className="grid gap-4 pt-6 md:grid-cols-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição</Label>
                    <Input
                      value={c.descricao ?? ''}
                      onChange={(e) => patchCredito(i, { descricao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Natureza do crédito</Label>
                    <Select
                      value={c.natureza}
                      onValueChange={(v) => patchCredito(i, { natureza: v as NaturezaCredito })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NATUREZAS_CREDITO.map((n) => (
                          <SelectItem key={n} value={n}>{REGRAS_CREDITO[n].descricao}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      inputMode="decimal"
                      value={String(c.valor)}
                      onChange={(e) => patchCredito(i, { valor: num(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ICMS na entrada</Label>
                    <Input
                      inputMode="decimal"
                      value={String(c.icmsDestacado ?? 0)}
                      onChange={(e) => patchCredito(i, { icmsDestacado: num(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Parcelas</Label>
                    <Input
                      inputMode="numeric"
                      value={String(c.parcelas ?? 1)}
                      onChange={(e) => patchCredito(i, { parcelas: num(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      checked={c.fornecedorPessoaFisica ?? false}
                      onCheckedChange={(v) => patchCredito(i, { fornecedorPessoaFisica: v })}
                    />
                    <Label className="text-sm">Fornecedor PF</Label>
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      checked={c.entradaSemIncidencia ?? false}
                      onCheckedChange={(v) => patchCredito(i, { entradaSemIncidencia: v })}
                    />
                    <Label className="text-sm">Entrada sem incidência</Label>
                  </div>
                  <div className="md:col-span-5 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreditos((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => setCreditos((prev) => [...prev, { natureza: 'insumos', valor: 0 }])}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar crédito
            </Button>
          </TabsContent>

          <TabsContent value="apuracao" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saldos e retenções</CardTitle>
                <CardDescription>Saldo credor de períodos anteriores e CSRF retida na fonte.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Saldo credor PIS</Label>
                  <Input inputMode="decimal" value={String(saldoPis)} onChange={(e) => setSaldoPis(num(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Saldo credor COFINS</Label>
                  <Input inputMode="decimal" value={String(saldoCofins)} onChange={(e) => setSaldoCofins(num(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Retenções PIS</Label>
                  <Input inputMode="decimal" value={String(retPis)} onChange={(e) => setRetPis(num(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Retenções COFINS</Label>
                  <Input inputMode="decimal" value={String(retCofins)} onChange={(e) => setRetCofins(num(e.target.value))} />
                </div>
              </CardContent>
            </Card>

            {resultado.alertas.length > 0 && (
              <div className="space-y-2">
                {resultado.alertas.map((a, i) => (
                  <Alert key={`alerta-${i}`}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{a}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Memória de cálculo</CardTitle>
              </CardHeader>
              <CardContent>
                <MemoriaTable linhas={resultado.memoria} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regras">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rol de créditos (art. 3º das Leis 10.637/02 e 10.833/03)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Natureza</TableHead>
                        <TableHead>Fundamento</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead className="text-right">Crédito</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {NATUREZAS_CREDITO.map((n) => {
                        const regra = REGRAS_CREDITO[n];
                        return (
                          <TableRow key={n}>
                            <TableCell className="font-medium">{regra.descricao}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{regra.fundamento}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{regra.observacao ?? '—'}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={regra.permiteCredito ? 'default' : 'secondary'}>
                                {regra.permiteCredito ? 'Permitido' : 'Vedado'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
