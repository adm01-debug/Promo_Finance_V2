import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useConsultaUF } from '@/hooks/useConsultaTributaria';
import { MatchBadge } from './MatchBadge';
import { OfflineBadge } from './OfflineBadge';
import { ResultBlock, UFS } from './shared';
import { pct } from './format';

/**
 * Consulta por UF: alíquota interna + FCP, alíquota interestadual para a UF de
 * destino, protocolos de ST, benefícios fiscais e ISS municipal (se informado).
 */
export function ConsultaUFTab() {
  const [uf, setUf] = useState<string>('SP');
  const [ufDestino, setUfDestino] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('');
  const [municipio, setMunicipio] = useState<string>('');

  const municipioNum = /^\d{5,7}$/.test(municipio) ? Number(municipio) : undefined;
  const query = useConsultaUF(uf, {
    uf_destino: ufDestino || undefined,
    categoria: categoria.trim() || undefined,
    municipio: municipioNum,
  });
  const d = query.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="uf-origem">UF de origem</Label>
          <Select value={uf} onValueChange={setUf}>
            <SelectTrigger id="uf-origem"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>
              {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="uf-destino">UF de destino (opcional)</Label>
          <Select value={ufDestino || '__none'} onValueChange={(v) => setUfDestino(v === '__none' ? '' : v)}>
            <SelectTrigger id="uf-destino"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Nenhuma</SelectItem>
              {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoria">Categoria do produto</Label>
          <Input
            id="categoria"
            placeholder="GERAL, ENERGIA…"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="municipio">Código IBGE do município</Label>
          <Input
            id="municipio"
            inputMode="numeric"
            placeholder="3550308"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value.replace(/\D/g, '').slice(0, 7))}
          />
        </div>
      </div>

      <ResultBlock
        title={`ICMS — ${uf}`}
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={!query.isLoading && !d}
        actions={<div className="flex items-center gap-1.5"><OfflineBadge data={d} /><MatchBadge match={d?.match} /></div>}
      >
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Alíquota interna</dt>
            <dd className="text-lg font-semibold">{pct(d?.aliquota_interna?.aliquota)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">FCP</dt>
            <dd className="text-lg font-semibold">{pct(d?.aliquota_interna?.aliquota_fcp)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              Interestadual{ufDestino ? ` → ${ufDestino}` : ''}
            </dt>
            <dd className="text-lg font-semibold">{pct(d?.interestadual?.aliquota)}</dd>
          </div>
        </dl>
        {d?.aliquota_interna?.base_legal && (
          <p className="mt-3 text-xs text-muted-foreground">
            Base legal: {d.aliquota_interna.base_legal}
          </p>
        )}
        {d?.categorias_disponiveis?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {d.categorias_disponiveis.map((c) => (
              <Badge key={c} variant="outline" className="font-normal">{c}</Badge>
            ))}
          </div>
        ) : null}
      </ResultBlock>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ResultBlock
          title="Protocolos de ST"
          isLoading={query.isLoading}
          error={query.error}
          isEmpty={!d?.protocolos_st?.length}
        >
          <p className="text-2xl font-semibold">{d?.protocolos_st?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">protocolos vigentes para a UF</p>
        </ResultBlock>
        <ResultBlock
          title="Benefícios fiscais"
          isLoading={query.isLoading}
          error={query.error}
          isEmpty={!d?.beneficios_fiscais?.length}
        >
          <p className="text-2xl font-semibold">{d?.beneficios_fiscais?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">incentivos mapeados</p>
        </ResultBlock>
        <ResultBlock
          title="ISS municipal"
          isLoading={query.isLoading}
          error={query.error}
          isEmpty={!d?.iss_municipal?.length}
          emptyLabel="Informe o código IBGE para consultar o ISS."
        >
          <p className="text-2xl font-semibold">{d?.iss_municipal?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">itens da lista de serviços</p>
        </ResultBlock>
      </div>
    </div>
  );
}
