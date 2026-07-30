import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
import type { SpedEcfHistoricoRow } from '@/hooks/useSpedEcfHistorico';

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

interface Props {
  row: SpedEcfHistoricoRow | null;
  onClose: () => void;
}

export function ValidacoesDialog({ row, onClose }: Props) {
  return (
    <Dialog open={!!row} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Validações — ECF {row?.ano_calendario}
          </DialogTitle>
          <DialogDescription>
            {row && format(new Date(row.created_at), "dd/MM/yyyy 'às' HH:mm")}
            {' · '}{row && formatCnpj(row.cnpj)}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {(() => {
            if (!row) return null;
            const grupos = agruparValidacoes(row.validacoes.erros, row.validacoes.avisos);
            const totalErros = row.validacoes.erros.length;
            const totalAvisos = row.validacoes.avisos.length;

            if (grupos.length === 0) {
              return (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Nenhuma validação registrada para esta execução.</p>
                </div>
              );
            }

            return (
              <div className="space-y-4" role="list" aria-label="Validações agrupadas por categoria">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Agrupado por categoria:</span>
                  {totalErros > 0 && (
                    <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{totalErros} erro(s)</Badge>
                  )}
                  {totalAvisos > 0 && (
                    <Badge variant="outline" className="gap-1 border-warning/40 bg-warning/10 text-warning">
                      <AlertTriangle className="h-3 w-3" />{totalAvisos} aviso(s)
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
                      className={cn('rounded-lg border p-3 space-y-2',
                        tone === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5')}
                    >
                      <header className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className={cn('text-sm font-semibold flex items-center gap-2',
                            tone === 'error' ? 'text-destructive' : 'text-warning')}>
                            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                            {categoria.label}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">{categoria.description}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {erros.length > 0 && (
                            <Badge variant="destructive" className="text-[10px]">{erros.length} erro(s)</Badge>
                          )}
                          {avisos.length > 0 && (
                            <Badge variant="outline" className="text-[10px] border-warning/40 bg-warning/10 text-warning">
                              {avisos.length} aviso(s)
                            </Badge>
                          )}
                        </div>
                      </header>

                      {erros.length > 0 && (
                        <ul className="space-y-1" aria-label={`Erros em ${categoria.label}`}>
                          {erros.map((e, i) => (
                            <li key={`e-${i}`} className="rounded-md border border-destructive/30 bg-background/60 px-3 py-2 text-xs text-destructive">{e}</li>
                          ))}
                        </ul>
                      )}

                      {avisos.length > 0 && (
                        <ul className="space-y-1" aria-label={`Avisos em ${categoria.label}`}>
                          {avisos.map((a, i) => (
                            <li key={`a-${i}`} className="rounded-md border border-warning/30 bg-background/60 px-3 py-2 text-xs text-warning-foreground">{a}</li>
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
  );
}
