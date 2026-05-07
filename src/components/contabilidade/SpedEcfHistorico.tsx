import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Download, FileArchive, Lock, FileText, ScrollText, Filter, X, Search, Link2, ChevronDown, ChevronRight, Hash, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpedEcfHistorico, type SpedEcfHistoricoRow } from '@/hooks/useSpedEcfHistorico';
import { supabase } from '@/integrations/supabase/client';
import { baixarSpedZip } from '@/lib/sped-zip';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'liberada' | 'bloqueada' | 'transmitida';
type ValidacaoFilter = 'all' | 'com_erros' | 'com_avisos' | 'sem_alertas';

interface Props {
  empresaId?: string;
}

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function SpedEcfHistorico({ empresaId }: Props) {
  const { data: historico = [], isLoading } = useSpedEcfHistorico(empresaId);
  const [errosAbertos, setErrosAbertos] = useState<SpedEcfHistoricoRow | null>(null);
  const [searchAno, setSearchAno] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [validacaoFilter, setValidacaoFilter] = useState<ValidacaoFilter>('all');
  const [expandedAudit, setExpandedAudit] = useState<Set<string>>(() => {
    try {
      const saved = window.localStorage.getItem(`sped-ecf-audit:expanded:${empresaId || '_'}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persistir o estado de expandir/recolher
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        `sped-ecf-audit:expanded:${empresaId || '_'}`,
        JSON.stringify(Array.from(expandedAudit))
      );
    } catch { /* noop */ }
  }, [expandedAudit, empresaId]);

  const toggleAudit = (id: string) => {
    setExpandedAudit((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const anosDisponiveis = useMemo(
    () => Array.from(new Set(historico.map((h) => h.ano_calendario))).sort((a, b) => b - a),
    [historico],
  );

  // Heurística: mensagens de aviso/erro relacionadas ao cross-check ECF × ECD.
  const ECD_PATTERN = /\b(ECD|cross[-\s]?check|K355|L100|hash)\b/i;

  const resumoAlertas = useMemo(() => {
    const bloqueadas: { row: SpedEcfHistoricoRow; erros: number }[] = [];
    const divergencias: { row: SpedEcfHistoricoRow; total: number }[] = [];
    const anosBloq = new Set<number>();
    const anosDiv = new Set<number>();
    for (const h of historico) {
      const erros = h.validacoes?.erros ?? [];
      const avisos = h.validacoes?.avisos ?? [];
      if (h.status === 'rejeitado' || erros.length > 0) {
        bloqueadas.push({ row: h, erros: erros.length });
        anosBloq.add(h.ano_calendario);
      }
      const divs = [...erros, ...avisos].filter((m) => ECD_PATTERN.test(m));
      if (divs.length > 0) {
        divergencias.push({ row: h, total: divs.length });
        anosDiv.add(h.ano_calendario);
      }
    }
    return { bloqueadas, divergencias, anosBloq, anosDiv };
  }, [historico]);

  const filtrados = useMemo(() => {
    const q = searchAno.trim();
    return historico.filter((h) => {
      if (q && !String(h.ano_calendario).includes(q)) return false;

      const erros = h.validacoes?.erros ?? [];
      const avisos = h.validacoes?.avisos ?? [];
      const bloqueada = h.status === 'rejeitado' || erros.length > 0;
      const transmitida = h.status === 'transmitido';
      const liberada = !bloqueada && !transmitida;

      if (statusFilter === 'bloqueada' && !bloqueada) return false;
      if (statusFilter === 'transmitida' && !transmitida) return false;
      if (statusFilter === 'liberada' && !liberada) return false;

      if (validacaoFilter === 'com_erros' && erros.length === 0) return false;
      if (validacaoFilter === 'com_avisos' && avisos.length === 0) return false;
      if (validacaoFilter === 'sem_alertas' && (erros.length > 0 || avisos.length > 0)) return false;

      return true;
    });
  }, [historico, searchAno, statusFilter, validacaoFilter]);

  const filtrosAtivos =
    (searchAno.trim() ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (validacaoFilter !== 'all' ? 1 : 0);

  const limparFiltros = () => {
    setSearchAno('');
    setStatusFilter('all');
    setValidacaoFilter('all');
  };

  const handleDownloadTxt = async (h: SpedEcfHistoricoRow) => {
    const { data, error } = await supabase.storage
      .from('relatorios-tributarios')
      .createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleDownloadZip = async (h: SpedEcfHistoricoRow) => {
    const { data, error } = await supabase.storage
      .from('relatorios-tributarios')
      .createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    const fileName = h.storage_path.split('/').pop() || `ECF-${h.ano_calendario}.txt`;
    try {
      await baixarSpedZip({
        txtUrl: data.signedUrl, fileName, hash: h.hash_sha256 || 'N/A',
        empresa: { razao_social: h.razao_social, cnpj: h.cnpj },
        periodo: { inicio: `${h.ano_calendario}-01-01`, fim: `${h.ano_calendario}-12-31` },
        totalLinhas: h.total_linhas ?? 0, totalLancamentos: h.total_lancamentos ?? 0,
        tipo: 'ECF',
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de gerações — SPED ECF
          </CardTitle>
          <CardDescription>
            Data/hora, CNPJ e status de cada arquivo ECF gerado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(resumoAlertas.bloqueadas.length > 0 || resumoAlertas.divergencias.length > 0) && (
            <div className="space-y-2" role="region" aria-label="Alertas do histórico ECF">
              {resumoAlertas.bloqueadas.length > 0 && (
                <Alert variant="error" role="alert">
                  
                  <AlertTitle>
                    {resumoAlertas.bloqueadas.length} execução(ões) bloqueada(s) por erros de validação
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-xs">
                      Ano(s) afetado(s):{' '}
                      <span className="font-medium">
                        {Array.from(resumoAlertas.anosBloq).sort((a, b) => b - a).join(', ')}
                      </span>
                      . O download do TXT/ZIP fica indisponível enquanto houver erros pendentes.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {resumoAlertas.bloqueadas.slice(0, 4).map(({ row, erros }) => (
                        <Button
                          key={row.id}
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => {
                            setStatusFilter('bloqueada');
                            setErrosAbertos(row);
                          }}
                          aria-label={`Ver ${erros} erro(s) da ECF ${row.ano_calendario}`}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          ECF {row.ano_calendario} · {erros} erro(s)
                        </Button>
                      ))}
                      {resumoAlertas.bloqueadas.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{resumoAlertas.bloqueadas.length - 4}
                        </Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {resumoAlertas.divergencias.length > 0 && (
                <Alert variant="warning" role="alert">
                  
                  <AlertTitle>
                    Divergência(s) com a ECD do mesmo período em {resumoAlertas.divergencias.length} execução(ões)
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-xs">
                      Ano(s) com cross-check pendente:{' '}
                      <span className="font-medium">
                        {Array.from(resumoAlertas.anosDiv).sort((a, b) => b - a).join(', ')}
                      </span>
                      . Verifique hash, recibo e saldos K355 × L100 antes de transmitir.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {resumoAlertas.divergencias.slice(0, 4).map(({ row, total }) => (
                        <Button
                          key={row.id}
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs border-warning/40"
                          onClick={() => setErrosAbertos(row)}
                          aria-label={`Ver ${total} divergência(s) ECD da ECF ${row.ano_calendario}`}
                        >
                          <Link2 className="h-3 w-3" />
                          ECF {row.ano_calendario} · {total} ponto(s)
                        </Button>
                      ))}
                      {resumoAlertas.divergencias.length > 4 && (
                        <Badge variant="outline" className="text-[10px] border-warning/40">
                          +{resumoAlertas.divergencias.length - 4}
                        </Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {historico.length > 0 && (
            <div
              role="region"
              aria-label="Filtros do histórico ECF"
              className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 bg-muted/30 p-3"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="ecf-hist-ano" className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Ano-calendário
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="ecf-hist-ano"
                    list="ecf-hist-ano-options"
                    value={searchAno}
                    onChange={(e) => setSearchAno(e.target.value)}
                    placeholder="Ex.: 2024"
                    inputMode="numeric"
                    className="h-8 w-[140px] pl-8 text-xs"
                  />
                  <datalist id="ecf-hist-ano-options">
                    {anosDisponiveis.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="ecf-hist-status" className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger id="ecf-hist-status" className="h-8 w-[160px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="liberada">Liberada</SelectItem>
                    <SelectItem value="bloqueada">Bloqueada</SelectItem>
                    <SelectItem value="transmitida">Transmitida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="ecf-hist-validacao" className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  Validações
                </label>
                <Select value={validacaoFilter} onValueChange={(v) => setValidacaoFilter(v as ValidacaoFilter)}>
                  <SelectTrigger id="ecf-hist-validacao" className="h-8 w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="com_erros">Com erros</SelectItem>
                    <SelectItem value="com_avisos">Com avisos</SelectItem>
                    <SelectItem value="sem_alertas">Sem alertas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="gap-1 text-[10px]" aria-live="polite">
                  <Filter className="h-3 w-3" />
                  {filtrados.length} de {historico.length}
                </Badge>
                {filtrosAtivos > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={limparFiltros}
                    className="h-8 gap-1 text-xs"
                    aria-label={`Limpar ${filtrosAtivos} filtro(s)`}
                  >
                    <X className="h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum arquivo ECF gerado ainda.</p>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Filter className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Nenhum arquivo encontrado com os filtros aplicados.</p>
              <Button size="sm" variant="link" onClick={limparFiltros}>Limpar filtros</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((h) => {
                  const isOpen = expandedAudit.has(h.id);
                  const erros = h.validacoes?.erros ?? [];
                  const avisos = h.validacoes?.avisos ?? [];
                  const bloqueada = h.status === 'rejeitado' || erros.length > 0;
                  return (
                    <React.Fragment key={h.id}>
                    <TableRow>
                      <TableCell className="p-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => toggleAudit(h.id)}
                          title={isOpen ? 'Ocultar trilha de auditoria' : 'Ver trilha de auditoria'}
                        >
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{format(new Date(h.created_at), 'dd/MM/yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(h.created_at), 'HH:mm')}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">{formatCnpj(h.cnpj)}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={h.razao_social}>
                          {h.razao_social}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{h.ano_calendario}</TableCell>
                      <TableCell>
                        {bloqueada ? (
                          <Badge variant="destructive" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Bloqueado
                          </Badge>
                        ) : h.status === 'transmitido' ? (
                          <Badge className="gap-1 bg-success hover:bg-success">
                            <CheckCircle2 className="h-3 w-3" />
                            Transmitido
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Gerado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <TooltipProvider>
                            {(erros.length > 0 || avisos.length > 0) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant={erros.length > 0 ? 'destructive' : 'outline'}
                                    onClick={() => setErrosAbertos(h)}
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    {erros.length > 0 ? `${erros.length} erro(s)` : `${avisos.length} aviso(s)`}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhes das validações</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={bloqueada}
                                  onClick={() => handleDownloadTxt(h)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {bloqueada ? 'Download bloqueado por erros' : 'Baixar .txt'}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={bloqueada}
                                  onClick={() => handleDownloadZip(h)}
                                >
                                  <FileArchive className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {bloqueada ? 'Download bloqueado por erros' : 'Baixar .zip (com relatório)'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-4 space-y-3 border-l-2 border-primary/30 ml-2">
                            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                              <ScrollText className="h-4 w-4 text-primary" />
                              Trilha de auditoria · execução de {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}
                            </div>

                            <div className={cn(
                              'rounded-lg border p-3 flex items-start gap-3',
                              bloqueada ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5',
                            )}>
                              <div className={cn(
                                'h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                                bloqueada ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success',
                              )}>
                                {bloqueada ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </div>
                              <div className="flex-1 space-y-0.5">
                                <p className={cn('text-xs font-semibold', bloqueada ? 'text-destructive' : 'text-success')}>
                                  {bloqueada ? `Geração bloqueada — ${erros.length} erro(s)` : 'Geração liberada — nenhum erro'}
                                </p>
                                <p className="text-[11px] text-muted-foreground">Status final: <span className="font-mono">{h.status}</span></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div className="rounded-md border border-border/60 bg-card/60 p-2.5">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total de linhas</p>
                                <p className="text-sm font-mono font-semibold tabular-nums mt-0.5">{(h.total_linhas ?? 0).toLocaleString('pt-BR')}</p>
                              </div>
                              <div className="rounded-md border border-border/60 bg-card/60 p-2.5">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Lançamentos</p>
                                <p className="text-sm font-mono font-semibold tabular-nums mt-0.5">{(h.total_lancamentos ?? 0).toLocaleString('pt-BR')}</p>
                              </div>
                              <div className="rounded-md border border-border/60 bg-card/60 p-2.5 col-span-2">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1"><Hash className="h-3 w-3" /> Hash SHA-256</p>
                                <p className="text-[11px] font-mono text-foreground/90 mt-0.5 break-all">{h.hash_sha256 || '—'}</p>
                              </div>
                            </div>

                            {(() => {
                              const grupos = agruparValidacoes(erros, avisos);
                              if (grupos.length === 0) return null;
                              return (
                                <div className="grid gap-4 md:grid-cols-2">
                                  {grupos.map(({ categoria, erros: gErros, avisos: gAvisos }) => {
                                    const tone = gErros.length > 0 ? 'destructive' : 'warning';
                                    return (
                                      <div key={categoria.id} className={cn("rounded-xl border p-4 space-y-3", tone === 'destructive' ? "bg-destructive/5 border-destructive/10" : "bg-warning/5 border-warning/10")}>
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <div className={cn("p-1.5 rounded-lg", tone === 'destructive' ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
                                              <AlertTriangle className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                              <h4 className={cn("text-xs font-black uppercase tracking-wider", tone === 'destructive' ? "text-destructive" : "text-warning")}>{categoria.label}</h4>
                                              <p className="text-[10px] text-muted-foreground opacity-70">{categoria.description}</p>
                                            </div>
                                          </div>
                                        </div>
                                        <ul className="space-y-1.5">
                                          {[...gErros.map(e => ({ text: e, type: 'error' as const })), ...gAvisos.map(a => ({ text: a, type: 'warn' as const }))].map((item, idx) => (
                                            <li key={idx} className={cn("text-[11px] leading-relaxed p-2 rounded-lg border", item.type === 'error' ? "bg-destructive/10 border-destructive/10 text-destructive" : "bg-warning/10 border-warning/10 text-warning-foreground")}>
                                              {item.text}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!errosAbertos} onOpenChange={(v) => { if (!v) setErrosAbertos(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Validações — ECF {errosAbertos?.ano_calendario}
            </DialogTitle>
            <DialogDescription>
              {errosAbertos && format(new Date(errosAbertos.created_at), "dd/MM/yyyy 'às' HH:mm")}
              {' · '}{errosAbertos && formatCnpj(errosAbertos.cnpj)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {(() => {
              if (!errosAbertos) return null;
              const grupos = agruparValidacoes(
                errosAbertos.validacoes.erros,
                errosAbertos.validacoes.avisos,
              );
              const totalErros = errosAbertos.validacoes.erros.length;
              const totalAvisos = errosAbertos.validacoes.avisos.length;

              if (grupos.length === 0) {
                return (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma validação registrada para esta execução.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4" role="list" aria-label="Validações agrupadas por categoria">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Agrupado por categoria:</span>
                    {totalErros > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {totalErros} erro(s)
                      </Badge>
                    )}
                    {totalAvisos > 0 && (
                      <Badge
                        variant="outline"
                        className="gap-1 border-warning/40 bg-warning/10 text-warning"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {totalAvisos} aviso(s)
                      </Badge>
                    )}
                  </div>

                  {grupos.map(({ categoria, erros, avisos, total }) => {
                    const tone = erros.length > 0 ? 'error' : 'warning';
                    return (
                      <section
                        key={categoria.id}
                        role="listitem"
                        aria-label={`${categoria.label}: ${total} ocorrência(s)`}
                        className={cn(
                          'rounded-lg border p-3 space-y-2',
                          tone === 'error'
                            ? 'border-destructive/30 bg-destructive/5'
                            : 'border-warning/30 bg-warning/5',
                        )}
                      >
                        <header className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h4
                              className={cn(
                                'text-sm font-semibold flex items-center gap-2',
                                tone === 'error' ? 'text-destructive' : 'text-warning',
                              )}
                            >
                              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                              {categoria.label}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              {categoria.description}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            {erros.length > 0 && (
                              <Badge variant="destructive" className="text-[10px]">
                                {erros.length} erro(s)
                              </Badge>
                            )}
                            {avisos.length > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-warning/40 bg-warning/10 text-warning"
                              >
                                {avisos.length} aviso(s)
                              </Badge>
                            )}
                          </div>
                        </header>

                        {erros.length > 0 && (
                          <ul className="space-y-1" aria-label={`Erros em ${categoria.label}`}>
                            {erros.map((e, i) => (
                              <li
                                key={`e-${i}`}
                                className="rounded-md border border-destructive/30 bg-background/60 px-3 py-2 text-xs text-destructive"
                              >
                                {e}
                              </li>
                            ))}
                          </ul>
                        )}

                        {avisos.length > 0 && (
                          <ul className="space-y-1" aria-label={`Avisos em ${categoria.label}`}>
                            {avisos.map((a, i) => (
                              <li
                                key={`a-${i}`}
                                className="rounded-md border border-warning/30 bg-background/60 px-3 py-2 text-xs text-warning-foreground"
                              >
                                {a}
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}
                </div>
              );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
