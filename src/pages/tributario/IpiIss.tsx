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
import { Button } from '@/components/ui/button';
import { Factory, Info } from 'lucide-react';
import { useCatalogoIssMunicipal } from '@/hooks/useCatalogoIssMunicipal';
import {
  compararComSugestaoIss,
  resolverAliquotaIss,
  TABELA_ISS_VAZIA,
} from '@/lib/tributario/ipi-iss/overlay-iss';
import {
  LISTA_LC116,
  TIPI,
  calcularIpi,
  calcularIss,
  type LinhaMemoria,
} from '@/lib/tributario/ipi-iss';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`;

const LOCAL_LABEL: Record<string, string> = {
  estabelecimento_prestador: 'Estabelecimento prestador',
  local_da_prestacao: 'Local da prestação',
  domicilio_tomador: 'Domicílio do tomador',
};

function MemoriaTable({ linhas }: { linhas: LinhaMemoria[] }) {
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

function Alertas({ alertas }: { alertas: string[] }) {
  if (alertas.length === 0) return null;
  return (
    <div className="space-y-2">
      {alertas.map((a) => (
        <Alert key={a}>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">{a}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

function NumberField({ id, label, value, onChange, step }: {
  id: string; label: string; value: number; onChange: (v: number) => void; step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step ?? '0.01'}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function IpiSimulador() {
  const [ncm, setNcm] = useState('96081000');
  const [valorProduto, setValorProduto] = useState(10_000);
  const [frete, setFrete] = useState(0);
  const [outras, setOutras] = useState(0);
  const [descontos, setDescontos] = useState(0);
  const [credito, setCredito] = useState(0);
  const [contribuinte, setContribuinte] = useState(true);

  const r = useMemo(() => calcularIpi({
    ncm, valorProduto, frete, outrasDespesas: outras,
    descontosIncondicionais: descontos, creditoEntradas: credito, contribuinte,
  }), [ncm, valorProduto, frete, outras, descontos, credito, contribuinte]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operação de saída</CardTitle>
          <CardDescription>
            Base do IPI conforme o art. 190 do RIPI: descontos incondicionais não a reduzem.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ipi-ncm">NCM (TIPI)</Label>
            <Select value={ncm} onValueChange={setNcm}>
              <SelectTrigger id="ipi-ncm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPI.map((t) => (
                  <SelectItem key={t.ncm} value={t.ncm}>
                    {t.ncm} — {t.descricao} ({pct(t.aliquota)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <Switch id="ipi-contrib" checked={contribuinte} onCheckedChange={setContribuinte} />
            <Label htmlFor="ipi-contrib">Industrial ou equiparado</Label>
          </div>
          <NumberField id="ipi-valor" label="Valor dos produtos" value={valorProduto} onChange={setValorProduto} />
          <NumberField id="ipi-frete" label="Frete" value={frete} onChange={setFrete} />
          <NumberField id="ipi-outras" label="Outras despesas" value={outras} onChange={setOutras} />
          <NumberField id="ipi-desc" label="Descontos incondicionais" value={descontos} onChange={setDescontos} />
          <NumberField id="ipi-credito" label="Crédito de entradas" value={credito} onChange={setCredito} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Base de cálculo</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums">{brl(r.baseCalculo)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>IPI devido</CardDescription></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{brl(r.ipiDevido)}</p>
            <Badge variant="secondary" className="mt-2">{r.situacao.replace(/_/g, ' ')} · {pct(r.aliquota)}</Badge>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Saldo apurado</CardDescription></CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold tabular-nums ${r.saldoApurado < 0 ? 'text-success' : 'text-foreground'}`}>
              {brl(r.saldoApurado)}
            </p>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total da nota</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums">{brl(r.valorTotalNota)}</p></CardContent></Card>
      </div>

      <Alertas alertas={r.alertas} />
      <Card>
        <CardHeader><CardTitle>Memória de cálculo</CardTitle></CardHeader>
        <CardContent><MemoriaTable linhas={r.memoria} /></CardContent>
      </Card>
    </div>
  );
}

