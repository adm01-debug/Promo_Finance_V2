import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileDown,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { UseMutationResult } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
import { exportChecklistEcfPdf } from '@/lib/sped-ecf-checklist-pdf';
import type { SpedEcfValidacaoResult } from '@/hooks/useSpedContabil';
import type { usePreValidacaoSped } from '@/hooks/usePreValidacaoSped';
import type { useAuditoriaCFC } from '@/hooks/useAuditoriaCFC';
import { AuditoriaCFCPanel } from '../AuditoriaCFCPanel';
import { PreValidacaoSpedPanel } from '../PreValidacaoSpedPanel';
import { SpedChecklistRow } from '../SpedChecklistRow';
import { KpiCard, KpiChip } from './wizard-atoms';

type PreValidacao = ReturnType<typeof usePreValidacaoSped>;
type AuditoriaCFC = ReturnType<typeof useAuditoriaCFC>;

interface Props {
  data: SpedEcfValidacaoResult;
  empresaId: string;
  anoCalendario: number;
  preValidacao: PreValidacao;
  auditoriaCFC: AuditoriaCFC;
  validar: UseMutationResult<
    SpedEcfValidacaoResult,
    Error,
    { empresaId: string; anoCalendario: number }
  >;
  gerarPending: boolean;
  podeGerar: boolean;
  motivoBloqueio: string;
  onBack: () => void;
  onGerar: () => void;
}

export function Step2Validacoes({
  data,
  empresaId,
  anoCalendario,
  preValidacao,
  auditoriaCFC,
  validar,
  gerarPending,
  podeGerar,
  motivoBloqueio,
  onBack,
  onGerar,
}: Props) {
  const erros = data.validacoes.erros.length;
  const avisos = data.validacoes.avisos.length;
  const cfcCriticos = auditoriaCFC.problemasCriticos || 0;
  const errosLista = data.validacoes.erros;
  const avisosLista = data.validacoes.avisos;

  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-3 gap-3">
        <KpiChip
          label="Erros"
          value={erros}
          tone={erros === 0 ? 'success' : 'destructive'}
          Icon={erros === 0 ? CheckCircle2 : XCircle}
        />
        <KpiChip label="Avisos" value={avisos} tone="warning" Icon={AlertTriangle} />
        <KpiChip
          label="CFC críticos"
          value={cfcCriticos}
          tone={cfcCriticos === 0 ? 'success' : 'destructive'}
          Icon={ShieldAlert}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            try {
              const name = exportChecklistEcfPdf({
                data,
                cfcCriticos,
                preValidacaoOk: preValidacao.podeGerar,
              });
              toast.success('Checklist exportado em PDF', { description: name });
            } catch (e) {
              toast.error('Falha ao exportar checklist', {
                description: e instanceof Error ? e.message : 'erro inesperado',
              });
            }
          }}
          className="gap-1 hover-scale"
        >
          <FileDown className="h-3.5 w-3.5" /> Exportar checklist (PDF)
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => validar.mutate({ empresaId, anoCalendario })}
          className="gap-1 hover-scale"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-validar
        </Button>
      </div>

      {(() => {
        const grupos = agruparValidacoes(errosLista, avisosLista);
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
                    tone === 'destructive'
                      ? 'bg-destructive/5 border-destructive/10'
                      : 'bg-warning/5 border-warning/10',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'p-1.5 rounded-lg',
                          tone === 'destructive'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warning/10 text-warning',
                        )}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h4
                          className={cn(
                            'text-xs font-black uppercase tracking-wider',
                            tone === 'destructive' ? 'text-destructive' : 'text-warning',
                          )}
                        >
                          {categoria.label}
                        </h4>
                        <p className="text-[10px] text-muted-foreground opacity-70">
                          {categoria.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {gErros.length > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                          {gErros.length}
                        </Badge>
                      )}
                      {gAvisos.length > 0 && (
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 text-[10px] border-warning/30 text-warning bg-warning/5"
                        >
                          {gAvisos.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="max-h-32">
                    <ul className="space-y-1.5 pr-2">
                      {[
                        ...gErros.map((e) => ({ text: e, type: 'error' as const })),
                        ...gAvisos.map((a) => ({ text: a, type: 'warn' as const })),
                      ].map((item, idx) => (
                        <li
                          key={idx}
                          className={cn(
                            'text-[11px] leading-relaxed p-2 rounded-lg border',
                            item.type === 'error'
                              ? 'bg-destructive/10 border-destructive/10 text-destructive'
                              : 'bg-warning/10 border-warning/10 text-warning-foreground',
                          )}
                        >
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        );
      })()}

      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-1">
        <PreValidacaoSpedPanel resultado={preValidacao} />
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-1">
        <AuditoriaCFCPanel resultado={auditoriaCFC} empresa={data.empresa} compact />
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 divide-y divide-border/50 overflow-hidden animate-fade-in">
        {data.checklist.map((item) => (
          <SpedChecklistRow key={item.id} item={item} id={`wz-checklist-${item.id}`} />
        ))}
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-3">
        <p className="text-sm font-semibold font-display tracking-tight">
          Apuração preliminar (Lucro Real)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Lucro líquido" value={`R$ ${data.apuracao_preview.lucro_liquido.toFixed(2)}`} mono />
          <KpiCard label="Base IRPJ" value={`R$ ${data.apuracao_preview.base_irpj.toFixed(2)}`} mono />
          <KpiCard label="IRPJ (15% + adicional)" value={`R$ ${data.apuracao_preview.irpj.toFixed(2)}`} mono />
          <KpiCard label="CSLL (9%)" value={`R$ ${data.apuracao_preview.csll.toFixed(2)}`} mono />
        </div>
      </div>

      {!podeGerar && motivoBloqueio && (
        <Alert variant="error">
          <AlertTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 animate-pulse" /> Geração de arquivo bloqueada
          </AlertTitle>
          <AlertDescription className="mt-1">{motivoBloqueio}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <div className="flex-1" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={!podeGerar ? 0 : -1}>
                <Button
                  onClick={onGerar}
                  disabled={!podeGerar || gerarPending}
                  variant={podeGerar ? 'premium' : 'outline'}
                  className={cn('gap-2', podeGerar && 'hover-scale', !podeGerar && 'cursor-not-allowed')}
                >
                  {gerarPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !podeGerar ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {!podeGerar ? 'Geração bloqueada' : 'Gerar arquivo SPED ECF'}
                </Button>
              </span>
            </TooltipTrigger>
            {!podeGerar && motivoBloqueio && (
              <TooltipContent side="top" className="max-w-xs">
                {motivoBloqueio}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
