// ============================================
// MODAL: Importar CSV (faturamento ou folha)
// Preview, validação e UPSERT em lote
// ============================================

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { parseCsv, downloadCsvTemplate, type CsvKind, type FaturamentoRow, type FolhaRow } from '@/lib/csv-importer';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: CsvKind;
  empresaId: string;
  onImport: (rows: (FaturamentoRow | FolhaRow)[]) => Promise<void>;
}

export function CsvImportDialog({ open, onOpenChange, kind, empresaId, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  type ParseResult = Awaited<ReturnType<typeof parseCsv<FaturamentoRow | FolhaRow>>>;
  const [result, setResult] = useState<ParseResult | null>(null);
  const [filename, setFilename] = useState<string>('');

  const handleFile = async (file: File) => {
    if (!file) return;
    setFilename(file.name);
    setParsing(true);
    try {
      const r = await parseCsv<FaturamentoRow | FolhaRow>(file, kind);
      setResult(r);
      if (r.rows.length === 0) {
        toast.error('Nenhuma linha válida encontrada.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao ler CSV');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!result || result.rows.length === 0 || !empresaId) return;
    setImporting(true);
    try {
      await onImport(result.rows);
      toast.success(`${result.rows.length} registro(s) importado(s) com sucesso.`);
      onOpenChange(false);
      setResult(null);
      setFilename('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha na importação');
    } finally {
      setImporting(false);
    }
  };

  const renderRow = (r: FaturamentoRow | FolhaRow, i: number) => {
    if (kind === 'faturamento') {
      const f = r as FaturamentoRow;
      return (
        <TableRow key={i}>
          <TableCell>{String(f.mes).padStart(2, '0')}/{f.ano}</TableCell>
          <TableCell className="text-right font-medium">{formatCurrency(f.receita_bruta)}</TableCell>
          <TableCell className="text-right">{formatCurrency(f.receita_servicos)}</TableCell>
          <TableCell className="text-right">{formatCurrency(f.receita_revenda)}</TableCell>
          <TableCell className="text-right">{formatCurrency(f.receita_industria)}</TableCell>
          <TableCell className="text-right">{formatCurrency(f.receita_exportacao)}</TableCell>
        </TableRow>
      );
    }
    const f = r as FolhaRow;
    return (
      <TableRow key={i}>
        <TableCell>{String(f.mes).padStart(2, '0')}/{f.ano}</TableCell>
        <TableCell className="text-right">{formatCurrency(f.salarios)}</TableCell>
        <TableCell className="text-right">{formatCurrency(f.pro_labore)}</TableCell>
        <TableCell className="text-right">{formatCurrency(f.encargos)}</TableCell>
        <TableCell className="text-right font-medium">{formatCurrency(f.total_folha)}</TableCell>
        <TableCell className="text-right">{f.numero_funcionarios}</TableCell>
      </TableRow>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar CSV — {kind === 'faturamento' ? 'Faturamento Mensal' : 'Folha de Pagamento'}
          </DialogTitle>
          <DialogDescription>
            Aceita UTF-8 ou Latin-1, separadores `,` `;` ou tab. Detecção automática.
            Valores BR (1.234,56) ou US (1234.56). Linhas duplicadas (mesmo ano/mês) são atualizadas (UPSERT).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            aria-label="Selecionar arquivo CSV"
          />
          <Button onClick={() => inputRef.current?.click()} disabled={parsing}>
            <Upload className="h-4 w-4 mr-2" />
            {parsing ? 'Lendo…' : 'Escolher arquivo CSV'}
          </Button>
          <Button variant="outline" onClick={() => downloadCsvTemplate(kind)}>
            <Download className="h-4 w-4 mr-2" />
            Baixar template
          </Button>
          {filename && (
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              {filename}
            </Badge>
          )}
        </div>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded border bg-muted/30">
                <p className="text-xs text-muted-foreground">Linhas válidas</p>
                <p className="text-xl font-bold text-success">{result.rows.length}</p>
              </div>
              <div className="p-3 rounded border bg-muted/30">
                <p className="text-xs text-muted-foreground">Erros</p>
                <p className="text-xl font-bold text-destructive">{result.errors.length}</p>
              </div>
              <div className="p-3 rounded border bg-muted/30">
                <p className="text-xs text-muted-foreground">Separador</p>
                <p className="text-xl font-bold">{result.separator === '\t' ? 'TAB' : result.separator}</p>
              </div>
              <div className="p-3 rounded border bg-muted/30">
                <p className="text-xs text-muted-foreground">Encoding</p>
                <p className="text-xl font-bold uppercase">{result.encoding}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Alert variant="error">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{result.errors.length} erro(s) de validação</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-xs max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 20).map((e, i) => (
                      <li key={i}>Linha {e.line}: {e.message}</li>
                    ))}
                    {result.errors.length > 20 && <li>… e mais {result.errors.length - 20}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.rows.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  Preview (10 primeiras linhas de {result.rows.length})
                </div>
                <Table>
                  <TableHeader>
                    {kind === 'faturamento' ? (
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Bruta</TableHead>
                        <TableHead className="text-right">Serviços</TableHead>
                        <TableHead className="text-right">Revenda</TableHead>
                        <TableHead className="text-right">Indústria</TableHead>
                        <TableHead className="text-right">Exportação</TableHead>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Salários</TableHead>
                        <TableHead className="text-right">Pró-labore</TableHead>
                        <TableHead className="text-right">Encargos</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Func.</TableHead>
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>{result.rows.slice(0, 10).map(renderRow)}</TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!result?.rows.length || importing}>
            {importing ? 'Importando…' : `Importar ${result?.rows.length ?? 0} registro(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
