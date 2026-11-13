import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { useCatalogoIssMunicipal } from '@/hooks/useCatalogoIssMunicipal';
import {
  compararComSugestaoIss,
  resolverAliquotaIss,
  TABELA_ISS_VAZIA,
} from '@/lib/tributario/ipi-iss/overlay-iss';
import { LISTA_LC116, calcularIss } from '@/lib/tributario/ipi-iss';
import { NumberField } from './NumberField';
import { brl, pct, LOCAL_LABEL } from './IpiIss.helpers';
import { Alertas } from './Alertas';
import { MemoriaTable } from './IpiIss.MemoriaTable';

export function IssSimulador() {
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

  const r = useMemo(
    () =>
      calcularIss({
        itemLc116: item,
        valorServico,
        materiais,
        subempreitadas,
        aliquotaMunicipal: aliquota / 100,
        municipioPrestador: prestador,
        municipioTomador: tomador,
        municipioExecucao: execucao,
        tomadorPessoaJuridica: tomadorPj,
        prestadorSimplesNacional: simples,
      }),
    [
      item,
      valorServico,
      materiais,
      subempreitadas,
      aliquota,
      prestador,
      tomador,
      execucao,
      tomadorPj,
      simples,
    ]
  );

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
            Competência definida pelo art. 3º da LC 116/2003; retenções federais pela Lei
            10.833/2003 e RIR/2018.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="iss-item">Item da lista (LC 116/2003)</Label>
            <Select value={item} onValueChange={setItem}>
              <SelectTrigger id="iss-item">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LISTA_LC116.map((i) => (
                  <SelectItem key={i.item} value={i.item}>
                    {i.item} — {i.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumberField
            id="iss-valor"
            label="Valor do serviço"
            value={valorServico}
            onChange={setValorServico}
          />
          <NumberField id="iss-mat" label="Materiais" value={materiais} onChange={setMateriais} />
          <NumberField
            id="iss-sub"
            label="Subempreitadas"
            value={subempreitadas}
            onChange={setSubempreitadas}
          />
          <NumberField
            id="iss-aliq"
            label="Alíquota municipal (%)"
            value={aliquota}
            onChange={setAliquota}
            step="0.01"
          />
          <div className="space-y-2">
            <Label htmlFor="iss-prest">Município do prestador</Label>
            <Input
              id="iss-prest"
              value={prestador}
              onChange={(e) => setPrestador(e.target.value)}
            />
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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Base de cálculo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{brl(r.baseCalculo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ISS devido</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{brl(r.issDevido)}</p>
            <Badge variant="secondary" className="mt-2">
              {pct(r.aliquota)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total retido</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-warning">
              {brl(r.retencoes.total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Líquido a receber</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-success">
              {brl(r.valorLiquidoRecebido)}
            </p>
          </CardContent>
        </Card>
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
                onClick={() =>
                  setAliquota(Number((comparacao.sugestao!.aliquota * 100).toFixed(4)))
                }
              >
                Aplicar alíquota do catálogo
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Alertas alertas={r.alertas} />
      <Card>
        <CardHeader>
          <CardTitle>Memória de cálculo e retenções</CardTitle>
        </CardHeader>
        <CardContent>
          <MemoriaTable linhas={r.memoria} />
        </CardContent>
      </Card>
    </div>
  );
}
