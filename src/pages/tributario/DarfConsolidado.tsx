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
import { Download, Info, Plus, Receipt, Trash2 } from 'lucide-react';
import {
  CODIGOS_RECEITA,
  consolidarDarf,
  exportarDarfCsv,
  type DebitoApurado,
} from '@/lib/tributario/darf';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
const dataBR = (iso: string) => iso.split('-').reverse().join('/');
const num = (v: string) => {
  const parsed = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

interface LinhaDebito {
  id: string;
  codigo: string;
  periodoApuracao: string;
  principal: number;
  origem: string;
}

const competenciaAtual = () => new Date().toISOString().slice(0, 7);

const novaLinha = (): LinhaDebito => ({
  id: crypto.randomUUID(),
  codigo: '5856',
  periodoApuracao: competenciaAtual(),
  principal: 0,
  origem: '',
});

export default function DarfConsolidado() {
  const [linhas, setLinhas] = useState<LinhaDebito[]>([novaLinha()]);
  const [dataPagamento, setDataPagamento] = useState('');
  const [selicPadrao, setSelicPadrao] = useState(0.89);
  const [parcelar, setParcelar] = useState(false);

  const resultado = useMemo(() => {
    const debitos: DebitoApurado[] = linhas
      .filter((l) => l.principal > 0 && /^\d{4}-\d{2}$/.test(l.periodoApuracao))
      .map((l) => ({
        id: l.id,
        codigo: l.codigo,
        periodoApuracao: l.periodoApuracao,
        principal: l.principal,
        origem: l.origem || undefined,
      }));
    if (debitos.length === 0) return null;
    try {
      return consolidarDarf({
        debitos,
        dataPagamento: dataPagamento || undefined,
        selicPadraoMensal: selicPadrao / 100,
        parcelarEmQuotas: parcelar,
      });
    } catch {
      return null;
    }
  }, [linhas, dataPagamento, selicPadrao, parcelar]);

  const atualizar = (id: string, patch: Partial<LinhaDebito>) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const baixarCsv = () => {
    if (!resultado) return;
    const blob = new Blob([exportarDarfCsv(resultado)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `darf-consolidado-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
        <PageHeader
          title="DARF Consolidado"
          subtitle="Consolidação de débitos federais por código de receita, com vencimento em dia útil, multa de mora e juros SELIC."
          badge="Etapa G"
          icon={Receipt}
          gradientFrom="from-primary/80"
          gradientVia="via-primary"
          gradientTo="to-success"
        />



        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Débitos apurados</CardTitle>
              <CardDescription>
                Informe os valores gerados pelos motores de IRPJ/CSLL, PIS/COFINS, IPI e retenções.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {linhas.map((linha) => (
                <div key={linha.id} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Label className="text-xs">Código de receita</Label>
                    <Select value={linha.codigo} onValueChange={(v) => atualizar(linha.id, { codigo: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CODIGOS_RECEITA.map((c) => (
                          <SelectItem key={c.codigo} value={c.codigo}>
                            {c.codigo} — {c.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Competência</Label>
                    <Input
                      type="month"
                      value={linha.periodoApuracao}
                      onChange={(e) => atualizar(linha.id, { periodoApuracao: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Principal (R$)</Label>
                    <Input
                      inputMode="decimal"
                      defaultValue="0"
                      onChange={(e) => atualizar(linha.id, { principal: num(e.target.value) })}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs">Origem</Label>
                    <Input
                      value={linha.origem}
                      placeholder="Ex.: apuração PIS/COFINS"
                      onChange={(e) => atualizar(linha.id, { origem: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end md:col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover débito"
                      onClick={() => setLinhas((prev) => prev.filter((l) => l.id !== linha.id))}
                      disabled={linhas.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => setLinhas((prev) => [...prev, novaLinha()])}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar débito
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parâmetros</CardTitle>
              <CardDescription>Data de pagamento e taxa SELIC de referência.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Data de pagamento prevista</Label>
                <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Em branco, considera o pagamento na data de vencimento.
                </p>
              </div>
              <div>
                <Label className="text-xs">SELIC mensal de referência (%)</Label>
                <Input
                  inputMode="decimal"
                  defaultValue="0,89"
                  onChange={(e) => setSelicPadrao(num(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Parcelar em quotas</p>
                  <p className="text-xs text-muted-foreground">IRPJ/CSLL trimestral, até 3 quotas.</p>
                </div>
                <Switch checked={parcelar} onCheckedChange={setParcelar} />
              </div>
              <Button className="w-full" onClick={baixarCsv} disabled={!resultado}>
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {!resultado ? (
          <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Informe ao menos um débito com valor positivo para gerar a consolidação.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="darfs" className="mt-6">
            <TabsList>
              <TabsTrigger value="darfs">DARFs ({resultado.darfs.length})</TabsTrigger>
              <TabsTrigger value="quotas">Quotas</TabsTrigger>
              <TabsTrigger value="diferidos">Diferidos ({resultado.diferidos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="darfs" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Principal</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">{brl(resultado.totalPrincipal)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Multa e juros</CardDescription>
                    <CardTitle className="text-2xl tabular-nums text-warning">
                      {brl(resultado.totalAcrescimos)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total a recolher</CardDescription>
                    <CardTitle className="text-2xl tabular-nums text-primary">
                      {brl(resultado.totalGeral)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Multa</TableHead>
                      <TableHead className="text-right">Juros</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.darfs.map((d) => (
                      <TableRow key={`${d.codigo}-${d.periodoApuracao}`}>
                        <TableCell>
                          <div className="font-medium">{d.codigo}</div>
                          <div className="text-xs text-muted-foreground">{d.descricao}</div>
                          {d.observacoes.map((o) => (
                            <div key={o} className="mt-1 text-xs text-warning">
                              {o}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>{d.periodoApuracao}</TableCell>
                        <TableCell>{dataBR(d.vencimento)}</TableCell>
                        <TableCell className="text-right tabular-nums">{brl(d.principal)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {brl(d.acrescimos.multaMora)}
                          {d.acrescimos.percentualMulta > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {pct(d.acrescimos.percentualMulta)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{brl(d.acrescimos.juros)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{brl(d.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="quotas">
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Quota</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Juros SELIC</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.darfs.flatMap((d) =>
                      d.quotas.map((q) => (
                        <TableRow key={`${d.codigo}-${d.periodoApuracao}-${q.numero}`}>
                          <TableCell>{d.codigo}</TableCell>
                          <TableCell>{q.numero}/{d.quotas.length}</TableCell>
                          <TableCell>{dataBR(q.vencimento)}</TableCell>
                          <TableCell className="text-right tabular-nums">{brl(q.principal)}</TableCell>
                          <TableCell className="text-right tabular-nums">{brl(q.jurosSelic)}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{brl(q.total)}</TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </div>
              {resultado.darfs.every((d) => d.quotas.length === 0) && (
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma quota gerada. Ative "Parcelar em quotas" e use códigos de IRPJ/CSLL com valor
                    mínimo de R$ 1.000,00 por quota.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="diferidos">
              {resultado.diferidos.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Nenhum débito diferido por valor inferior a R$ 10,00.</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Competência</TableHead>
                        <TableHead className="text-right">Valor acumulado</TableHead>
                        <TableHead>Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.diferidos.map((d) => (
                        <TableRow key={`${d.codigo}-${d.periodoApuracao}`}>
                          <TableCell>{d.codigo}</TableCell>
                          <TableCell>{d.periodoApuracao}</TableCell>
                          <TableCell className="text-right tabular-nums">{brl(d.principal)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {d.observacoes.join(' ')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        </div>
      </div>

    </MainLayout>
  );
}
