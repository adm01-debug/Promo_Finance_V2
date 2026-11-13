import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIPI, calcularIpi } from '@/lib/tributario/ipi-iss';
import { pct, brl } from './IpiIss.helpers';
import { NumberField } from './NumberField';
import { Alertas } from './Alertas';
import { MemoriaTable } from './IpiIss.MemoriaTable';

export function IpiSimulador() {
  const [ncm, setNcm] = useState('96081000');
  const [valorProduto, setValorProduto] = useState(10_000);
  const [frete, setFrete] = useState(0);
  const [outras, setOutras] = useState(0);
  const [descontos, setDescontos] = useState(0);
  const [credito, setCredito] = useState(0);
  const [contribuinte, setContribuinte] = useState(true);

  const r = useMemo(
    () =>
      calcularIpi({
        ncm,
        valorProduto,
        frete,
        outrasDespesas: outras,
        descontosIncondicionais: descontos,
        creditoEntradas: credito,
        contribuinte,
      }),
    [ncm, valorProduto, frete, outras, descontos, credito, contribuinte]
  );

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
              <SelectTrigger id="ipi-ncm">
                <SelectValue />
              </SelectTrigger>
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
          <NumberField
            id="ipi-valor"
            label="Valor dos produtos"
            value={valorProduto}
            onChange={setValorProduto}
          />
          <NumberField id="ipi-frete" label="Frete" value={frete} onChange={setFrete} />
          <NumberField
            id="ipi-outras"
            label="Outras despesas"
            value={outras}
            onChange={setOutras}
          />
          <NumberField
            id="ipi-desc"
            label="Descontos incondicionais"
            value={descontos}
            onChange={setDescontos}
          />
          <NumberField
            id="ipi-credito"
            label="Crédito de entradas"
            value={credito}
            onChange={setCredito}
          />
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
            <CardDescription>IPI devido</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{brl(r.ipiDevido)}</p>
            <Badge variant="secondary" className="mt-2">
              {r.situacao.replace(/_/g, ' ')} · {pct(r.aliquota)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo apurado</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold tabular-nums ${r.saldoApurado < 0 ? 'text-success' : 'text-foreground'}`}
            >
              {brl(r.saldoApurado)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total da nota</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{brl(r.valorTotalNota)}</p>
          </CardContent>
        </Card>
      </div>

      <Alertas alertas={r.alertas} />
      <Card>
        <CardHeader>
          <CardTitle>Memória de cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <MemoriaTable linhas={r.memoria} />
        </CardContent>
      </Card>
    </div>
  );
}
