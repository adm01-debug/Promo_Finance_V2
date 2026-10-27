import { motion } from 'framer-motion';
import { Ban, Check, CheckCircle2, Copy, Download, RefreshCw, ShieldAlert } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { SpedEcfValidacaoResult } from '@/hooks/useSpedContabil';
import { ValidacoesPreSpedDialog } from '../ValidacoesPreSpedDialog';
import { KpiCard } from './wizard-atoms';
import type { Step, WizardResultado } from './types';
import { buildDivergRows, createGoToAnchor } from './crosscheck';
import { CrossCheckCard, RegistroRecibo, ResultadoAlertas } from './Step3DownloadParts';

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
  transmitir: UseMutationResult<
    unknown,
    Error,
    { arquivoId: string; recibo: string; tipo?: 'ECD' | 'ECF' }
  >;
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
  const linhas = buildDivergRows(resultado, data, ecdRef);
  const checklistAlertas = (data?.checklist || []).filter((c) => c.status !== 'ok');
  const goToAnchor = createGoToAnchor(setStep, currentStep);

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
              O arquivo foi gerado, mas a validação retornou {errosResultado.length} erro(s).
              Corrija e regenere antes de baixar.
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
            <p className="text-lg font-semibold font-display tracking-tight">
              Arquivo gerado com sucesso
            </p>
            <p className="text-sm text-muted-foreground font-mono">{resultado.file_name}</p>
          </div>
        </div>
      )}

      <CrossCheckCard linhas={linhas} alertas={checklistAlertas} onGoToAnchor={goToAnchor} />

      <ResultadoAlertas erros={errosResultado} avisos={avisosResultado} />

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
                    hashCopied &&
                      'bg-success text-success-foreground hover:bg-success/90 border-success'
                  )}
                >
                  {hashCopied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
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
            downloadBloqueado && 'border-destructive/40 text-destructive hover:bg-destructive/10'
          )}
        >
          {downloadBloqueado ? (
            <ShieldAlert className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
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

      {resultado.arquivo_id && (
        <RegistroRecibo
          bloqueado={downloadBloqueado}
          erroCount={errosResultado.length}
          recibo={recibo}
          onReciboChange={setRecibo}
          onRegistrar={handleRegistrar}
          registrando={transmitir.isPending}
        />
      )}

      <div className="flex">
        <div className="flex-1" />
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </motion.div>
  );
}
