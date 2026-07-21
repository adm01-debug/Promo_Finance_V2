import { AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { StepPills } from './sped-ecf-wizard/wizard-atoms';
import { Step1PeriodoEcd } from './sped-ecf-wizard/Step1PeriodoEcd';
import { Step2Validacoes } from './sped-ecf-wizard/Step2Validacoes';
import { Step3Download } from './sped-ecf-wizard/Step3Download';
import { useSpedEcfWizardState } from './sped-ecf-wizard/useSpedEcfWizardState';
import type { WizardProps } from './sped-ecf-wizard/types';

/**
 * Wizard de geração da SPED ECF em 3 passos:
 *   1. Período & ECD vinculada
 *   2. Validações (checklist, pré-SPED, CFC, apuração preliminar)
 *   3. Download (hash, ZIP, cross-check ECF × ECD, registro de recibo)
 *
 * Este componente é o orquestrador fino: monta o `Dialog`, controla a
 * `Progress`/`StepPills` e delega toda a UI de cada passo para os
 * sub-componentes em `./sped-ecf-wizard/`. Estado e handlers ficam no hook
 * `useSpedEcfWizardState`.
 */
export function SpedEcfWizard({ open, onOpenChange, empresaId, anoCalendario }: WizardProps) {
  const state = useSpedEcfWizardState({ open, empresaId, anoCalendario });
  const {
    step,
    setStep,
    resultado,
    recibo,
    setRecibo,
    hashCopied,
    validacoesOpen,
    setValidacoesOpen,
    validar,
    gerar,
    transmitir,
    preValidacao,
    auditoriaCFC,
    handleGerar,
    copyHash,
    baixarZip,
    handleRegistrar,
  } = state;

  const data = validar.data;
  const erros = data?.validacoes.erros.length || 0;
  const avisos = data?.validacoes.avisos.length || 0;
  const cfcCriticos = auditoriaCFC.problemasCriticos || 0;
  const podeGerar = !!data && erros === 0 && preValidacao.podeGerar && cfcCriticos === 0;

  const motivosBloqueio: string[] = [];
  if (data) {
    if (erros > 0) motivosBloqueio.push(`${erros} erro(s) de validação`);
    if (!data.ecd_referencia) motivosBloqueio.push('ECD do período não localizada');
    if (!preValidacao.podeGerar) motivosBloqueio.push('Pré-validação SPED com pendências críticas');
    if (cfcCriticos > 0) motivosBloqueio.push(`${cfcCriticos} pendência(s) CFC crítica(s)`);
  }
  const motivoBloqueio = motivosBloqueio.join(' · ');

  const progresso = step === 1 ? 33 : step === 2 ? 66 : 100;
  const progressVariant: 'success' | 'warning' | 'danger' | 'default' =
    step === 3 ? 'success' : step === 2 && erros > 0 ? 'danger' : step === 2 && avisos > 0 ? 'warning' : 'default';

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
            <Step1PeriodoEcd data={data} onNext={() => setStep(2)} />
          )}

          {!validar.isPending && data && step === 2 && (
            <Step2Validacoes
              data={data}
              empresaId={empresaId}
              anoCalendario={anoCalendario}
              preValidacao={preValidacao}
              auditoriaCFC={auditoriaCFC}
              validar={validar}
              gerarPending={gerar.isPending}
              podeGerar={podeGerar}
              motivoBloqueio={motivoBloqueio}
              onBack={() => setStep(1)}
              onGerar={handleGerar}
            />
          )}

          {step === 3 && resultado && (
            <Step3Download
              resultado={resultado}
              data={data}
              anoCalendario={anoCalendario}
              recibo={recibo}
              setRecibo={setRecibo}
              hashCopied={hashCopied}
              copyHash={copyHash}
              baixarZip={baixarZip}
              handleRegistrar={handleRegistrar}
              transmitir={transmitir}
              validacoesOpen={validacoesOpen}
              setValidacoesOpen={setValidacoesOpen}
              setStep={setStep}
              onClose={() => onOpenChange(false)}
              currentStep={step}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
