// ============================================
// COMPONENTE: IMPORTAÇÃO XML NF-e
// ============================================

import { useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Trash2, FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImportacaoXMLNFe } from '@/hooks/useImportacaoXMLNFe';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  empresaId: string;
}

export function ImportacaoXMLPanel({ empresaId }: Props) {
  const { nfesParsed, isProcessando, progresso, processarArquivos, importarNFes, limparArquivos, removerNFe } = useImportacaoXMLNFe(empresaId);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) processarArquivos(e.dataTransfer.files);
  }, [processarArquivos]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processarArquivos(e.target.files);
  }, [processarArquivos]);

  const nfesPendentes = nfesParsed.filter(n => n.status === 'pendente');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Importação de XML NF-e</h2>
          <p className="text-sm text-muted-foreground">Upload em lote para geração de créditos CBS/IBS</p>
        </div>
        {nfesParsed.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={limparArquivos}><Trash2 className="mr-2 h-4 w-4" />Limpar</Button>
            <Button onClick={() => importarNFes.mutate()} disabled={nfesPendentes.length === 0 || importarNFes.isPending}>
              <FileUp className="mr-2 h-4 w-4" />Importar ({nfesPendentes.length})
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
              onDragOver={e => e.preventDefault()}
              onClick={() => document.getElementById('xml-input')?.click()}
            >
              <input id="xml-input" type="file" accept=".xml" multiple className="hidden" onChange={handleFileSelect} />
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
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nfesParsed.map((nfe, idx) => (
                    <TableRow key={nfe.chaveAcesso || idx}>
                      <TableCell className="font-mono">{nfe.numero || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{nfe.nomeEmitente || 'N/I'}</TableCell>
                      <TableCell>{nfe.dataEmissao.toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(nfe.valorTotal)}</TableCell>
                      <TableCell>
                        <Badge variant={nfe.status === 'importado' ? 'default' : nfe.status === 'erro' ? 'destructive' : 'secondary'}>
                          {nfe.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removerNFe(nfe.chaveAcesso)}>
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
