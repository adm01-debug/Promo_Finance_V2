// COMPONENTE: IMPORTAÇÃO XML NF-e

import { useCallback } from 'react';
import { Upload, Trash2, FileUp, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useImportacaoXMLNFe,
  anoEmissao,
  ANO_INICIO_APROPRIACAO,
} from '@/hooks/useImportacaoXMLNFe';
import type { NFeParsed } from '@/hooks/useImportacaoXMLNFe';
import { formatCurrency } from '@/lib/formatters';
import GlossarioTooltip from './GlossarioTooltip';
import { baixarAlertasFiscaisPdf } from '@/lib/tributario/relatorio-pdf/alertas-fiscais';

interface Props {
  empresaId: string;
}

/**
 * Etapa 47: sinaliza na tabela se o grupo IBS/CBS da nota gera crédito
 * aproveitável ou é apenas informativo (ano de teste de 2026).
 */
function getBadgeIbscbs(nfe: NFeParsed) {
  const temRegular = nfe.ibscbs?.vIBS !== undefined || nfe.ibscbs?.vCBS !== undefined;
  const temMono = nfe.ibscbs?.vTotIBSMono !== undefined || nfe.ibscbs?.vTotCBSMono !== undefined;
  const temGrupo = temRegular || temMono;

  if (!temGrupo) {
    return (
      <Badge variant="outline" title="XML sem grupo IBS/CBS — crédito será estimado">
        sem grupo
      </Badge>
    );
  }

  // Só monofásico: o valor está destacado, mas fora do regime regular —
  // o importador grava crédito zero nesse caso, então não é apropriável.
  if (!temRegular) {
    return (
      <Badge variant="outline" title="Apenas grupo monofásico — não gera crédito regular">
        monofásico
      </Badge>
    );
  }

  const ano = anoEmissao(nfe.dataEmissao);
  if (ano < ANO_INICIO_APROPRIACAO) {
    return (
      <Badge
        variant="secondary"
        title={`Destacado no XML, mas ${ano} é ano de teste: não gera crédito apropriável`}
      >
        informativo {ano}
      </Badge>
    );
  }

  return (
    <Badge variant="default" title="Valor destacado no XML e apropriável">
      apropriável
    </Badge>
  );
}

/**
 * Etapa 46: divergência entre o que a nota declarou e o catálogo oficial.
 * É alerta, não bloqueio — a nota entra de qualquer forma, e o tooltip mostra
 * a mensagem de cada regra para o usuário conferir com o contador.
 */
function getBadgeFiscal(nfe: NFeParsed) {
  // A validação só roda na gravação: na prévia a ausência de alertas não
  // significa conformidade, significa que ninguém conferiu ainda.
  if (nfe.status !== 'importado') {
    return (
      <Badge
        variant="outline"
        title={
          nfe.status === 'erro'
            ? 'A importação falhou: a conferência fiscal não rodou'
            : 'A conferência roda na importação'
        }
      >
        não conferido
      </Badge>
    );
  }

  const alertas = nfe.alertasFiscais ?? [];
  if (alertas.length === 0) {
    return (
      <Badge variant="outline" title="NCM/CST/cClassTrib conferem com o catálogo">
        ok
      </Badge>
    );
  }
  const badge = (
    <Badge
      variant="destructive"
      title={alertas.map((a) => `${a.codigo}: ${a.mensagem}`).join('\n')}
    >
      {alertas.length} alerta{alertas.length > 1 ? 's' : ''}
    </Badge>
  );

  // Etapa 82: a norma do que foi apontado, quando o catalogo de fundamentacoes
  // tem a linha vigente. Sem fundamento o badge fica igual - o alerta nao
  // depende do catalogo para valer.
  const fundamentoTexto = [
    ...new Set(
      alertas
        .map((a) => a.fundamento)
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .map((f) => `${f.referencia}: ${f.texto}`)
    ),
  ].join(' • ');

  if (!fundamentoTexto) return badge;

  return (
    <GlossarioTooltip termo="Fundamento legal (LC 214/2025)" fundamento={fundamentoTexto}>
      {badge}
    </GlossarioTooltip>
  );
}

