import { useState, useRef, useMemo } from 'react';
import { Gauge, Timer } from 'lucide-react';
import { Upload, FileText, Download, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useImportLancamentosLote, type ImportLoteResult } from '@/hooks/useLancamentosContabeis';
import { parseLancamentosCsv, downloadLancamentosCsvTemplate, type CsvLancParseResult, type ParsedLancamento } from '@/lib/lancamentos-csv-importer';
import { peekImportCheckpoint, clearImportCheckpoint, quickHash } from '@/lib/import-checkpoint';
import type { PlanoContaRow } from '@/hooks/usePlanoContas';
import { formatCurrency } from '@/lib/formatters';
import { formatFileSize } from '@/lib/file';
import { cn } from '@/lib/utils';

interface Props {
  empresaId?: string;
  planoContas: PlanoContaRow[];
  ano: number;
}

type Step = 'upload' | 'preview' | 'result';

function formatPct(done: number, total: number): string {
  if (total <= 0) return '0';
  return ((done / total) * 100).toFixed(done >= total ? 0 : 1);
}

function formatRate(itemsPerSecond: number): string {
  if (!isFinite(itemsPerSecond) || itemsPerSecond <= 0) return '—';
  if (itemsPerSecond >= 1) return `${itemsPerSecond.toFixed(1)} itens/s`;
  const perMin = itemsPerSecond * 60;
  if (perMin >= 1) return `${perMin.toFixed(1)} itens/min`;
  return `${(perMin * 60).toFixed(1)} itens/h`;
}

function formatDuration(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return '0s';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return s === 0 ? `${m}min` : `${m}min ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h}h` : `${h}h ${mm}min`;
}

