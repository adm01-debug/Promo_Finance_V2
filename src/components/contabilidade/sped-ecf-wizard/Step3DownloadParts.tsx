import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Link2, Loader2, Send, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DIVERG_TONE_CLASSES } from './crosscheck';
import type { DivergRow, Step } from './types';

export type GoToAnchorFn = (targetStep: Step, targetId: string, label: string) => void;

export interface ChecklistAlertaItem {
  id: string;
  label: string;
  detail?: string;
  status: 'ok' | 'warn' | 'error';
}

export function CrossCheckCard({ linhas, alertas, onGoToAnchor }: {
  linhas: DivergRow[];
  alertas: ChecklistAlertaItem[];
  onGoToAnchor: GoToAnchorFn;
}) {
  const totalDiverg =
    linhas.filter((l) => l.tone === 'destructive' || l.tone === 'warning').length +
    alertas.length;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold font-display tracking-tight flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Cross-check ECF × ECD
          </p>
          <p className="text-xs text-muted-foreground">
            Confira os campos que serão utilizados antes de liberar o download.
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'shrink-0 gap-1',
            totalDiverg === 0
              ? 'border-success/40 text-success bg-success/10'
              : 'border-warning/40 text-warning bg-warning/10',
          )}
        >
          {totalDiverg === 0 ? (
            <>
              <CheckCircle2 className="h-3 w-3" /> Sem divergências
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" /> {totalDiverg} ponto(s) de atenção
            </>
          )}
        </Badge>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          <div className="col-span-3">Campo</div>
          <div className="col-span-4">ECF (atual)</div>
          <div className="col-span-4">ECD (referência)</div>
          <div className="col-span-1 text-right">Status</div>
        </div>
        <div className="divide-y divide-border/50">
          {linhas.map((row) => {
            const showJump =
              (row.tone === 'destructive' || row.tone === 'warning') && !!row.anchor;
            return (
              <div
                key={row.key}
                className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs"
              >
                <div className="col-span-3 font-medium text-foreground">{row.label}</div>
                <div className="col-span-4 font-mono text-foreground/90 break-all">{row.ecfValor}</div>
                <div className="col-span-4 font-mono text-foreground/90 break-all">{row.ecdValor}</div>
                <div className="col-span-1 flex justify-end">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                      DIVERG_TONE_CLASSES[row.tone],
                    )}
                  >
                    {row.tone === 'success' && 'OK'}
                    {row.tone === 'warning' && 'Atenção'}
                    {row.tone === 'destructive' && 'Diverg.'}
                    {row.tone === 'info' && 'Info'}
                  </span>
                </div>
                {(row.detalhe || showJump) && (
                  <div className="col-span-12 flex items-center justify-between gap-2 pl-0.5">
                    {row.detalhe && (
                      <span className="text-[11px] text-muted-foreground">{row.detalhe}</span>
                    )}
                    {showJump && row.anchor && (
                      <button
                        type="button"
                        onClick={() =>
                          onGoToAnchor(row.anchor!.step, row.anchor!.targetId, row.label)
                        }
                        aria-label={`Ir para a seção ${row.label} no passo ${row.anchor.step}`}
                        className="ml-auto inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors hover-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        Ir para passo {row.anchor.step}
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Pontos do cross-check do checklist
          </p>
          <ul className="space-y-1">
            {alertas.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 h-5 px-1.5 text-[10px]',
                    c.status === 'error'
                      ? 'border-destructive/40 text-destructive bg-destructive/10'
                      : 'border-warning/40 text-warning bg-warning/10',
                  )}
                >
                  {c.status === 'error' ? 'erro' : 'aviso'}
                </Badge>
                <div className="flex-1">
                  <p className="text-foreground leading-snug">{c.label}</p>
                  {c.detail && <p className="text-muted-foreground text-[11px]">{c.detail}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => onGoToAnchor(2, `wz-checklist-${c.id}`, c.label)}
                  aria-label={`Ir para "${c.label}" no passo 2`}
                  className="shrink-0 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors hover-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Ir para passo 2
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ResultadoAlertas({ erros, avisos }: { erros: string[]; avisos: string[] }) {
  return (
    <>
      {erros.length > 0 && (
        <Alert variant="error">
          <AlertTitle className="flex items-center gap-2">
            <XCircle className="h-4 w-4" /> {erros.length} erro(s) na validação
          </AlertTitle>
          <AlertDescription>
            <ScrollArea className="max-h-48 mt-2 rounded-md border border-destructive/20 bg-destructive/5 p-2">
              <ul className="space-y-1.5">
                {erros.map((erro, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="flex items-start gap-2 text-xs"
                  >
                    <Badge
                      variant="outline"
                      className="border-destructive/40 text-destructive shrink-0 h-5 px-1.5 text-[10px] font-mono"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </Badge>
                    <span className="leading-snug">{erro}</span>
                  </motion.li>
                ))}
              </ul>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}

      {avisos.length > 0 && (
        <Alert variant="warning">
          <AlertTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {avisos.length} aviso(s)
          </AlertTitle>
          <AlertDescription>
            <ScrollArea className="max-h-40 mt-2 rounded-md border border-warning/20 bg-warning/5 p-2">
              <ul className="space-y-1.5">
                {avisos.map((aviso, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="flex items-start gap-2 text-xs"
                  >
                    <Badge
                      variant="outline"
                      className="border-warning/40 text-warning shrink-0 h-5 px-1.5 text-[10px] font-mono"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </Badge>
                    <span className="leading-snug">{aviso}</span>
                  </motion.li>
                ))}
              </ul>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

export function RegistroRecibo({ bloqueado, erroCount, recibo, onReciboChange, onRegistrar, registrando }: {
  bloqueado: boolean;
  erroCount: number;
  recibo: string;
  onReciboChange: (v: string) => void;
  onRegistrar: () => void;
  registrando: boolean;
}) {
  if (bloqueado) {
    return (
      <Alert variant="warning" title="Registro de recibo bloqueado">
        <AlertDescription>
          Não é possível registrar o recibo de transmissão enquanto houver erros de validação.
          Corrija os {erroCount} erro(s) e gere o arquivo novamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5 space-y-3 animate-fade-in">
      <p className="text-sm font-semibold font-display tracking-tight flex items-center gap-2 text-primary">
        <Send className="h-4 w-4" /> Registrar transmissão à Receita Federal
      </p>
      <p className="text-xs text-muted-foreground">
        Após transmitir o arquivo no PVA-ECF, cole aqui o nº do recibo gerado para marcar como
        transmitido no histórico.
      </p>
      <div className="space-y-2">
        <Label
          htmlFor="recibo-ecf"
          className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium"
        >
          Nº do recibo de transmissão
        </Label>
        <div className="flex gap-2">
          <Input
            id="recibo-ecf"
            value={recibo}
            onChange={(e) => onReciboChange(e.target.value)}
            placeholder="Ex.: 12345678901234567890"
            className="font-mono text-xs"
          />
          <Button
            onClick={onRegistrar}
            disabled={!recibo.trim() || registrando}
            size="sm"
            className="hover-scale"
          >
            {registrando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Marcar como transmitido'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
