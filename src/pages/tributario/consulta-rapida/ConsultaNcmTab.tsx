import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useConsultaNCM } from '@/hooks/useConsultaTributaria';
import { MatchBadge } from './MatchBadge';
import { ResultBlock, UFS, pct } from './shared';

/**
 * Consulta por NCM. Com código preenchido devolve o detalhe (IPI, CEST,
 * monofásico, cenário de ST/MVA); sem código, lista NCMs filtrados por
 * monofásico e/ou sujeição à substituição tributária.
 */
export function ConsultaNcmTab() {
  const [codigo, setCodigo] = useState('22021000');
  const [uf, setUf] = useState('');
  const [ufDestino, setUfDestino] = useState('');
  const [monofasico, setMonofasico] = useState(false);
  const [st, setSt] = useState(false);

  const query = useConsultaNCM(codigo.trim() || undefined, {
    uf: uf || undefined,
    uf_destino: ufDestino || undefined,
    monofasico: monofasico || undefined,
    st: st || undefined,
    limite: 50,
  });
  const d = query.data;
  const listagem = d?.modo === 'listagem';
  const ncm = d?.ncm;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="ncm">Código NCM (vazio = listagem)</Label>
          <Input
            id="ncm"
            placeholder="2202.10.00"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ncm-uf">UF de origem</Label>
          <Select value={uf || '__none'} onValueChange={(v) => setUf(v === '__none' ? '' : v)}>
            <SelectTrigger id="ncm-uf"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Nenhuma</SelectItem>
              {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ncm-uf-destino">UF de destino</Label>
          <Select value={ufDestino || '__none'} onValueChange={(v) => setUfDestino(v === '__none' ? '' : v)}>
            <SelectTrigger id="ncm-uf-destino"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Nenhuma</SelectItem>
              {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-6">
          <div className="flex items-center gap-2">
            <Switch id="f-mono" checked={monofasico} onCheckedChange={setMonofasico} />
            <Label htmlFor="f-mono">Monofásico</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="f-st" checked={st} onCheckedChange={setSt} />
            <Label htmlFor="f-st">Sujeito a ST</Label>
          </div>
        </div>
      </div>

      {listagem ? (
        <ResultBlock
          title={`NCMs filtrados (${d?.ncms?.length ?? 0})`}
          isLoading={query.isLoading}
          error={query.error}
          isEmpty={!d?.ncms?.length}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">IPI</TableHead>
                  <TableHead className="text-right">MVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d?.ncms?.map((n) => (
                  <TableRow key={n.codigo}>
                    <TableCell className="font-mono text-xs">{n.codigo}</TableCell>
                    <TableCell className="max-w-md truncate">{n.descricao ?? '—'}</TableCell>
                    <TableCell className="text-right">{pct(n.aliquota_ipi)}</TableCell>
                    <TableCell className="text-right">{pct(n.mva_padrao)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ResultBlock>
      ) : (
        <ResultBlock
          title={ncm?.descricao ?? 'Detalhe do NCM'}
          isLoading={query.isLoading}
          error={query.error}
          isEmpty={!query.isLoading && !ncm}
          actions={<MatchBadge match={d?.match} />}
        >
          <dl className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Código</dt>
              <dd className="font-mono font-semibold">{ncm?.codigo ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">IPI</dt>
              <dd className="font-semibold">{pct(ncm?.aliquota_ipi)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">CEST</dt>
              <dd className="font-semibold">{ncm?.cest ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">MVA sugerida</dt>
              <dd className="font-semibold">{pct(d?.cenario_st?.mva_sugerida ?? ncm?.mva_padrao)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {d?.monofasico && <Badge variant="secondary">PIS/COFINS monofásico</Badge>}
            {d?.cenario_st?.aplicavel && (
              <Badge variant="outline">ST aplicável · {d.cenario_st.estrategia}</Badge>
            )}
          </div>
          {d?.alternativas?.length ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {d.alternativas.length} NCM(s) no mesmo prefixo hierárquico.
            </p>
          ) : null}
        </ResultBlock>
      )}
    </div>
  );
}
