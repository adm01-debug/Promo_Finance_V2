import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useClassificacaoTributaria } from '@/hooks/useCatalogoCclasstrib';
import {
  cstsDoCatalogo,
  montarLinhasCclasstrib,
} from '@/lib/tributario/catalogos/cclasstrib-reducao';
import { OfflineBadge } from './OfflineBadge';
import { ResultBlock } from './shared';
import { pct } from './format';

const LIMITE_CLASSIFICACOES = 50;

/**
 * Etapa 84: cClassTrib vigentes com a redução de CBS/IBS e a norma que as
 * fundamenta. Sem mapeamento oficial NCM → cClassTrib, o caminho honesto é o
 * contador escolher o CST e ver as classificações válidas para ele.
 */
export function SecaoClassificacaoTributaria() {
  const { opcoes, fundamentos, carregando, indisponivel, offline, offlineGravadoEm } =
    useClassificacaoTributaria();
  const [cst, setCst] = useState('');
  const [busca, setBusca] = useState('');

  const csts = useMemo(() => cstsDoCatalogo(opcoes), [opcoes]);
  const linhas = useMemo(
    () => montarLinhasCclasstrib(opcoes, fundamentos, { cst, busca }),
    [opcoes, fundamentos, cst, busca]
  );
  const visiveis = linhas.slice(0, LIMITE_CLASSIFICACOES);

  return (
    <ResultBlock
      title="Classificação tributária (IBS/CBS)"
      isLoading={carregando}
      error={null}
      isEmpty={indisponivel}
      emptyLabel="Catálogo de classificação tributária ainda não sincronizado (carga da RFB pendente)."
      actions={
        offline ? (
          <OfflineBadge data={{ _offline: { origem: 'cache', gravadoEm: offlineGravadoEm } }} />
        ) : null
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cclasstrib-cst">CST / situação tributária</Label>
            <Select
              value={cst || '__todas'}
              onValueChange={(v) => setCst(v === '__todas' ? '' : v)}
            >
              <SelectTrigger id="cclasstrib-cst" className="w-48">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todas">Todas</SelectItem>
                {csts.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cclasstrib-busca">Filtrar por código ou descrição</Label>
            <Input
              id="cclasstrib-busca"
              className="w-64"
              placeholder="200035, isenção, redução…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma classificação vigente para o filtro informado.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>cClassTrib</TableHead>
                    <TableHead>CST</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Red. CBS</TableHead>
                    <TableHead className="text-right">Red. IBS UF</TableHead>
                    <TableHead className="text-right">Red. IBS Mun</TableHead>
                    <TableHead>Fundamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((linha) => (
                    <TableRow key={`${linha.cclasstrib}-${linha.cst}`}>
                      <TableCell className="font-mono text-xs">
                        {linha.cclasstrib}
                        {linha.exigeGibscbs && (
                          <Badge variant="outline" className="ml-1 font-normal">
                            IBS/CBS
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{linha.cst || '—'}</TableCell>
                      <TableCell className="max-w-md">{linha.descricao || '—'}</TableCell>
                      <TableCell className="text-right">{pct(linha.pRedCbs)}</TableCell>
                      <TableCell className="text-right">{pct(linha.pRedIbsUf)}</TableCell>
                      <TableCell className="text-right">{pct(linha.pRedIbsMun)}</TableCell>
                      <TableCell className="max-w-xs align-top text-xs">
                        {linha.fundamento ? (
                          <span title={linha.fundamento.texto}>
                            <span className="font-medium">{linha.fundamento.referencia}</span>
                            <span className="block truncate text-muted-foreground">
                              {linha.fundamento.texto}
                            </span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {linhas.length > visiveis.length && (
              <p className="text-xs text-muted-foreground">
                Mostrando {visiveis.length} de {linhas.length} classificações — refine o filtro.
              </p>
            )}
          </>
        )}
      </div>
    </ResultBlock>
  );
}
