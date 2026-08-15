import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useConsultaCNAE } from '@/hooks/useConsultaTributaria';
import { MatchBadge } from './MatchBadge';
import { OfflineBadge } from './OfflineBadge';
import { ResultBlock } from './shared';
import { pct } from './format';

/** Consulta por CNAE: anexo do Simples, Fator R, vedações e presunções. */
export function ConsultaCnaeTab() {
  const [codigo, setCodigo] = useState('6201-5/01');
  const query = useConsultaCNAE(codigo.trim() || undefined);
  const cnae = query.data?.cnae;

  return (
    <div className="space-y-4">
      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="cnae">Código CNAE</Label>
        <Input
          id="cnae"
          placeholder="6201-5/01"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Pontuação é ignorada; prefixos parciais acionam fallback hierárquico.
        </p>
      </div>

      <ResultBlock
        title={cnae?.descricao ?? 'Resultado'}
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={!query.isLoading && !cnae}
        actions={<div className="flex items-center gap-1.5"><OfflineBadge data={query.data} /><MatchBadge match={query.data?.match} /></div>}
      >
        <dl className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Código</dt>
            <dd className="font-semibold">{cnae?.codigo ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Anexo Simples</dt>
            <dd className="font-semibold">{cnae?.anexo_simples ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Presunção IRPJ</dt>
            <dd className="font-semibold">{pct(cnae?.presuncao_irpj)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Presunção CSLL</dt>
            <dd className="font-semibold">{pct(cnae?.presuncao_csll)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {cnae?.sujeito_fator_r && <Badge variant="secondary">Sujeito ao Fator R</Badge>}
          {cnae?.vedado_simples && <Badge variant="destructive">Vedado ao Simples</Badge>}
        </div>
        {query.data?.alternativas?.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {query.data.alternativas.length} CNAE(s) alternativo(s) no mesmo prefixo.
          </p>
        ) : null}
      </ResultBlock>
    </div>
  );
}