function IssSimulador() {
  const [item, setItem] = useState('7.02');
  const [valorServico, setValorServico] = useState(100_000);
  const [materiais, setMateriais] = useState(0);
  const [subempreitadas, setSubempreitadas] = useState(0);
  const [aliquota, setAliquota] = useState(3);
  const [prestador, setPrestador] = useState('São Paulo');
  const [tomador, setTomador] = useState('Santos');
  const [execucao, setExecucao] = useState('Guarujá');
  const [tomadorPj, setTomadorPj] = useState(true);
  const [simples, setSimples] = useState(false);

  const { data: catalogoIss } = useCatalogoIssMunicipal();

  const r = useMemo(() => calcularIss({
    itemLc116: item, valorServico, materiais, subempreitadas,
    aliquotaMunicipal: aliquota / 100,
    municipioPrestador: prestador, municipioTomador: tomador, municipioExecucao: execucao,
    tomadorPessoaJuridica: tomadorPj, prestadorSimplesNacional: simples,
  }), [item, valorServico, materiais, subempreitadas, aliquota, prestador, tomador, execucao, tomadorPj, simples]);

  // A sugestão segue o município COMPETENTE (LC 116, art. 3º), não o prestador.
  const comparacao = useMemo(() => {
    const tabela = catalogoIss?.tabela ?? TABELA_ISS_VAZIA;
    const sugestao = resolverAliquotaIss(tabela, { municipio: r.municipioCompetente }, item);
    return compararComSugestaoIss(aliquota / 100, sugestao);
  }, [catalogoIss, r.municipioCompetente, item, aliquota]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prestação de serviço</CardTitle>
          <CardDescription>
            Competência definida pelo art. 3º da LC 116/2003; retenções federais pela Lei 10.833/2003 e RIR/2018.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="iss-item">Item da lista (LC 116/2003)</Label>
            <Select value={item} onValueChange={setItem}>
              <SelectTrigger id="iss-item"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LISTA_LC116.map((i) => (
                  <SelectItem key={i.item} value={i.item}>{i.item} — {i.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField id="iss-valor" label="Valor do serviço" value={valorServico} onChange={setValorServico} />
          <NumberField id="iss-mat" label="Materiais" value={materiais} onChange={setMateriais} />
          <NumberField id="iss-sub" label="Subempreitadas" value={subempreitadas} onChange={setSubempreitadas} />
          <NumberField id="iss-aliq" label="Alíquota municipal (%)" value={aliquota} onChange={setAliquota} step="0.01" />
          <div className="space-y-2">
            <Label htmlFor="iss-prest">Município do prestador</Label>
            <Input id="iss-prest" value={prestador} onChange={(e) => setPrestador(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iss-tom">Município do tomador</Label>
            <Input id="iss-tom" value={tomador} onChange={(e) => setTomador(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iss-exec">Município de execução</Label>
            <Input id="iss-exec" value={execucao} onChange={(e) => setExecucao(e.target.value)} />
          </div>
          <div className="flex items-end gap-3">
            <Switch id="iss-pj" checked={tomadorPj} onCheckedChange={setTomadorPj} />
            <Label htmlFor="iss-pj">Tomador pessoa jurídica</Label>
          </div>
          <div className="flex items-end gap-3">
            <Switch id="iss-sn" checked={simples} onCheckedChange={setSimples} />
            <Label htmlFor="iss-sn">Prestador no Simples Nacional</Label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Base de cálculo</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums">{brl(r.baseCalculo)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>ISS devido</CardDescription></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{brl(r.issDevido)}</p>
            <Badge variant="secondary" className="mt-2">{pct(r.aliquota)}</Badge>
          </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total retido</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums text-warning">{brl(r.retencoes.total)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Líquido a receber</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-semibold tabular-nums text-success">{brl(r.valorLiquidoRecebido)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Competência municipal</CardTitle>
          <CardDescription>{LOCAL_LABEL[r.local]} — LC 116/2003, art. 3º</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge>{r.municipioCompetente}</Badge>
          {r.issRetidoPeloTomador && <Badge variant="destructive">ISS retido pelo tomador</Badge>}
        </CardContent>
      </Card>

      {comparacao.status !== 'sem_catalogo' && comparacao.sugestao && (
        <Alert variant={comparacao.status === 'divergente' ? 'warning' : 'default'}>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>
              Catálogo municipal para {comparacao.sugestao.municipio}/{comparacao.sugestao.uf}
              {comparacao.sugestao.itemCodigo
                ? ` (item ${comparacao.sugestao.itemCodigo})`
                : ' (alíquota geral)'}
              : {pct(comparacao.sugestao.aliquota)}
              {comparacao.status === 'divergente'
                ? ` — informado difere em ${comparacao.diferencaPp.toFixed(2)} p.p.`
                : ' — alíquota informada confere.'}
            </span>
            {comparacao.sugestao.baseLegal && (
              <Badge variant="outline">{comparacao.sugestao.baseLegal}</Badge>
            )}
            {comparacao.status === 'divergente' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAliquota(Number((comparacao.sugestao!.aliquota * 100).toFixed(4)))}
              >
                Aplicar alíquota do catálogo
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Alertas alertas={r.alertas} />
      <Card>
        <CardHeader><CardTitle>Memória de cálculo e retenções</CardTitle></CardHeader>
        <CardContent><MemoriaTable linhas={r.memoria} /></CardContent>
      </Card>
    </div>
  );
}

function TabelasConsulta() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TIPI — Decreto 11.158/2022</CardTitle>
          <CardDescription>Recorte operacional dos NCM de maior giro.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NCM</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Alíquota</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIPI.map((t) => (
                  <TableRow key={t.ncm}>
                    <TableCell className="tabular-nums">{t.ncm}</TableCell>
                    <TableCell>{t.descricao}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(t.aliquota)}</TableCell>
                    <TableCell><Badge variant="outline">{t.situacao.replace(/_/g, ' ')}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de serviços — LC 116/2003</CardTitle>
          <CardDescription>Local de incidência e retenções aplicáveis por item.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">IRRF</TableHead>
                  <TableHead>INSS 11%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {LISTA_LC116.map((i) => (
                  <TableRow key={i.item}>
                    <TableCell className="tabular-nums">{i.item}</TableCell>
                    <TableCell>{i.descricao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{LOCAL_LABEL[i.local]}</TableCell>
                    <TableCell className="text-right tabular-nums">{i.irrfAliquota ? pct(i.irrfAliquota) : '—'}</TableCell>
                    <TableCell>{i.retencaoInss11 ? <Badge variant="destructive">Sim</Badge> : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function IpiIss() {
  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
          <PageHeader
            title="IPI e ISS"
            subtitle="Simuladores de IPI (TIPI) e de ISS com competência municipal e retenções na fonte."
            badge="Etapa D"
            icon={Factory}
            gradientFrom="from-primary/80"
            gradientVia="via-primary"
            gradientTo="to-success"
          />
          <Tabs defaultValue="ipi" className="space-y-6">
            <TabsList>
              <TabsTrigger value="ipi">IPI</TabsTrigger>
              <TabsTrigger value="iss">ISS e retenções</TabsTrigger>
              <TabsTrigger value="tabelas">Tabelas</TabsTrigger>
            </TabsList>
            <TabsContent value="ipi"><IpiSimulador /></TabsContent>
            <TabsContent value="iss"><IssSimulador /></TabsContent>
            <TabsContent value="tabelas"><TabelasConsulta /></TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}

