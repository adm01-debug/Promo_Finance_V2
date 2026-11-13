import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info } from 'lucide-react';
import { ALIQUOTAS_UF, calcularIcmsSt } from '@/lib/tributario/icms';
import type { OrigemMercadoria, SituacaoIcmsSt, UF } from '@/lib/tributario/icms';
import { resolverMvaSt } from '@/lib/tributario/icms/overlay-mva';
import { useCatalogosFiscais } from '@/hooks/useCatalogosFiscais';
import { UfSelect } from './UfSelect';
import { ORIGENS, pct, SITUACOES, brl } from './IcmsStDifal.helpers';
import { MemoriaTable } from './MemoriaTable';

export function SubstituicaoTributaria() {
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
  const [ncm, setNcm] = useState('');
  const [situacaoIcms, setSituacaoIcms] = useState<SituacaoIcmsSt>('tributada');
  const [usarProtocolo, setUsarProtocolo] = useState(true);

  // Carrega os catálogos versionados; o hook publica o índice de MVA/ST
  // validado (protocolo × NCM × UFs signatárias) para o motor consumir.
  const { isFetching: carregandoCatalogos } = useCatalogosFiscais();

  const resolucao = useMemo(
    () => resolverMvaSt({ ncm, ufOrigem, ufDestino, situacao: situacaoIcms }),
    [ncm, ufOrigem, ufDestino, situacaoIcms]
  );

  const r = useMemo(
    () =>
      calcularIcmsSt({
        ufOrigem,
        ufDestino,
        valorProduto,
        frete,
        ipi,
        descontos,
        origem,
        // Com "usar protocolo" ligado e MVA resolvida, a MVA manual é omitida e o
        // motor usa a do protocolo vigente.
        mvaOriginal: usarProtocolo && resolucao.encontrado ? undefined : mvaOriginal,
        ncm: ncm || undefined,
        situacaoIcms,
        pmpf: pmpf || undefined,
        aplicarFcp,
      }),
    [
      ufOrigem,
      ufDestino,
      valorProduto,
      frete,
      ipi,
      descontos,
      mvaOriginal,
      origem,
      pmpf,
      aplicarFcp,
      ncm,
      situacaoIcms,
      usarProtocolo,
      resolucao.encontrado,
    ]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operação</CardTitle>
          <CardDescription>
            MVA ajustada conforme o Convênio ICMS 52/2017; informe PMPF para substituir a MVA por
            pauta fiscal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UfSelect id="st-origem" label="UF de origem" value={ufOrigem} onChange={setUfOrigem} />
          <UfSelect
            id="st-destino"
            label="UF de destino"
            value={ufDestino}
            onChange={setUfDestino}
          />
          <div className="space-y-2">
            <Label htmlFor="st-origem-merc">Origem da mercadoria (CST)</Label>
            <Select
              value={String(origem)}
              onValueChange={(v) => setOrigem(Number(v) as OrigemMercadoria)}
            >
              <SelectTrigger id="st-origem-merc">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORIGENS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-valor">Valor dos produtos (R$)</Label>
            <Input
              id="st-valor"
              type="number"
              min={0}
              value={valorProduto}
              onChange={(e) => setValorProduto(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-frete">Frete + despesas (R$)</Label>
            <Input
              id="st-frete"
              type="number"
              min={0}
              value={frete}
              onChange={(e) => setFrete(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-ipi">IPI destacado (R$)</Label>
            <Input
              id="st-ipi"
              type="number"
              min={0}
              value={ipi}
              onChange={(e) => setIpi(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-desc">Descontos incondicionais (R$)</Label>
            <Input
              id="st-desc"
              type="number"
              min={0}
              value={descontos}
              onChange={(e) => setDescontos(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-ncm">NCM (8 dígitos)</Label>
            <Input
              id="st-ncm"
              inputMode="numeric"
              maxLength={10}
              placeholder="87082999"
              value={ncm}
              onChange={(e) => setNcm(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {carregandoCatalogos
                ? 'Carregando protocolos de ST…'
                : resolucao.encontrado
                  ? `Protocolo ${resolucao.protocolo} · MVA ${pct(resolucao.mvaOriginal)}${resolucao.cest ? ` · CEST ${resolucao.cest}` : ''}`
                  : 'Sem protocolo vigente para o NCM neste par de UFs.'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-situacao">Situação do ICMS</Label>
            <Select
              value={situacaoIcms}
              onValueChange={(v) => setSituacaoIcms(v as SituacaoIcmsSt)}
            >
              <SelectTrigger id="st-situacao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITUACOES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-mva">MVA-ST original (decimal)</Label>
            <Input
              id="st-mva"
              type="number"
              step="0.0001"
              min={0}
              disabled={usarProtocolo && resolucao.encontrado}
              value={usarProtocolo && resolucao.encontrado ? resolucao.mvaOriginal : mvaOriginal}
              onChange={(e) => setMvaOriginal(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3 md:col-span-3">
            <Label htmlFor="st-protocolo" className="cursor-pointer">
              Usar MVA do protocolo de ST quando houver
              {resolucao.encontrado ? '' : ' (nenhum aplicável agora)'}
            </Label>
            <Switch id="st-protocolo" checked={usarProtocolo} onCheckedChange={setUsarProtocolo} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-pmpf">PMPF / pauta (R$ — 0 desativa)</Label>
            <Input
              id="st-pmpf"
              type="number"
              min={0}
              value={pmpf}
              onChange={(e) => setPmpf(Number(e.target.value))}
            />
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
          {
            t: 'Alíquota interestadual',
            v: pct(r.aliquotaInterestadual),
            n: r.operacaoInterestadual ? 'RSF 22/1989 e 13/2012' : 'Operação interna',
          },
          {
            t: 'MVA ajustada',
            v: r.usouPmpf ? '—' : pct(r.mvaAjustada),
            n: `MVA original ${pct(r.mvaOriginal)}`,
          },
          {
            t: 'Protocolo ST',
            v: r.protocoloSt ?? '—',
            n: r.stAfastadaPorRegraJuridica
              ? 'ST afastada por regra jurídica'
              : r.cestSt
                ? `CEST ${r.cestSt}`
                : 'MVA informada manualmente',
          },
          {
            t: 'Base da ST',
            v: brl(r.baseSt),
            n: r.usouPmpf ? 'PMPF/pauta' : 'Base própria + IPI × (1 + MVA aj.)',
          },
          {
            t: 'Total a recolher',
            v: brl(r.totalRecolher),
            n: `ST ${brl(r.icmsSt)} + FCP ${brl(r.fcpSt)}`,
          },
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
        <Alert key={a}>
          <Info className="h-4 w-4" />
          <AlertDescription>{a}</AlertDescription>
        </Alert>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Memória de cálculo da ST</CardTitle>
          <CardDescription>
            Valor total da nota ao adquirente: {brl(r.valorTotalNota)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemoriaTable linhas={r.linhas} />
        </CardContent>
      </Card>
    </div>
  );
}
