import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ChevronRight, AlertTriangle, ShieldAlert, RefreshCw, Lock, Download, Building2, Hash, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpedEcdValidacao, useGerarSpedContabil, type SpedGeracaoResult } from '@/hooks/useSpedContabil';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
import { usePreValidacaoSped } from '@/hooks/usePreValidacaoSped';
import { useAuditoriaCFC } from '@/hooks/useAuditoriaCFC';
import { SpedChecklistRow } from './SpedChecklistRow';
import { PreValidacaoSpedPanel } from './PreValidacaoSpedPanel';
import { AuditoriaCFCPanel } from './AuditoriaCFCPanel';
import { cn } from '@/lib/utils';
import { StepPills, MetaField, KpiChip, type Step } from './SpedEcdWizardBits';
import { SpedEcdWizardStep3 } from './SpedEcdWizardStep3';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string;
  anoCalendario: number;
}

export function SpedEcdWizard({ open, onOpenChange, empresaId, anoCalendario }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [resultado, setResultado] = useState<SpedGeracaoResult | null>(null);
  const [validacoesOpen, setValidacoesOpen] = useState(false);
  const validar = useSpedEcdValidacao();
  const gerar = useGerarSpedContabil();
  const preValidacao = usePreValidacaoSped(empresaId, anoCalendario);
  const auditoriaCFC = useAuditoriaCFC(empresaId);

  useEffect(() => {
    if (open && empresaId && anoCalendario) {
      setStep(1);
      setResultado(null);
      validar.mutate({ empresaId, anoCalendario });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaId, anoCalendario]);

  const data = validar.data;
  const erros = data?.validacoes.erros.length || 0;
  const avisos = data?.validacoes.avisos.length || 0;
  const errosLista = data?.validacoes.erros ?? [];
  const avisosLista = data?.validacoes.avisos ?? [];
  const cfcCriticos = auditoriaCFC.problemasCriticos || 0;
  const preValidacaoBloqueia = !preValidacao.podeGerar;
  const totalBloqueios = erros + cfcCriticos + (preValidacaoBloqueia ? 1 : 0);
  const podeGerar = !!data && totalBloqueios === 0;
  const motivoBloqueio = !data
    ? 'Aguarde a validação concluir antes de gerar o SPED ECD.'
    : erros > 0
      ? `${erros} erro(s) crítico(s) na validação do SPED ECD impedem a geração.`
      : cfcCriticos > 0
        ? `${cfcCriticos} problema(s) crítico(s) na auditoria CFC do plano de contas.`
        : preValidacaoBloqueia
          ? 'A pré-validação do período identificou bloqueios. Resolva-os antes de gerar.'
          : '';

  const errosResultado = resultado?.validacoes.erros ?? [];
  const avisosResultado = resultado?.validacoes.avisos ?? [];
  const downloadBloqueado = errosResultado.length > 0;

  const handleGerar = async () => {
    try {
      const r = await gerar.mutateAsync({ empresaId, anoCalendario, tipo: 'ECD', silent: true });
      setResultado(r);
      setStep(3);
    } catch {
      // tratado pelo onError
    }
  };

  const progresso = step === 1 ? 33 : step === 2 ? 66 : 100;
  const progressVariant: 'success' | 'warning' | 'danger' | 'default' =
    step === 3 && downloadBloqueado ? 'danger'
    : step === 3 ? 'success'
    : step === 2 && erros > 0 ? 'danger'
    : step === 2 && avisos > 0 ? 'warning'
    : 'default';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-display font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Wizard SPED ECD · {anoCalendario}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Validação completa antes da geração do arquivo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <StepPills step={step} />
          <Progress value={progresso} size="sm" variant={progressVariant} />
        </div>

        {validar.isPending && (
          <div className="flex items-center justify-center py-12 text-muted-foreground animate-fade-in">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando validações...
          </div>
        )}

        <AnimatePresence mode="wait">
          {!validar.isPending && data && step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm p-5">
                <div className="grid grid-cols-2 gap-5">
                  <MetaField icon={Building2} label="Empresa" value={data.empresa.razao_social} />
                  <MetaField icon={Hash} label="CNPJ" value={data.empresa.cnpj} mono />
                  <MetaField icon={Calendar} label="Período" value={`${data.periodo.inicio} → ${data.periodo.fim}`} />
                  <MetaField icon={FileText} label="Lançamentos no período" value={String(data.total_lancamentos)} mono />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1" />
                <Button onClick={() => setStep(2)} className="hover-scale gap-1">
                  Próximo: Validações <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {!validar.isPending && data && step === 2 && (
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

              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => validar.mutate({ empresaId, anoCalendario })} className="gap-1 hover-scale">
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
                            <div className="flex gap-1">
                              {gErros.length > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{gErros.length}</Badge>}
                              {gAvisos.length > 0 && <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-warning/30 text-warning bg-warning/5">{gAvisos.length}</Badge>}
                            </div>
                          </div>
                          <ScrollArea className="max-h-32">
                            <ul className="space-y-1.5 pr-2">
                              {[...gErros.map(e => ({ text: e, type: 'error' as const })), ...gAvisos.map(a => ({ text: a, type: 'warn' as const }))].map((item, idx) => (
                                <li key={idx} className={cn("text-[11px] leading-relaxed p-2 rounded-lg border", item.type === 'error' ? "bg-destructive/10 border-destructive/10 text-destructive" : "bg-warning/10 border-warning/10 text-warning-foreground")}>
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
                {data.checklist.map((item) => <SpedChecklistRow key={item.id} item={item} />)}
              </div>

              {!podeGerar && data && (
                <Alert variant="error" title="Geração de arquivo bloqueada">
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 animate-pulse" />
                      {motivoBloqueio}
                    </p>
                    <p className="text-xs opacity-90">
                      Resolva os itens marcados acima e clique em <strong>Re-validar</strong> antes de tentar gerar novamente.
                    </p>
                  </div>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <div className="flex-1" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={!podeGerar ? 0 : -1}>
                        <Button
                          onClick={handleGerar}
                          disabled={!podeGerar || gerar.isPending}
                          aria-disabled={!podeGerar || gerar.isPending}
                          variant={podeGerar ? 'premium' : 'outline'}
                          className={cn('gap-2', podeGerar && 'hover-scale', !podeGerar && 'cursor-not-allowed')}
                        >
                          {gerar.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : !podeGerar ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {!podeGerar ? 'Geração bloqueada' : 'Gerar arquivo SPED ECD'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!podeGerar && (
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium mb-1">Não é possível gerar o SPED ECD</p>
                        <p className="text-xs">{motivoBloqueio}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </motion.div>
          )}

          {step === 3 && resultado && (
            <SpedEcdWizardStep3
              resultado={resultado}
              downloadBloqueado={downloadBloqueado}
              errosResultado={errosResultado}
              avisosResultado={avisosResultado}
              anoCalendario={anoCalendario}
              validacoesOpen={validacoesOpen}
              onValidacoesOpenChange={setValidacoesOpen}
              onVoltarRevalidar={() => setStep(2)}
              onFechar={() => onOpenChange(false)}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