export function ImportacaoXMLPanel({ empresaId }: Props) {
  const {
    nfesParsed,
    isProcessando,
    progresso,
    processarArquivos,
    importarNFes,
    limparArquivos,
    removerNFe,
  } = useImportacaoXMLNFe(empresaId);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) processarArquivos(e.dataTransfer.files);
    },
    [processarArquivos]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) processarArquivos(e.target.files);
    },
    [processarArquivos]
  );

  // Etapa 82: leva a lista de divergencias com a norma de cada uma para o PDF.
  const handleBaixarAlertas = useCallback(() => {
    baixarAlertasFiscaisPdf(
      nfesParsed
        .filter((n) => (n.alertasFiscais?.length ?? 0) > 0)
        .map((n) => ({
          numero: n.numero || '',
          emitente: n.nomeEmitente || '',
          data: n.dataEmissao.toLocaleDateString('pt-BR'),
          alertas: n.alertasFiscais ?? [],
        }))
    );
  }, [nfesParsed]);

  const nfesPendentes = nfesParsed.filter((n) => n.status === 'pendente');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Importação de XML NF-e</h2>
          <p className="text-sm text-muted-foreground">
            Upload em lote para geração de créditos CBS/IBS
          </p>
        </div>
        {nfesParsed.length > 0 && (
          <div className="flex gap-2">
            {nfesParsed.some((n) => (n.alertasFiscais?.length ?? 0) > 0) && (
              <Button variant="outline" onClick={handleBaixarAlertas}>
                <FileDown className="mr-2 h-4 w-4" />
                Alertas (PDF)
              </Button>
            )}
            <Button variant="outline" onClick={limparArquivos}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button
              onClick={() => importarNFes.mutate()}
              disabled={nfesPendentes.length === 0 || importarNFes.isPending}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Importar ({nfesPendentes.length})
            </Button>
          </div>
        )}
      </div>

      {nfesParsed.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-muted/50"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('xml-input')?.click()}
            >
              <input
                id="xml-input"
                type="file"
                accept=".xml"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Arraste arquivos XML aqui</p>
              <p className="text-muted-foreground">ou clique para selecionar</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isProcessando && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm mb-2">Processando... {progresso.toFixed(0)}%</p>
            <Progress value={progresso} />
          </CardContent>
        </Card>
      )}

      {nfesParsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>NF-e Processadas ({nfesParsed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Emitente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>CST</TableHead>
                    <TableHead>cClassTrib</TableHead>
                    <TableHead className="text-right">vIBS</TableHead>
                    <TableHead className="text-right">vCBS</TableHead>
                    <TableHead>IBS/CBS</TableHead>
                    <TableHead>Fiscal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nfesParsed.map((nfe, idx) => (
                    <TableRow key={nfe.chaveAcesso || idx}>
                      <TableCell className="font-mono">{nfe.numero || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {nfe.nomeEmitente || 'N/I'}
                      </TableCell>
                      <TableCell>{nfe.dataEmissao.toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(nfe.valorTotal)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {nfe.itens[0]?.ibscbs?.cst ?? '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {nfe.itens[0]?.ibscbs?.cClassTrib ?? '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {nfe.ibscbs?.vIBS !== undefined ? formatCurrency(nfe.ibscbs.vIBS) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {nfe.ibscbs?.vCBS !== undefined ? formatCurrency(nfe.ibscbs.vCBS) : '-'}
                      </TableCell>
                      <TableCell>{getBadgeIbscbs(nfe)}</TableCell>
                      <TableCell>{getBadgeFiscal(nfe)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            nfe.status === 'importado'
                              ? 'default'
                              : nfe.status === 'erro'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {nfe.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerNFe(nfe.chaveAcesso)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ImportacaoXMLPanel;
