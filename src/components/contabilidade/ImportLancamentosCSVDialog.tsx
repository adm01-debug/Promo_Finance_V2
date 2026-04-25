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
    setProgress({ done: 0, total: lancamentosImportaveis.length });
    const res = await importar.mutateAsync({
      empresa_id: empresaId,
      lancamentos: lancamentosImportaveis,
      onProgress: (done, total) => setProgress({ done, total }),
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
                <Progress value={progress.total > 0 ? (progress.done / progress.total) * 100 : 0} />
                <p className="text-center text-sm text-muted-foreground">
                  Importando {progress.done} de {progress.total}...
                </p>
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

                {importResult.falhas.length > 0 && (
                  <ScrollArea className="max-h-48 border rounded-md p-2">
                    <ul className="text-xs space-y-1 font-mono">
                      {importResult.falhas.map((f, i) => (
                        <li key={i} className="text-destructive">
                          <span className="font-semibold">ref:{f.ref}</span> — {f.error}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}

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
