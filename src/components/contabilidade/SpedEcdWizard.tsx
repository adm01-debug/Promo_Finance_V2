import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Download, FileArchive, Copy, Check, ChevronRight, ShieldAlert, RefreshCw, Lock, Ban, Building2, Hash, Calendar, FileText, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpedEcdValidacao, useGerarSpedContabil, type SpedGeracaoResult } from '@/hooks/useSpedContabil';
import { usePreValidacaoSped } from '@/hooks/usePreValidacaoSped';
import { useAuditoriaCFC } from '@/hooks/useAuditoriaCFC';
import { baixarSpedZip } from '@/lib/sped-zip';
import { SpedChecklistRow } from './SpedChecklistRow';
import { PreValidacaoSpedPanel } from './PreValidacaoSpedPanel';
import { AuditoriaCFCPanel } from './AuditoriaCFCPanel';
import { ValidacoesPreSpedDialog } from './ValidacoesPreSpedDialog';
import { AnimatedCounter } from '@/components/reforma-tributaria/AnimatedCounter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string;
  anoCalendario: number;
}

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Período' },
  { n: 2, label: 'Validações' },
  { n: 3, label: 'Download' },
];

function StepPills({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const completed = step > s.n;
        const current = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300',
                completed && 'bg-success/15 text-success',
                current && 'bg-primary/15 text-primary ring-1 ring-primary/30',
                !completed && !current && 'bg-muted text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                  completed && 'bg-success text-success-foreground',
                  current && 'bg-primary text-primary-foreground',
                  !completed && !current && 'bg-background text-muted-foreground',
                )}
              >
                {completed ? <Check className="h-3 w-3" /> : s.n}
              </span>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-4 transition-colors', step > s.n ? 'bg-success/40' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SpedEcdWizard({ open, onOpenChange, empresaId, anoCalendario }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [resultado, setResultado] = useState<SpedGeracaoResult | null>(null);
  const [hashCopied, setHashCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validar = useSpedEcdValidacao();
  const gerar = useGerarSpedContabil();
  const preValidacao = usePreValidacaoSped(empresaId, anoCalendario);
  const auditoriaCFC = useAuditoriaCFC(empresaId);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

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

  const copyHash = async () => {
    if (!resultado?.hash_sha256) return;
    try {
      await navigator.clipboard.writeText(resultado.hash_sha256);
      setHashCopied(true);
      toast.success('Hash SHA-256 copiado');
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setHashCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o hash');
    }
  };

  const baixarZip = async () => {
    if (!resultado) return;
    try {
      await baixarSpedZip({
        txtUrl: resultado.url,
        fileName: resultado.file_name,
        hash: resultado.hash_sha256,
        empresa: resultado.empresa,
        periodo: resultado.periodo,
        totalLinhas: resultado.total_linhas,
        totalLancamentos: resultado.total_lancamentos,
        tipo: 'ECD',
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha ao gerar ZIP: ${e instanceof Error ? e.message : 'erro'}`);
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

              {errosLista.length > 0 && (
                <Alert variant="error" title={`${errosLista.length} erro(s) impedem a geração`}>
                  <div className="mt-2">
                    <ScrollArea className="max-h-48 rounded-md border border-border/60 bg-destructive/5 p-2">
                      <ul className="space-y-1.5 text-sm">
                        {errosLista.map((e, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            className="flex gap-2 items-start"
                          >
                            <Badge variant="destructive" className="h-5 px-1.5 shrink-0 mt-0.5">{i + 1}</Badge>
                            <span className="text-foreground break-words">{e}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </Alert>
              )}

              {avisosLista.length > 0 && (
                <Alert variant="warning" title={`${avisosLista.length} aviso(s) recomendam revisão`}>
                  <ScrollArea className="max-h-40 rounded-md border border-border/60 bg-warning/5 p-2 mt-2">
                    <ul className="space-y-1.5 text-sm">
                      {avisosLista.map((a, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          className="flex gap-2 items-start"
                        >
                          <Badge variant="outline" className="h-5 px-1.5 shrink-0 mt-0.5 border-warning/40 text-warning">{i + 1}</Badge>
                          <span className="text-foreground break-words">{a}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </ScrollArea>
                </Alert>
              )}

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
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {downloadBloqueado ? (
                <div className="rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 p-5 flex items-start gap-4 animate-scale-in">
                  <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <Ban className="h-5 w-5 text-destructive animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-lg font-semibold font-display tracking-tight">Download bloqueado</p>
                    <p className="text-sm text-muted-foreground">
                      O arquivo <span className="font-mono text-foreground">{resultado.file_name}</span> foi gerado, mas a validação retornou {errosResultado.length} erro(s). Os botões de download estão bloqueados até a correção.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-5 flex items-start gap-4 animate-scale-in">
                  <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-lg font-semibold font-display tracking-tight">Arquivo gerado com sucesso</p>
                    <p className="text-sm text-muted-foreground font-mono">{resultado.file_name}</p>
                  </div>
                </div>
              )}

              {errosResultado.length > 0 && (
                <Alert variant="error" title={`${errosResultado.length} erro(s) na geração`}>
                  <ScrollArea className="max-h-48 rounded-md border border-border/60 bg-destructive/5 p-2 mt-2">
                    <ul className="space-y-1.5 text-sm">
                      {errosResultado.map((e, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <Badge variant="destructive" className="h-5 px-1.5 shrink-0 mt-0.5">{i + 1}</Badge>
                          <span className="text-foreground break-words">{e}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </Alert>
              )}

              {avisosResultado.length > 0 && (
                <Alert variant="warning" title={`${avisosResultado.length} aviso(s)`}>
                  <ScrollArea className="max-h-32 rounded-md border border-border/60 bg-warning/5 p-2 mt-2">
                    <ul className="space-y-1 text-sm">
                      {avisosResultado.map((a, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <Badge variant="outline" className="h-5 px-1.5 shrink-0 mt-0.5 border-warning/40 text-warning">{i + 1}</Badge>
                          <span className="text-foreground break-words">{a}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <KpiCard label="Linhas" value={resultado.total_linhas} />
                <KpiCard label="Lançamentos" value={resultado.total_lancamentos} />
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Hash SHA-256</p>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Integridade do arquivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-muted/40 border border-border/60 rounded-lg p-3 break-all select-all">
                    {resultado.hash_sha256}
                  </code>
                  <TooltipProvider>
                    <Tooltip open={hashCopied || undefined}>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={hashCopied ? 'default' : 'outline'}
                          onClick={copyHash}
                          aria-label={hashCopied ? 'Hash copiado' : 'Copiar hash SHA-256'}
                          className={cn('transition-all duration-200 hover-scale', hashCopied && 'bg-success text-success-foreground hover:bg-success/90 border-success')}
                        >
                          {hashCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {hashCopied ? (
                          <span className="flex items-center gap-1.5 font-medium">
                            <Check className="h-3.5 w-3.5" /> Copiado para a área de transferência
                          </span>
                        ) : (
                          <span>Copiar hash SHA-256</span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <Alert variant="info" title="Arquivo preliminar">
                <AlertDescription>
                  Sempre valide no PVA-ECD da Receita Federal antes da transmissão oficial.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={downloadBloqueado ? 0 : -1}>
                        <Button
                          onClick={() => !downloadBloqueado && window.open(resultado.url, '_blank')}
                          disabled={downloadBloqueado}
                          aria-disabled={downloadBloqueado}
                          variant={downloadBloqueado ? 'outline' : 'premium'}
                          className={cn('gap-2', !downloadBloqueado && 'hover-scale')}
                        >
                          {downloadBloqueado ? <Ban className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                          Baixar .txt
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {downloadBloqueado && (
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium">Download bloqueado</p>
                        <p className="text-xs">Corrija os {errosResultado.length} erro(s) antes de baixar.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={downloadBloqueado ? 0 : -1}>
                        <Button
                          variant="outline"
                          onClick={() => !downloadBloqueado && baixarZip()}
                          disabled={downloadBloqueado}
                          aria-disabled={downloadBloqueado}
                          className={cn('gap-2', !downloadBloqueado && 'hover-scale')}
                        >
                          {downloadBloqueado ? <Ban className="h-4 w-4" /> : <FileArchive className="h-4 w-4" />}
                          Baixar .zip (com README)
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {downloadBloqueado && (
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium">Download bloqueado</p>
                        <p className="text-xs">Corrija os {errosResultado.length} erro(s) antes de baixar.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>

                <div className="flex-1" />
                {downloadBloqueado && (
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2 hover-scale">
                    <RefreshCw className="h-4 w-4" /> Voltar e revalidar
                  </Button>
                )}
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function MetaField({ icon: Icon, label, value, mono }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        <Icon className="h-3 w-3 text-primary/70" />
        {label}
      </p>
      <p className={cn('text-sm font-medium text-foreground', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

function KpiChip({ label, value, tone, Icon }: { label: string; value: number; tone: 'success' | 'destructive' | 'warning'; Icon: React.ComponentType<{ className?: string }> }) {
  const toneClass =
    tone === 'success' ? 'bg-success/10 text-success border-success/20'
    : tone === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/20'
    : 'bg-warning/10 text-warning border-warning/20';
  return (
    <div className={cn('rounded-xl border p-3 flex items-center gap-3 transition-all duration-200', toneClass)}>
      <div className="h-8 w-8 rounded-lg bg-background/40 flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide opacity-80 font-medium">{label}</p>
        <p className="text-xl font-display font-semibold leading-none mt-0.5">
          <AnimatedCounter value={value} formatFn={(v) => Math.round(v).toString()} />
        </p>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-display font-semibold tracking-tight mt-1 tabular-nums">
        <AnimatedCounter value={value} formatFn={(v) => Math.round(v).toLocaleString('pt-BR')} />
      </p>
    </div>
  );
}
