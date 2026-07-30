import React from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Hash, Link2, Lock,
  ScrollText, Send, ShieldAlert, ShieldCheck, Unlock, XCircle, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
import type { HistoricoRow } from './types';

interface Props {
  isLoading: boolean;
  historicoFiltrado: HistoricoRow[];
  expandedAudit: Set<string>;
  onToggleAudit: (id: string) => void;
  onCopyHash: (hash: string | null) => void;
  onOpenValidacoes: (h: HistoricoRow) => void;
  onOpenTransmissao: (h: HistoricoRow) => void;
  onClearFilters: () => void;
}

export function SpedHistoricoTable({
  isLoading,
  historicoFiltrado,
  expandedAudit,
  onToggleAudit,
  onCopyHash,
  onOpenValidacoes,
  onOpenTransmissao,
  onClearFilters,
}: Props) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }
  if (historicoFiltrado.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-card/5 text-muted-foreground/30">
          <Filter className="h-8 w-8" />
        </div>
        <p className="text-muted-foreground font-medium">Nenhum registro encontrado para os filtros aplicados.</p>
        <Button variant="link" onClick={onClearFilters}>Limpar todos os filtros</Button>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-black/20 shadow-inner">
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-card/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-12 p-6"></TableHead>
              <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Período Fiscal</TableHead>
              <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Geração / Lote</TableHead>
              <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Métricas</TableHead>
              <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Status Auditoria</TableHead>
              <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Protocolo / Hash</TableHead>
              <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-right pr-8">Governança</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historicoFiltrado.map((h) => {
              const isOpen = expandedAudit.has(h.id);
              const erros = h.validacoes?.erros ?? [];
              const avisos = h.validacoes?.avisos ?? [];
              const bloqueada = h.status === 'rejeitado' || erros.length > 0;
              const ecdDivergente = [...erros, ...avisos].some(m => /\b(ECD|cross[-\s]?check|K355|L100|hash)\b/i.test(m));
              const isRejeitado = h.status === 'rejeitado';
              const temErros = erros.length > 0;
              const Icon = bloqueada ? Lock : ShieldAlert;
              const label = bloqueada ? 'Bloqueado' : 'Validações & Download';
              const tooltipLabel = isRejeitado
                ? `Transmissão rejeitada — ${erros.length} erro(s) impedem o download. Clique para revisar.`
                : temErros
                  ? `${erros.length} erro(s) de validação bloqueiam o download. Clique para revisar.`
                  : avisos.length > 0
                    ? `${avisos.length} aviso(s) — download liberado. Clique para revisar e baixar.`
                    : 'Sem erros nem avisos. Clique para baixar .txt ou .zip.';

              return (
                <React.Fragment key={h.id}>
                  {bloqueada && (
                    <TableRow className="bg-destructive/5 hover:bg-destructive/5 border-none">
                      <TableCell colSpan={9} className="py-2 px-6">
                        <div className="flex items-center gap-2 text-destructive text-xs font-bold">
                          <XCircle className="h-3 w-3" />
                          Execução bloqueada por erros de validação. Corrija para liberar o download.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {ecdDivergente && (
                    <TableRow className="bg-warning/5 hover:bg-warning/5 border-none">
                      <TableCell colSpan={9} className="py-2 px-6">
                        <div className="flex items-center gap-2 text-warning text-xs font-bold">
                          <Link2 className="h-3 w-3" />
                          Divergências detectadas em relação à ECD do mesmo período. Verifique os saldos.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className={cn((bloqueada || ecdDivergente) && 'border-t-0')}>
                    <TableCell className="p-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => onToggleAudit(h.id)}
                        title={isOpen ? 'Ocultar trilha de auditoria' : 'Ver trilha de auditoria'}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="p-6">
                      <Badge variant="outline" className="font-mono text-[11px] font-black border-none bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg">
                        {h.ano_calendario}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground/80">{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Lote: #{h.id.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-foreground/60">{h.total_lancamentos.toLocaleString('pt-BR')} Lanç.</span>
                          <span className="text-[9px] font-bold opacity-30 uppercase">{h.total_linhas.toLocaleString('pt-BR')} Linhas</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      {h.status === 'rejeitado' ? (
                        <Badge variant="destructive" className="gap-1.5 font-black text-[9px] uppercase tracking-widest border-none px-3 py-1 rounded-full"><AlertTriangle className="h-3 w-3" />{erros.length} erros</Badge>
                      ) : h.status === 'transmitido' ? (
                        <Badge className="gap-1.5 bg-success/20 text-success font-black text-[9px] uppercase tracking-widest border-none px-3 py-1 rounded-full"><ShieldCheck className="h-3 w-3" />Transmitido</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1.5 font-black text-[9px] uppercase tracking-widest border-none px-3 py-1 rounded-full"><CheckCircle2 className="h-3 w-3" />Gerado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col gap-1">
                        {h.recibo_transmissao ? (
                          <div className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3 opacity-30" />
                            <span className="font-mono text-[10px] font-black text-primary">{h.recibo_transmissao.substring(0, 16)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold opacity-20 uppercase tracking-widest">Aguardando Protocolo</span>
                        )}
                        <span className="font-mono text-[9px] opacity-30">{h.hash_sha256?.substring(0, 16)}…</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant={bloqueada ? 'destructive' : 'outline'}
                                onClick={() => onOpenValidacoes(h)}
                                className={cn(
                                  'gap-2 h-9 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02]',
                                  bloqueada && 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20',
                                  !bloqueada && avisos.length > 0 && 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/20',
                                  !bloqueada && avisos.length === 0 && 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20',
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent variant={bloqueada ? 'warning' : 'default'}>
                              {tooltipLabel}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {h.status !== 'transmitido' && h.status !== 'rejeitado' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenTransmissao(h)}
                            className="h-9 w-9 rounded-xl border-white/5 bg-card/5 hover:bg-primary/20 text-primary transition-all"
                            title="Registrar transmissão"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={`${h.id}-audit`} className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={9} className="p-0">
                        <div className="p-4 space-y-3 border-l-2 border-primary/30 ml-2">
                          <div className="flex items-center gap-2 text-sm font-semibold font-display tracking-tight">
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
                                {bloqueada
                                  ? `Geração bloqueada — ${erros.length} erro(s) de validação`
                                  : 'Geração liberada — nenhum erro de validação'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Status final: <span className="font-mono">{h.status}</span>
                                {avisos.length > 0 && ` · ${avisos.length} aviso(s) tolerado(s)`}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="rounded-md border border-border/60 bg-card/60 p-2.5">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total de linhas</p>
                              <p className="text-sm font-mono font-semibold tabular-nums mt-0.5">{h.total_linhas.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="rounded-md border border-border/60 bg-card/60 p-2.5">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Lançamentos</p>
                              <p className="text-sm font-mono font-semibold tabular-nums mt-0.5">{h.total_lancamentos.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="rounded-md border border-border/60 bg-card/60 p-2.5 col-span-2">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
                                <Hash className="h-3 w-3" /> Hash SHA-256
                              </p>
                              <button
                                type="button"
                                onClick={() => onCopyHash(h.hash_sha256)}
                                className="text-[11px] font-mono text-foreground/90 mt-0.5 hover:text-primary transition-colors break-all text-left w-full"
                                title="Clique para copiar"
                              >
                                {h.hash_sha256 || '—'}
                              </button>
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
                                    <div
                                      key={categoria.id}
                                      className={cn(
                                        'rounded-xl border p-4 space-y-3',
                                        tone === 'destructive' ? 'bg-destructive/5 border-destructive/10' : 'bg-warning/5 border-warning/10'
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            'p-1.5 rounded-lg',
                                            tone === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                                          )}>
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                          </div>
                                          <div>
                                            <h4 className={cn('text-xs font-black uppercase tracking-wider', tone === 'destructive' ? 'text-destructive' : 'text-warning')}>
                                              {categoria.label}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground opacity-70">{categoria.description}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          {gErros.length > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{gErros.length}</Badge>}
                                          {gAvisos.length > 0 && <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-warning/30 text-warning bg-warning/5">{gAvisos.length}</Badge>}
                                        </div>
                                      </div>

                                      <ul className="space-y-1.5">
                                        {[...gErros.map(e => ({ text: e, type: 'error' as const })), ...gAvisos.map(a => ({ text: a, type: 'warn' as const }))].map((item, idx) => (
                                          <li key={idx} className={cn(
                                            'text-[11px] leading-relaxed p-2 rounded-lg border',
                                            item.type === 'error' ? 'bg-destructive/10 border-destructive/10 text-destructive' : 'bg-warning/10 border-warning/10 text-warning-foreground'
                                          )}>
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

                          {erros.length === 0 && avisos.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">
                              Nenhuma validação registrada para esta execução.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
