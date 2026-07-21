import { format } from 'date-fns';
import { Upload, FileText, AlertTriangle, XCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { clearImportCheckpoint } from '@/lib/import-checkpoint';
import type { CsvLancParseResult, ParsedLancamento } from '@/lib/lancamentos-csv-importer';
import { formatCurrency } from '@/lib/formatters';
import { formatFileSize } from '@/lib/file';
import { cn } from '@/lib/utils';

interface Props {
  file: File | null;
  parseResult: CsvLancParseResult;
  lancamentosImportaveis: ParsedLancamento[];
  totalDebito: number;
  lancsForaDoAno: number;
  ano: number;
  podeImportar: boolean;
  retomada: { refsConfirmadas: Set<string>; updatedAt: number } | null;
  checkpointKey: string | null;
  onReset: () => void;
  onDescartarCheckpoint: () => void;
  onImport: () => void;
}

export function PreviewStep({
  file, parseResult, lancamentosImportaveis, totalDebito, lancsForaDoAno, ano,
  podeImportar, retomada, checkpointKey, onReset, onDescartarCheckpoint, onImport,
}: Props) {
  const aplicaveis = retomada
    ? lancamentosImportaveis.filter((l) => retomada.refsConfirmadas.has(l.ref)).length
    : 0;
  const restantes = lancamentosImportaveis.length - aplicaveis;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{file?.name}</span>
          <span className="text-muted-foreground">({file ? formatFileSize(file.size) : ''})</span>
          <Badge variant="outline" className="text-xs">{parseResult.encoding}</Badge>
          <Badge variant="outline" className="text-xs">sep: {parseResult.separator === '\t' ? 'TAB' : `"${parseResult.separator}"`}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>Trocar arquivo</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Lançamentos', value: parseResult.lancamentos.length },
          { label: 'Partidas', value: parseResult.totalPartidas },
          { label: 'Total D = C', value: formatCurrency(totalDebito), mono: true },
          { label: 'Erros', value: parseResult.errors.length, tone: parseResult.errors.length > 0 ? 'destructive' : 'success' },
          { label: 'Avisos', value: parseResult.warnings.length, tone: parseResult.warnings.length > 0 ? 'warning' : 'muted' },
        ].map((c, i) => (
          <Card key={i} className="bg-card/[0.03] border-white/10 rounded-2xl shadow-xl hover:bg-card/[0.05] transition-colors">
            <CardContent className="p-4 text-center">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className={cn(
                c.mono ? 'text-sm font-mono font-bold' : 'text-xl font-bold',
                c.tone === 'destructive' && 'text-destructive',
                c.tone === 'success' && 'text-success',
                c.tone === 'warning' && 'text-warning',
                c.tone === 'muted' && 'text-muted-foreground',
              )}>
                {c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {retomada && aplicaveis > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-xs">Importação anterior detectada</AlertTitle>
          <AlertDescription className="text-xs space-y-2">
            <div>
              Encontramos <b>{aplicaveis}</b> de <b>{lancamentosImportaveis.length}</b> lançamento(s)
              {' '}já importados em uma execução anterior deste arquivo
              {' '}(checkpoint salvo em {format(new Date(retomada.updatedAt), "dd/MM/yyyy 'às' HH:mm")}).
              {' '}Ao importar, eles serão <b>pulados automaticamente</b>.
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => { if (checkpointKey) { clearImportCheckpoint(checkpointKey); onDescartarCheckpoint(); } }}
              >
                Começar do zero (descartar checkpoint)
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                            {ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
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
        <Button variant="outline" onClick={onReset}>Cancelar</Button>
        <Button onClick={onImport} disabled={!podeImportar}>
          <Upload className="h-4 w-4 mr-2" />
          {aplicaveis > 0
            ? `Retomar (${restantes} restante(s) · ${aplicaveis} já importado(s))`
            : `Importar ${lancamentosImportaveis.length} lançamento(s)`}
        </Button>
      </DialogFooter>
    </div>
  );
}
