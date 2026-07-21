import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Download, FileArchive, Hash, Lock, ScrollText, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
import type { SpedEcfHistoricoRow } from '@/hooks/useSpedEcfHistorico';

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

interface Props {
  row: SpedEcfHistoricoRow;
  isOpen: boolean;
  onToggle: () => void;
  onOpenErros: (r: SpedEcfHistoricoRow) => void;
  onDownloadTxt: (r: SpedEcfHistoricoRow) => void;
  onDownloadZip: (r: SpedEcfHistoricoRow) => void;
}

export function HistoricoRow({ row: h, isOpen, onToggle, onOpenErros, onDownloadTxt, onDownloadZip }: Props) {
  const erros = h.validacoes?.erros ?? [];
  const avisos = h.validacoes?.avisos ?? [];
  const bloqueada = h.status === 'rejeitado' || erros.length > 0;

  return (
    <React.Fragment>
      <TableRow className={cn(isOpen && 'bg-muted/10')}>
        <TableCell className="p-1">
          <Button
            size="sm"
            variant="ghost"
            className={cn('h-7 w-7 p-0 transition-transform duration-200', isOpen && 'bg-primary/10 text-primary hover:bg-primary/20')}
            onClick={onToggle}
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
          <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={h.razao_social}>{h.razao_social}</div>
        </TableCell>
        <TableCell className="font-medium">{h.ano_calendario}</TableCell>
        <TableCell>
          {bloqueada ? (
            <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" />Bloqueado</Badge>
          ) : h.status === 'transmitido' ? (
            <Badge className="gap-1 bg-success hover:bg-success"><CheckCircle2 className="h-3 w-3" />Transmitido</Badge>
          ) : (
            <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Gerado</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <TooltipProvider>
              {(erros.length > 0 || avisos.length > 0) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant={erros.length > 0 ? 'destructive' : 'outline'} onClick={() => onOpenErros(h)}>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {erros.length > 0 ? `${erros.length} erro(s)` : `${avisos.length} aviso(s)`}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver detalhes das validações</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" disabled={bloqueada} onClick={() => onDownloadTxt(h)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{bloqueada ? 'Download bloqueado por erros' : 'Baixar .txt'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" disabled={bloqueada} onClick={() => onDownloadZip(h)}>
                    <FileArchive className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{bloqueada ? 'Download bloqueado por erros' : 'Baixar .zip (com relatório)'}</TooltipContent>
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

              <div className={cn('rounded-lg border p-3 flex items-start gap-3',
                bloqueada ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5')}>
                <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                  bloqueada ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success')}>
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
                        <div key={categoria.id} className={cn('rounded-xl border p-4 space-y-3', tone === 'destructive' ? 'bg-destructive/5 border-destructive/10' : 'bg-warning/5 border-warning/10')}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={cn('p-1.5 rounded-lg', tone === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')}>
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <h4 className={cn('text-xs font-black uppercase tracking-wider', tone === 'destructive' ? 'text-destructive' : 'text-warning')}>{categoria.label}</h4>
                                <p className="text-[10px] text-muted-foreground opacity-70">{categoria.description}</p>
                              </div>
                            </div>
                          </div>
                          <ul className="space-y-1.5">
                            {[...gErros.map(e => ({ text: e, type: 'error' as const })), ...gAvisos.map(a => ({ text: a, type: 'warn' as const }))].map((item, idx) => (
                              <li key={idx} className={cn('text-[11px] leading-relaxed p-2 rounded-lg border', item.type === 'error' ? 'bg-destructive/10 border-destructive/10 text-destructive' : 'bg-warning/10 border-warning/10 text-warning-foreground')}>
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
}
