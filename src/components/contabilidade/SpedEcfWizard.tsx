import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Download, FileArchive, Copy, Check, ChevronRight, ShieldAlert, RefreshCw, Link2, Send, Building2, Hash, Calendar, FileText, Sparkles, Lock, Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useSpedEcfValidacao,
  useGerarSpedContabil,
  useRegistrarTransmissaoSped,
  type SpedGeracaoResult,
} from '@/hooks/useSpedContabil';
import { usePreValidacaoSped } from '@/hooks/usePreValidacaoSped';
import { useAuditoriaCFC } from '@/hooks/useAuditoriaCFC';
import { baixarSpedZip } from '@/lib/sped-zip';
import { SpedChecklistRow } from './SpedChecklistRow';
import { PreValidacaoSpedPanel } from './PreValidacaoSpedPanel';
import { AuditoriaCFCPanel } from './AuditoriaCFCPanel';
import { AnimatedCounter } from '@/components/reforma-tributaria/AnimatedCounter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string;
  anoCalendario: number;
}

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Período & ECD' },
  { n: 2, label: 'Validações' },
  { n: 3, label: 'Download' },
];

function StepPills({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
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

function KpiCard({ label, value, mono }: { label: string; value: number | string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      {typeof value === 'number' ? (
        <p className="text-2xl font-display font-semibold tracking-tight mt-1 tabular-nums">
          <AnimatedCounter value={value} formatFn={(v) => Math.round(v).toLocaleString('pt-BR')} />
        </p>
      ) : (
        <p className={cn('text-2xl font-display font-semibold tracking-tight mt-1', mono && 'font-mono')}>{value}</p>
      )}
    </div>
  );
}

const WIZARD_DRAFT_KEY = (empresaId: string, ano: number) =>
  `sped-ecf-wizard-draft:${empresaId}:${ano}`;

export function SpedEcfWizard({ open, onOpenChange, empresaId, anoCalendario }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [resultado, setResultado] = useState<(SpedGeracaoResult & { arquivo_id?: string }) | null>(null);
  const [recibo, setRecibo] = useState('');
  const [hashCopied, setHashCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validar = useSpedEcfValidacao();
  const gerar = useGerarSpedContabil();
  const transmitir = useRegistrarTransmissaoSped();
  const preValidacao = usePreValidacaoSped(empresaId, anoCalendario);
  const auditoriaCFC = useAuditoriaCFC(empresaId);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  // Hidrata rascunho (step + recibo) ao abrir
  useEffect(() => {
    if (open && empresaId && anoCalendario) {
      let restoredStep: Step = 1;
      let restoredRecibo = '';
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(WIZARD_DRAFT_KEY(empresaId, anoCalendario));
          if (raw) {
            const parsed = JSON.parse(raw) as { step?: Step; recibo?: string };
            if (parsed.step === 1 || parsed.step === 2) restoredStep = parsed.step;
            if (typeof parsed.recibo === 'string') restoredRecibo = parsed.recibo;
          }
        } catch { /* noop */ }
      }
      setStep(restoredStep);
      setResultado(null);
      setRecibo(restoredRecibo);
      validar.mutate({ empresaId, anoCalendario });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaId, anoCalendario]);

  // Persiste rascunho enquanto o wizard está aberto (sem persistir step 3, que é resultado pós-geração)
  useEffect(() => {
    if (!open || !empresaId || !anoCalendario || typeof window === 'undefined') return;
    if (step === 3) return;
    try {
      window.localStorage.setItem(
        WIZARD_DRAFT_KEY(empresaId, anoCalendario),
        JSON.stringify({ step, recibo, ts: Date.now() }),
      );
    } catch { /* noop */ }
  }, [open, empresaId, anoCalendario, step, recibo]);

  const data = validar.data;
  const erros = data?.validacoes.erros.length || 0;
  const avisos = data?.validacoes.avisos.length || 0;
  const cfcCriticos = auditoriaCFC.problemasCriticos || 0;
  const podeGerar = !!data && erros === 0 && preValidacao.podeGerar && cfcCriticos === 0;
  const errosLista = data?.validacoes.erros || [];
  const avisosLista = data?.validacoes.avisos || [];
  const motivosBloqueio: string[] = [];
  if (data) {
    if (erros > 0) motivosBloqueio.push(`${erros} erro(s) de validação`);
    if (!data.ecd_referencia) motivosBloqueio.push('ECD do período não localizada');
    if (!preValidacao.podeGerar) motivosBloqueio.push('Pré-validação SPED com pendências críticas');
    if (cfcCriticos > 0) motivosBloqueio.push(`${cfcCriticos} pendência(s) CFC crítica(s)`);
  }
  const motivoBloqueio = motivosBloqueio.join(' · ');

  const handleGerar = async () => {
    try {
      const r = await gerar.mutateAsync({ empresaId, anoCalendario, tipo: 'ECF', silent: true });
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
      toast.success('Hash copiado');
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
        tipo: 'ECF',
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  const handleRegistrar = async () => {
    if (!resultado?.arquivo_id || !recibo.trim()) return;
    await transmitir.mutateAsync({ arquivoId: resultado.arquivo_id, recibo: recibo.trim(), tipo: 'ECF' });
    setRecibo('');
  };

  const progresso = step === 1 ? 33 : step === 2 ? 66 : 100;
  const ecd = data?.ecd_referencia;
  const progressVariant: 'success' | 'warning' | 'danger' | 'default' =
    step === 3 ? 'success'
    : step === 2 && erros > 0 ? 'danger'
    : step === 2 && avisos > 0 ? 'warning'
    : 'default';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-display font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Wizard SPED ECF · {anoCalendario}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Validação cruzada com a ECD do mesmo período
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

              {ecd ? (
                <div className="rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-5 space-y-3 animate-scale-in">
                  <div className="flex items-center gap-2 text-sm font-semibold font-display tracking-tight text-success">
                    <Link2 className="h-4 w-4" /> ECD vinculada localizada
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Gerada em</p>
                      <p className="font-mono text-sm text-foreground">{format(new Date(ecd.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Status</p>
                      <Badge
                        className={cn(
                          ecd.status === 'transmitido' ? 'bg-success/15 text-success border-success/30' : 'bg-muted text-muted-foreground border-border',
                        )}
                        variant="outline"
                      >
                        {ecd.status}
                      </Badge>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Hash SHA-256</p>
                      <code className="text-xs font-mono text-foreground">{(ecd.hash_sha256 || '').substring(0, 32)}…</code>
                    </div>
                    {ecd.recibo_transmissao && (
                      <div className="col-span-2 space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Recibo de transmissão</p>
                        <p className="font-mono text-xs text-foreground">{ecd.recibo_transmissao}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Alert variant="error" title="ECD do período não localizada">
                  <AlertDescription>
                    Gere e (idealmente) transmita a SPED ECD do mesmo ano-calendário antes de prosseguir com a ECF.
                  </AlertDescription>
                </Alert>
              )}

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
                <Alert variant="error">
                  <AlertTitle className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> {errosLista.length} erro(s) encontrado(s)
                  </AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="max-h-48 mt-2 rounded-md border border-destructive/20 bg-destructive/5 p-2">
                      <ul className="space-y-1.5">
                        {errosLista.map((erro, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            className="flex items-start gap-2 text-xs"
                          >
                            <Badge variant="outline" className="border-destructive/40 text-destructive shrink-0 h-5 px-1.5 text-[10px] font-mono">
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

              {avisosLista.length > 0 && (
                <Alert variant="warning">
                  <AlertTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {avisosLista.length} aviso(s)
                  </AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="max-h-40 mt-2 rounded-md border border-warning/20 bg-warning/5 p-2">
                      <ul className="space-y-1.5">
                        {avisosLista.map((aviso, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            className="flex items-start gap-2 text-xs"
                          >
                            <Badge variant="outline" className="border-warning/40 text-warning shrink-0 h-5 px-1.5 text-[10px] font-mono">
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

              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-1">
                <PreValidacaoSpedPanel resultado={preValidacao} />
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-1">
                <AuditoriaCFCPanel resultado={auditoriaCFC} empresa={data.empresa} compact />
              </div>

              <div className="rounded-xl border border-border/60 bg-card/40 divide-y divide-border/50 overflow-hidden animate-fade-in">
                {data.checklist.map((item) => <SpedChecklistRow key={item.id} item={item} />)}
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 space-y-3">
                <p className="text-sm font-semibold font-display tracking-tight">Apuração preliminar (Lucro Real)</p>
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
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <div className="flex-1" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={!podeGerar ? 0 : -1}>
                        <Button
                          onClick={handleGerar}
                          disabled={!podeGerar || gerar.isPending}
                          variant={podeGerar ? 'premium' : 'outline'}
                          className={cn('gap-2', podeGerar && 'hover-scale', !podeGerar && 'cursor-not-allowed')}
                        >
                          {gerar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : !podeGerar ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
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
          )}

          {step === 3 && resultado && (() => {
            const errosResultado = resultado.validacoes?.erros || [];
            const avisosResultado = resultado.validacoes?.avisos || [];
            const downloadBloqueado = errosResultado.length > 0;

            // ---- Cross-check ECF × ECD ----
            const ecdRef = data?.ecd_referencia ?? null;
            const periodoEcfStr = `${resultado.periodo.inicio} → ${resultado.periodo.fim}`;
            const periodoEcdStr = data ? `${data.periodo.inicio} → ${data.periodo.fim}` : '—';
            const periodoMatch = !!data && periodoEcfStr === periodoEcdStr;
            const cnpjMatch = !!data && resultado.empresa.cnpj === data.empresa.cnpj;
            const ecdTransmitida = ecdRef?.status === 'transmitido';
            const checklistAlertas = (data?.checklist || []).filter((c) => c.status !== 'ok');

            type DivergRow = {
              key: string;
              label: string;
              ecfValor: string;
              ecdValor: string;
              tone: 'success' | 'warning' | 'destructive' | 'info';
              detalhe?: string;
            };
            const linhas: DivergRow[] = [];
            linhas.push({
              key: 'periodo',
              label: 'Período',
              ecfValor: periodoEcfStr,
              ecdValor: periodoEcdStr,
              tone: periodoMatch ? 'success' : 'destructive',
              detalhe: periodoMatch ? 'Coincide com a ECD' : 'Períodos divergentes — revise antes de transmitir',
            });
            linhas.push({
              key: 'cnpj',
              label: 'CNPJ',
              ecfValor: resultado.empresa.cnpj,
              ecdValor: ecdRef ? data!.empresa.cnpj : '—',
              tone: cnpjMatch ? 'success' : 'destructive',
              detalhe: cnpjMatch ? 'Mesma empresa da ECD' : 'CNPJ não confere com a ECD',
            });
            linhas.push({
              key: 'hash',
              label: 'Hash SHA-256',
              ecfValor: `${(resultado.hash_sha256 || '').substring(0, 16)}…`,
              ecdValor: ecdRef?.hash_sha256 ? `${ecdRef.hash_sha256.substring(0, 16)}…` : '—',
              tone: 'info',
              detalhe: 'Hashes divergem por design (arquivos diferentes) — confira independentemente',
            });
            linhas.push({
              key: 'ecd-status',
              label: 'Status da ECD vinculada',
              ecfValor: '—',
              ecdValor: ecdRef ? ecdRef.status : 'não localizada',
              tone: ecdTransmitida ? 'success' : ecdRef ? 'warning' : 'destructive',
              detalhe: ecdTransmitida
                ? 'ECD já transmitida à Receita Federal'
                : ecdRef
                  ? 'Recomenda-se transmitir a ECD antes da ECF'
                  : 'ECD do período não encontrada',
            });

            const totalDiverg = linhas.filter((l) => l.tone === 'destructive' || l.tone === 'warning').length + checklistAlertas.length;

            const toneClasses: Record<DivergRow['tone'], string> = {
              success: 'bg-success/10 text-success border-success/30',
              warning: 'bg-warning/10 text-warning border-warning/30',
              destructive: 'bg-destructive/10 text-destructive border-destructive/30',
              info: 'bg-muted/40 text-muted-foreground border-border/60',
            };

            return (
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
                    <p className="text-lg font-semibold font-display tracking-tight text-destructive">Download bloqueado</p>
                    <p className="text-sm text-muted-foreground">
                      O arquivo foi gerado, mas a validação retornou {errosResultado.length} erro(s). Corrija e regenere antes de baixar.
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{resultado.file_name}</p>
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

              {/* ---- Cross-check ECF × ECD ---- */}
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
                      <><CheckCircle2 className="h-3 w-3" /> Sem divergências</>
                    ) : (
                      <><AlertTriangle className="h-3 w-3" /> {totalDiverg} ponto(s) de atenção</>
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
                    {linhas.map((row) => (
                      <div key={row.key} className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs">
                        <div className="col-span-3 font-medium text-foreground">{row.label}</div>
                        <div className="col-span-4 font-mono text-foreground/90 break-all">{row.ecfValor}</div>
                        <div className="col-span-4 font-mono text-foreground/90 break-all">{row.ecdValor}</div>
                        <div className="col-span-1 flex justify-end">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                              toneClasses[row.tone],
                            )}
                          >
                            {row.tone === 'success' && 'OK'}
                            {row.tone === 'warning' && 'Atenção'}
                            {row.tone === 'destructive' && 'Diverg.'}
                            {row.tone === 'info' && 'Info'}
                          </span>
                        </div>
                        {row.detalhe && (
                          <div className="col-span-12 text-[11px] text-muted-foreground pl-0.5">{row.detalhe}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {checklistAlertas.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                      Pontos do cross-check do checklist
                    </p>
                    <ul className="space-y-1">
                      {checklistAlertas.map((c) => (
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
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {errosResultado.length > 0 && (
                <Alert variant="error">
                  <AlertTitle className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> {errosResultado.length} erro(s) na validação
                  </AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="max-h-48 mt-2 rounded-md border border-destructive/20 bg-destructive/5 p-2">
                      <ul className="space-y-1.5">
                        {errosResultado.map((erro, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            className="flex items-start gap-2 text-xs"
                          >
                            <Badge variant="outline" className="border-destructive/40 text-destructive shrink-0 h-5 px-1.5 text-[10px] font-mono">
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

              {avisosResultado.length > 0 && (
                <Alert variant="warning">
                  <AlertTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {avisosResultado.length} aviso(s)
                  </AlertTitle>
                  <AlertDescription>
                    <ScrollArea className="max-h-40 mt-2 rounded-md border border-warning/20 bg-warning/5 p-2">
                      <ul className="space-y-1.5">
                        {avisosResultado.map((aviso, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            className="flex items-start gap-2 text-xs"
                          >
                            <Badge variant="outline" className="border-warning/40 text-warning shrink-0 h-5 px-1.5 text-[10px] font-mono">
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
                  Sempre valide no PVA-ECF da Receita Federal antes da transmissão oficial.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={downloadBloqueado ? 0 : -1}>
                        <Button
                          onClick={() => window.open(resultado.url, '_blank')}
                          disabled={downloadBloqueado}
                          variant={downloadBloqueado ? 'outline' : 'premium'}
                          className={cn('gap-2', !downloadBloqueado && 'hover-scale', downloadBloqueado && 'cursor-not-allowed')}
                        >
                          {downloadBloqueado ? <Ban className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                          Baixar .txt
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {downloadBloqueado && (
                      <TooltipContent side="top">
                        Corrija os {errosResultado.length} erro(s) antes de baixar
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={downloadBloqueado ? 0 : -1}>
                        <Button
                          variant="outline"
                          onClick={baixarZip}
                          disabled={downloadBloqueado}
                          className={cn('gap-2', !downloadBloqueado && 'hover-scale', downloadBloqueado && 'cursor-not-allowed')}
                        >
                          {downloadBloqueado ? <Ban className="h-4 w-4" /> : <FileArchive className="h-4 w-4" />}
                          Baixar .zip (com README)
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {downloadBloqueado && (
                      <TooltipContent side="top">
                        Corrija os {errosResultado.length} erro(s) antes de baixar
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                {downloadBloqueado && (
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2 hover-scale">
                    <RefreshCw className="h-4 w-4" /> Voltar e revalidar
                  </Button>
                )}
              </div>

              {resultado.arquivo_id && (
                <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5 space-y-3 animate-fade-in">
                  <p className="text-sm font-semibold font-display tracking-tight flex items-center gap-2 text-primary">
                    <Send className="h-4 w-4" /> Registrar transmissão à Receita Federal
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Após transmitir o arquivo no PVA-ECF, cole aqui o nº do recibo gerado para marcar como transmitido no histórico.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="recibo-ecf" className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                      Nº do recibo de transmissão
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="recibo-ecf"
                        value={recibo}
                        onChange={e => setRecibo(e.target.value)}
                        placeholder="Ex.: 12345678901234567890"
                        className="font-mono text-xs"
                      />
                      <Button onClick={handleRegistrar} disabled={!recibo.trim() || transmitir.isPending} size="sm" className="hover-scale">
                        {transmitir.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Marcar como transmitido'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex">
                <div className="flex-1" />
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
              </div>
            </motion.div>
            );
          })()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
