import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Link2,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UseMutationResult } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { SpedEcfValidacaoResult } from '@/hooks/useSpedContabil';
import { ValidacoesPreSpedDialog } from '../ValidacoesPreSpedDialog';
import { KpiCard } from './wizard-atoms';
import type { DivergRow, DivergTone, Step, WizardResultado } from './types';

interface Props {
  resultado: WizardResultado;
  data: SpedEcfValidacaoResult | undefined;
  anoCalendario: number;
  recibo: string;
  setRecibo: (v: string) => void;
  hashCopied: boolean;
  copyHash: () => void;
  baixarZip: () => void;
  handleRegistrar: () => void;
  transmitir: UseMutationResult<unknown, Error, { arquivoId: string; recibo: string; tipo?: 'ECD' | 'ECF' }>;
  validacoesOpen: boolean;
  setValidacoesOpen: (v: boolean) => void;
  setStep: (s: Step) => void;
  onClose: () => void;
  currentStep: Step;
}

export function Step3Download({
  resultado,
  data,
  anoCalendario,
  recibo,
  setRecibo,
  hashCopied,
  copyHash,
  baixarZip,
  handleRegistrar,
  transmitir,
  validacoesOpen,
  setValidacoesOpen,
  setStep,
  onClose,
  currentStep,
}: Props) {
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

  const linhas: DivergRow[] = [
    {
      key: 'periodo',
      label: 'Período',
      ecfValor: periodoEcfStr,
      ecdValor: periodoEcdStr,
      tone: periodoMatch ? 'success' : 'destructive',
      detalhe: periodoMatch ? 'Coincide com a ECD' : 'Períodos divergentes — revise antes de transmitir',
      anchor: { step: 1, targetId: 'wz-meta-periodo' },
    },
    {
      key: 'cnpj',
      label: 'CNPJ',
      ecfValor: resultado.empresa.cnpj,
      ecdValor: ecdRef && data ? data.empresa.cnpj : '—',
      tone: cnpjMatch ? 'success' : 'destructive',
      detalhe: cnpjMatch ? 'Mesma empresa da ECD' : 'CNPJ não confere com a ECD',
      anchor: { step: 1, targetId: 'wz-meta-cnpj' },
    },
    {
      key: 'hash',
      label: 'Hash SHA-256',
      ecfValor: `${(resultado.hash_sha256 || '').substring(0, 16)}…`,
      ecdValor: ecdRef?.hash_sha256 ? `${ecdRef.hash_sha256.substring(0, 16)}…` : '—',
      tone: 'info',
      detalhe: 'Hashes divergem por design (arquivos diferentes) — confira independentemente',
      anchor: { step: 1, targetId: 'wz-ecd-hash' },
    },
    {
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
      anchor: { step: 1, targetId: 'wz-ecd-status' },
    },
  ];

  const totalDiverg =
    linhas.filter((l) => l.tone === 'destructive' || l.tone === 'warning').length +
    checklistAlertas.length;

  const toneClasses: Record<DivergTone, string> = {
    success: 'bg-success/10 text-success border-success/30',
    warning: 'bg-warning/10 text-warning border-warning/30',
    destructive: 'bg-destructive/10 text-destructive border-destructive/30',
    info: 'bg-muted/40 text-muted-foreground border-border/60',
  };

  const goToAnchor = (targetStep: Step, targetId: string, label: string) => {
    const focus = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById(targetId);
          if (!el) {
            toast.warning('Seção não encontrada', {
              description: `Não foi possível localizar "${label}" no passo ${targetStep}.`,
            });
            return;
          }
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('row-highlight-flash');
          window.setTimeout(() => el.classList.remove('row-highlight-flash'), 3000);
        });
      });
    };
    if (currentStep !== targetStep) {
      setStep(targetStep);
      window.setTimeout(focus, 280);
    } else {
      focus();
    }
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
            <p className="text-lg font-semibold font-display tracking-tight text-destructive">
              Download bloqueado
            </p>
            <p className="text-sm text-muted-foreground">
              O arquivo foi gerado, mas a validação retornou {errosResultado.length} erro(s). Corrija e
              regenere antes de baixar.
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
                        toneClasses[row.tone],
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
                            goToAnchor(row.anchor!.step, row.anchor!.targetId, row.label)
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
                  <button
                    type="button"
                    onClick={() => goToAnchor(2, `wz-checklist-${c.id}`, c.label)}
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

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Linhas" value={resultado.total_linhas} />
        <KpiCard label="Lançamentos" value={resultado.total_lancamentos} />
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Hash SHA-256
          </p>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Integridade do arquivo
          </span>
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
                  className={cn(
                    'transition-all duration-200 hover-scale',
                    hashCopied && 'bg-success text-success-foreground hover:bg-success/90 border-success',
                  )}
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

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={() => setValidacoesOpen(true)}
          variant={downloadBloqueado ? 'outline' : 'premium'}
          className={cn(
            'gap-2 hover-scale',
            downloadBloqueado && 'border-destructive/40 text-destructive hover:bg-destructive/10',
          )}
        >
          {downloadBloqueado ? <ShieldAlert className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          Ver validações & baixar
        </Button>
        {downloadBloqueado && (
          <Button variant="outline" onClick={() => setStep(2)} className="gap-2 hover-scale">
            <RefreshCw className="h-4 w-4" /> Voltar e revalidar
          </Button>
        )}
      </div>

      <ValidacoesPreSpedDialog
        open={validacoesOpen}
        onOpenChange={setValidacoesOpen}
        arquivo={{
          tipo: 'ECF',
          ano_calendario: anoCalendario,
          hash_sha256: resultado.hash_sha256,
          status: downloadBloqueado ? 'rejeitado' : 'gerado',
          validacoes: { erros: errosResultado, avisos: avisosResultado },
          cnpj: resultado.empresa?.cnpj,
          razao_social: resultado.empresa?.razao_social,
          periodo_inicio: resultado.periodo?.inicio,
          periodo_fim: resultado.periodo?.fim,
          total_lancamentos: resultado.total_lancamentos,
          total_linhas: resultado.total_linhas,
        }}
        onDownloadTxt={() => window.open(resultado.url, '_blank')}
        onDownloadZip={() => baixarZip()}
      />

      {resultado.arquivo_id &&
        (downloadBloqueado ? (
          <Alert variant="warning" title="Registro de recibo bloqueado">
            <AlertDescription>
              Não é possível registrar o recibo de transmissão enquanto houver erros de validação.
              Corrija os {errosResultado.length} erro(s) e gere o arquivo novamente.
            </AlertDescription>
          </Alert>
        ) : (
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
                  onChange={(e) => setRecibo(e.target.value)}
                  placeholder="Ex.: 12345678901234567890"
                  className="font-mono text-xs"
                />
                <Button
                  onClick={handleRegistrar}
                  disabled={!recibo.trim() || transmitir.isPending}
                  size="sm"
                  className="hover-scale"
                >
                  {transmitir.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Marcar como transmitido'
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}

      <div className="flex">
        <div className="flex-1" />
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </motion.div>
  );
}