export function ImportLancamentosCSVDialog({ empresaId, planoContas, ano }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<CsvLancParseResult | null>(null);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    chunkSize?: number;
    /** Taxa instantânea (EMA) em itens/segundo. */
    rate: number;
    /** Estimativa de tempo restante em ms. */
    etaMs: number;
    /** Tempo decorrido em ms desde o início da importação. */
    elapsedMs: number;
  }>({ done: 0, total: 0, rate: 0, etaMs: 0, elapsedMs: 0 });
  const [importResult, setImportResult] = useState<ImportLoteResult | null>(null);
  const [checkpointKey, setCheckpointKey] = useState<string | null>(null);
  const [retomada, setRetomada] = useState<{
    refsConfirmadas: Set<string>;
    updatedAt: number;
  } | null>(null);
  // Refs para cálculo de taxa/ETA — evitam re-renders e mantêm continuidade
  // entre callbacks de progresso (que disparam várias vezes por segundo).
  const startedAtRef = useRef<number>(0);
  const lastSampleRef = useRef<{ t: number; done: number }>({ t: 0, done: 0 });
  const emaRateRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const importar = useImportLancamentosLote();

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParseResult(null);
    setProgress({ done: 0, total: 0, rate: 0, etaMs: 0, elapsedMs: 0 });
    setImportResult(null);
    setCheckpointKey(null);
    setRetomada(null);
  };

  const handleClose = (next: boolean) => {
    if (!next && importar.isPending) return;
    setOpen(next);
    if (!next) setTimeout(reset, 200);
  };

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setParsing(true);
    try {
      const r = await parseLancamentosCsv(f, planoContas);
      setParseResult(r);

      // Gera uma checkpointKey estável a partir de empresa + arquivo +
      // hash dos primeiros 64 KB do conteúdo. Isso reconhece o mesmo
      // arquivo entre sessões mesmo após fechar o navegador.
      if (empresaId) {
        const head = await f.slice(0, 64 * 1024).text();
        const key = `${empresaId}:${f.name}:${f.size}:${quickHash(head)}`;
        setCheckpointKey(key);
        const prev = peekImportCheckpoint(key);
        if (prev && prev.refs.length > 0) {
          setRetomada({ refsConfirmadas: new Set(prev.refs), updatedAt: prev.updatedAt });
        } else {
          setRetomada(null);
        }
      }

      setStep('preview');
    } catch (e) {
      setParseResult({
        lancamentos: [], errors: [{ line: 0, message: e instanceof Error ? e.message : 'Erro ao ler arquivo' }],
        warnings: [], separator: ';', encoding: 'utf-8', totalLines: 0, totalPartidas: 0,
      });
      setStep('preview');
    } finally {
      setParsing(false);
    }
  };

  const lancamentosImportaveis = useMemo<ParsedLancamento[]>(() => {
    if (!parseResult) return [];
    const refsComErro = new Set(parseResult.errors.filter((e) => e.ref).map((e) => e.ref));
    return parseResult.lancamentos.filter((l) => l.balanceado && l.partidas.length >= 2 && !refsComErro.has(l.ref));
  }, [parseResult]);

  const lancsForaDoAno = useMemo(() => {
    return lancamentosImportaveis.filter((l) => {
      const y = Number(l.data.slice(0, 4));
      return y !== ano;
    }).length;
  }, [lancamentosImportaveis, ano]);

  const totalDebito = lancamentosImportaveis.reduce((s, l) => s + l.total_debito, 0);
  const podeImportar = !!empresaId && lancamentosImportaveis.length > 0 && (parseResult?.errors.length ?? 0) === 0;

  const handleImport = async () => {
    if (!empresaId || lancamentosImportaveis.length === 0) return;
    setStep('result');
    const total = lancamentosImportaveis.length;
    const now = performance.now();
    startedAtRef.current = now;
    lastSampleRef.current = { t: now, done: 0 };
    emaRateRef.current = 0;
    setProgress({ done: 0, total, rate: 0, etaMs: 0, elapsedMs: 0 });

    const res = await importar.mutateAsync({
      empresa_id: empresaId,
      lancamentos: lancamentosImportaveis,
      checkpointKey: checkpointKey ?? undefined,
      onProgress: (done, totalArg, chunkSize) => {
        const t = performance.now();
        const last = lastSampleRef.current;
        const dt = (t - last.t) / 1000; // segundos
        const dn = done - last.done;
        // Atualiza apenas quando há intervalo mínimo (≥120ms) ou no fim,
        // evitando ruído em callbacks muito próximos e re-renders inúteis.
        if (dt < 0.12 && done < totalArg) return;

        const instantRate = dt > 0 ? dn / dt : 0;
        // EMA com α=0.3 — suaviza picos sem atrasar muito a reação a mudanças.
        const ALPHA = 0.3;
        const ema = emaRateRef.current === 0 ? instantRate : ALPHA * instantRate + (1 - ALPHA) * emaRateRef.current;
        emaRateRef.current = ema;
        lastSampleRef.current = { t, done };

        const restantes = Math.max(0, totalArg - done);
        const etaMs = ema > 0 ? (restantes / ema) * 1000 : 0;
        const elapsedMs = t - startedAtRef.current;
        setProgress({ done, total: totalArg, chunkSize, rate: ema, etaMs, elapsedMs });
      },
    });
    setImportResult(res);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!empresaId}>
          <Upload className="h-4 w-4 mr-2" />Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar lançamentos contábeis em lote
          </DialogTitle>
          <DialogDescription>
            Cada linha do CSV representa uma partida. Lançamentos são agrupados pelo campo <code className="bg-muted px-1 rounded">lancamento_ref</code>.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>Formato esperado</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <div>Colunas obrigatórias: <code>lancamento_ref;data;historico;conta_codigo;tipo;valor</code></div>
                <div>Opcional: <code>historico_complementar</code></div>
                <div>• <b>data</b>: YYYY-MM-DD ou DD/MM/YYYY</div>
                <div>• <b>tipo</b>: D (débito) ou C (crédito)</div>
                <div>• <b>valor</b>: aceita formato BR (1.234,56) ou US (1234.56)</div>
                <div>• <b>conta_codigo</b>: deve existir no plano e ser <b>analítica</b></div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadLancamentosCsvTemplate} className="gap-2">
                <Download className="h-4 w-4" />Baixar template CSV
              </Button>
            </div>

            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                'hover:border-primary hover:bg-muted/30',
              )}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0] ?? null); }}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Arraste o CSV aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">Apenas arquivos .csv</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {parsing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />Lendo arquivo...
              </div>
            )}
          </div>
        )}

        {step === 'preview' && parseResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{file?.name}</span>
                <span className="text-muted-foreground">({file ? formatFileSize(file.size) : ''})</span>
                <Badge variant="outline" className="text-xs">{parseResult.encoding}</Badge>
                <Badge variant="outline" className="text-xs">sep: {parseResult.separator === '\t' ? 'TAB' : `"${parseResult.separator}"`}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>Trocar arquivo</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Card><CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Lançamentos</div>
                <div className="text-xl font-bold">{parseResult.lancamentos.length}</div>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Partidas</div>
                <div className="text-xl font-bold">{parseResult.totalPartidas}</div>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Total D = C</div>
                <div className="text-sm font-mono font-bold">{formatCurrency(totalDebito)}</div>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Erros</div>
                <div className={cn('text-xl font-bold', parseResult.errors.length > 0 ? 'text-destructive' : 'text-success')}>
                  {parseResult.errors.length}
                </div>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Avisos</div>
                <div className={cn('text-xl font-bold', parseResult.warnings.length > 0 ? 'text-warning' : 'text-muted-foreground')}>
                  {parseResult.warnings.length}
                </div>
              </CardContent></Card>
            </div>

            {lancsForaDoAno > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {lancsForaDoAno} lançamento(s) fora do ano-calendário corrente ({ano}). Serão importados mesmo assim.
                </AlertDescription>
              </Alert>
            )}

            {(parseResult.errors.length > 0 || parseResult.warnings.length > 0) && (
              <Accordion type="multiple" defaultValue={parseResult.errors.length > 0 ? ['errors'] : []}>
                {parseResult.errors.length > 0 && (
                  <AccordionItem value="errors">
                    <AccordionTrigger className="text-destructive hover:text-destructive">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />{parseResult.errors.length} erro(s) bloqueante(s)
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="max-h-48">
                        <ul className="text-xs space-y-1 font-mono">
                          {parseResult.errors.map((e, i) => (
                            <li key={i} className="text-destructive">
                              <span className="font-semibold">L{e.line}</span>
                              {e.ref && <span className="text-muted-foreground"> [ref:{e.ref}]</span>}
                              {' — '}{e.message}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {parseResult.warnings.length > 0 && (
                  <AccordionItem value="warnings">
                    <AccordionTrigger className="text-warning hover:text-warning">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />{parseResult.warnings.length} aviso(s)
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="max-h-32">
                        <ul className="text-xs space-y-1 font-mono">
                          {parseResult.warnings.map((w, i) => (
                            <li key={i} className="text-warning">
                              <span className="font-semibold">L{w.line}</span>
                              {w.ref && <span className="text-muted-foreground"> [ref:{w.ref}]</span>}
                              {' — '}{w.message}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}

            {parseResult.lancamentos.length > 0 && (
              <div className="border rounded-md">
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-10">Status</TableHead>
                        <TableHead>Ref</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Histórico</TableHead>
                        <TableHead className="text-right">Part.</TableHead>
                        <TableHead className="text-right">Total D</TableHead>
                        <TableHead className="text-right">Total C</TableHead>
                        <TableHead className="text-right">Dif.</TableHead>
                        <TableHead className="text-right">Erros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.lancamentos.slice(0, 100).map((l) => {
                        const errosDoLanc = parseResult.errors.filter((e) => e.ref === l.ref);
                        const warningsDoLanc = parseResult.warnings.filter((w) => w.ref === l.ref);
                        const ok = l.balanceado && l.partidas.length >= 2 && errosDoLanc.length === 0;
                        const dif = l.total_debito - l.total_credito;
                        const temDetalhes = errosDoLanc.length > 0 || warningsDoLanc.length > 0 || l.partidas.length > 0;
                        return (
                          <Collapsible key={l.ref} asChild>
                            <>
                              <TableRow className={cn(!ok && 'bg-destructive/5')}>
                                <TableCell className="p-0 pl-2">
                                  {temDetalhes && (
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <ChevronRight className="h-3 w-3 transition-transform data-[state=open]:rotate-90" />
                                      </Button>
                                    </CollapsibleTrigger>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {ok ? <CheckCircle2 className="h-4 w-4 text-success" />
                                    : <XCircle className="h-4 w-4 text-destructive" />}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{l.ref}</TableCell>
                                <TableCell className="text-xs">{l.data ? format(new Date(l.data + 'T00:00:00'), 'dd/MM/yyyy') : '—'}</TableCell>
                                <TableCell className="text-xs max-w-[200px] truncate">{l.historico || '—'}</TableCell>
                                <TableCell className="text-right text-xs">{l.partidas.length}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{formatCurrency(l.total_debito)}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{formatCurrency(l.total_credito)}</TableCell>
                                <TableCell className={cn('text-right font-mono text-xs', Math.abs(dif) > 0.005 ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                                  {formatCurrency(dif)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {errosDoLanc.length > 0
                                    ? <Badge variant="destructive" className="text-xs">{errosDoLanc.length}</Badge>
                                    : <span className="text-xs text-muted-foreground">0</span>}
                                </TableCell>
                              </TableRow>
                              <CollapsibleContent asChild>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                  <TableCell colSpan={10} className="p-3">
                                    <div className="space-y-3">
                                      {errosDoLanc.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                                            <XCircle className="h-3 w-3" /> Erros bloqueantes
                                          </p>
                                          <ul className="text-xs space-y-0.5 font-mono pl-4">
                                            {errosDoLanc.map((e, i) => (
                                              <li key={i} className="text-destructive">
                                                <span className="font-semibold">Linha {e.line}</span> — {e.message}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {warningsDoLanc.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Avisos
                                          </p>
                                          <ul className="text-xs space-y-0.5 font-mono pl-4">
                                            {warningsDoLanc.map((w, i) => (
                                              <li key={i} className="text-warning">
                                                <span className="font-semibold">Linha {w.line}</span> — {w.message}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {l.partidas.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-muted-foreground mb-1">Partidas ({l.partidas.length})</p>
                                          <div className="border rounded bg-background">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="h-7 text-xs">Linha</TableHead>
                                                  <TableHead className="h-7 text-xs">Conta</TableHead>
                                                  <TableHead className="h-7 text-xs">Tipo</TableHead>
                                                  <TableHead className="h-7 text-xs text-right">Valor</TableHead>
                                                  <TableHead className="h-7 text-xs">Histórico</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {l.partidas.map((p, i) => (
                                                  <TableRow key={i}>
                                                    <TableCell className="py-1 text-xs font-mono">L{p.linha}</TableCell>
                                                    <TableCell className="py-1 text-xs font-mono">{p.conta_codigo}</TableCell>
                                                    <TableCell className="py-1 text-xs">
                                                      <Badge variant={p.tipo === 'D' ? 'default' : 'secondary'} className="text-[10px] px-1.5">
                                                        {p.tipo}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-1 text-xs font-mono text-right">{formatCurrency(p.valor)}</TableCell>
                                                    <TableCell className="py-1 text-xs text-muted-foreground truncate max-w-[200px]">{p.historico_complementar || '—'}</TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>
                            </>
                          </Collapsible>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {parseResult.lancamentos.length > 100 && (
                  <p className="text-xs text-muted-foreground p-2 text-center border-t">
                    Exibindo 100 de {parseResult.lancamentos.length} lançamentos
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={handleImport} disabled={!podeImportar}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {lancamentosImportaveis.length} lançamento(s)
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-4">
            {importar.isPending ? (
              <>
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <Progress
                  value={progress.total > 0 ? (progress.done / progress.total) * 100 : 0}
                  aria-label={`Importação em ${formatPct(progress.done, progress.total)}%`}
                />
                <div
                  className="flex items-center justify-between text-xs text-muted-foreground"
                  aria-live="polite"
                  aria-atomic="true"
                >
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
                          {progress.rate > 0 ? `${formatRate(progress.rate)}` : '—'}
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
                            : progress.etaMs > 0
                              ? formatDuration(progress.etaMs)
                              : 'calculando…'}
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
                    {importResult.sucesso} sucesso(s) · {importResult.falhas.length} falha(s)
                  </AlertDescription>
                </Alert>

                {importResult.falhas.length > 0 && (() => {
                  // Agrupa as falhas pelo chunk em que ocorreram, ordenando os
                  // chunks pela ordem de execução e os itens pelo índice global.
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
                        <span>
                          {importResult.falhas.length} falha(s) em {ordenados.length} lote(s)
                        </span>
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
                        <Accordion
                          type="multiple"
                          defaultValue={ordenados.slice(0, 1).map((g) => `chunk-${g.chunkIndex}`)}
                        >
                          {ordenados.map((g) => (
                            <AccordionItem key={g.chunkIndex} value={`chunk-${g.chunkIndex}`} className="px-2">
                              <AccordionTrigger className="text-xs hover:no-underline py-2">
                                <span className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    Lote #{g.chunkIndex + 1}
                                  </Badge>
                                  <span className="text-muted-foreground">tamanho {g.chunkSize}</span>
                                  <Badge variant="destructive" className="text-[10px]">
                                    {g.falhas.length} falha(s)
                                  </Badge>
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
                                        <TableCell className="py-1 text-xs font-mono tabular-nums">
                                          #{f.indiceGlobal}
                                        </TableCell>
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
                })()}

                <DialogFooter>
                  <Button onClick={() => handleClose(false)}>Fechar</Button>
                </DialogFooter>
              </>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
