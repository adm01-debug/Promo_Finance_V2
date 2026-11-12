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
import { ALIQUOTAS_UF, calcularDifal } from '@/lib/tributario/icms';
import type { OrigemMercadoria, UF } from '@/lib/tributario/icms';
import { UfSelect } from './UfSelect';
import { ORIGENS, pct, brl } from './IcmsStDifal.helpers';
import { MemoriaTable } from './MemoriaTable';

export function DiferencialAliquotas() {
  const [ufOrigem, setUfOrigem] = useState<UF>('SP');
  const [ufDestino, setUfDestino] = useState<UF>('MG');
  const [valorOperacao, setValorOperacao] = useState(10_000);
  const [contribuinte, setContribuinte] = useState(false);
  const [aplicarFcp, setAplicarFcp] = useState(true);
  const [origem, setOrigem] = useState<OrigemMercadoria>(0);

  const r = useMemo(
    () =>
      calcularDifal({
        ufOrigem,
        ufDestino,
        valorOperacao,
        destinatarioContribuinte: contribuinte,
        aplicarFcp,
        origem,
      }),
    [ufOrigem, ufDestino, valorOperacao, contribuinte, aplicarFcp, origem]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operação interestadual a consumidor final</CardTitle>
          <CardDescription>
            Base dupla para não contribuinte (LC 190/2022, art. 13) e base única para contribuinte
            do ICMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <UfSelect id="df-origem" label="UF de origem" value={ufOrigem} onChange={setUfOrigem} />
          <UfSelect
            id="df-destino"
            label="UF de destino"
            value={ufDestino}
            onChange={setUfDestino}
          />
          <div className="space-y-2">
            <Label htmlFor="df-valor">Valor da operação (R$)</Label>
            <Input
              id="df-valor"
              type="number"
              min={0}
              value={valorOperacao}
              onChange={(e) => setValorOperacao(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="df-origem-merc">Origem da mercadoria (CST)</Label>
            <Select
              value={String(origem)}
              onValueChange={(v) => setOrigem(Number(v) as OrigemMercadoria)}
            >
              <SelectTrigger id="df-origem-merc">
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
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="df-contrib" className="cursor-pointer">
              Destinatário contribuinte do ICMS
            </Label>
            <Switch id="df-contrib" checked={contribuinte} onCheckedChange={setContribuinte} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label htmlFor="df-fcp" className="cursor-pointer">
              Aplicar FCP ({pct(ALIQUOTAS_UF[ufDestino].fcp)})
            </Label>
            <Switch id="df-fcp" checked={aplicarFcp} onCheckedChange={setAplicarFcp} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            t: 'Interestadual × interna',
            v: `${pct(r.aliquotaInterestadual)} → ${pct(r.aliquotaInternaDestino)}`,
            n: 'Alíquotas da operação',
          },
          {
            t: 'Base de destino',
            v: brl(r.baseDestino),
            n: contribuinte ? 'Base única' : 'Base dupla (por dentro)',
          },
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
        <Alert key={a}>
          <Info className="h-4 w-4" />
          <AlertDescription>{a}</AlertDescription>
        </Alert>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Memória de cálculo do DIFAL</CardTitle>
        </CardHeader>
        <CardContent>
          <MemoriaTable linhas={r.linhas} />
        </CardContent>
      </Card>
    </div>
  );
}
