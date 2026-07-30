import { AlertCircle, CheckCircle2, Download, Gauge, Loader2, Timer, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ImportLoteResult } from '@/hooks/useLancamentosContabeis';
import { formatDuration, formatPct, formatRate, type ImportProgress } from './format-helpers';

interface Props {
  isPending: boolean;
  progress: ImportProgress;
  importResult: ImportLoteResult | null;
  onClose: () => void;
}

export function ResultStep({ isPending, progress, importResult, onClose }: Props) {
  return (
    <div className="space-y-4">
      {isPending ? (
        <>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <Progress
            value={progress.total > 0 ? (progress.done / progress.total) * 100 : 0}
            aria-label={`Importação em ${formatPct(progress.done, progress.total)}%`}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
            <span>
              Importando <span className="font-medium text-foreground">{progress.done}</span> de{' '}
              <span className="font-medium text-foreground">{progress.total}</span>
              {' '}({formatPct(progress.done, progress.total)}%)
            </span>
            <span className="font-mono">{formatDuration(progress.elapsedMs)}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-2.5 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Taxa</div>
                  <div className="text-sm font-semibold tabular-nums truncate">
                    {progress.rate > 0 ? formatRate(progress.rate) : '—'}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2.5 flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Tempo restante</div>
                  <div className="text-sm font-semibold tabular-nums truncate">
                    {progress.done >= progress.total
                      ? 'finalizando…'
                      : progress.etaMs > 0 ? formatDuration(progress.etaMs) : 'calculando…'}
                  </div>
                </div>
              </CardContent>
            </Card>
            {progress.chunkSize ? (
              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="p-2.5 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Lote atual</div>
                    <div className="text-sm font-semibold tabular-nums truncate">{progress.chunkSize} / lote</div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </>
      ) : importResult ? (
        <>
          <Alert variant={importResult.falhas.length === 0 ? 'success' : 'error'}>
            {importResult.falhas.length === 0
              ? <CheckCircle2 className="h-4 w-4 text-success" />
              : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>
              {importResult.falhas.length === 0 ? 'Importação concluída' : 'Importação concluída com falhas'}
            </AlertTitle>
            <AlertDescription>
              {importResult.sucesso} sucesso(s) · {importResult.falhas.length} falha(s){importResult.pulados ? ` · ${importResult.pulados} pulado(s) por checkpoint` : ''}
            </AlertDescription>
          </Alert>

          {importResult.falhas.length > 0 && <FalhasAgrupadas importResult={importResult} />}

          <DialogFooter>
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </>
      ) : null}
    </div>
  );
}

function FalhasAgrupadas({ importResult }: { importResult: ImportLoteResult }) {
  const grupos = new Map<number, typeof importResult.falhas>();
  for (const f of importResult.falhas) {
    const arr = grupos.get(f.chunkIndex) ?? [];
    arr.push(f);
    grupos.set(f.chunkIndex, arr);
  }
  const ordenados = [...grupos.entries()]
    .sort(([a], [b]) => a - b)
    .map(([idx, arr]) => ({
      chunkIndex: idx,
      chunkSize: arr[0]?.chunkSize ?? arr.length,
      falhas: [...arr].sort((a, b) => a.indiceGlobal - b.indiceGlobal),
    }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{importResult.falhas.length} falha(s) em {ordenados.length} lote(s)</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => {
            const linhas = [
              'lote;tamanho_lote;posicao_no_lote;indice_global;ref;erro',
              ...importResult.falhas.map((f) =>
                [
                  f.chunkIndex + 1,
                  f.chunkSize,
                  f.posicaoNoChunk,
                  f.indiceGlobal,
                  `"${f.ref.replace(/"/g, '""')}"`,
                  `"${f.error.replace(/"/g, '""')}"`,
                ].join(';'),
              ),
            ].join('\n');
            const blob = new Blob(['\uFEFF' + linhas], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `falhas-importacao-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-3 w-3 mr-1" /> Exportar CSV
        </Button>
      </div>
      <ScrollArea className="max-h-64 border rounded-md">
        <Accordion type="multiple" defaultValue={ordenados.slice(0, 1).map((g) => `chunk-${g.chunkIndex}`)}>
          {ordenados.map((g) => (
            <AccordionItem key={g.chunkIndex} value={`chunk-${g.chunkIndex}`} className="px-2">
              <AccordionTrigger className="text-xs hover:no-underline py-2">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">Lote #{g.chunkIndex + 1}</Badge>
                  <span className="text-muted-foreground">tamanho {g.chunkSize}</span>
                  <Badge variant="destructive" className="text-[10px]">{g.falhas.length} falha(s)</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-7 text-[10px] uppercase">#</TableHead>
                      <TableHead className="h-7 text-[10px] uppercase">Pos. no lote</TableHead>
                      <TableHead className="h-7 text-[10px] uppercase">Ref</TableHead>
                      <TableHead className="h-7 text-[10px] uppercase">Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.falhas.map((f) => (
                      <TableRow key={`${f.chunkIndex}-${f.indiceGlobal}`}>
                        <TableCell className="py-1 text-xs font-mono tabular-nums">#{f.indiceGlobal}</TableCell>
                        <TableCell className="py-1 text-xs font-mono tabular-nums text-muted-foreground">
                          {f.posicaoNoChunk}/{f.chunkSize}
                        </TableCell>
                        <TableCell className="py-1 text-xs font-mono">{f.ref}</TableCell>
                        <TableCell className="py-1 text-xs text-destructive">{f.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
