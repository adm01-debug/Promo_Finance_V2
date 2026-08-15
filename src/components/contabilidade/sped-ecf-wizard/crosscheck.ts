import { toast } from 'sonner';
import type { EcdReferencia, SpedEcfValidacaoResult } from '@/hooks/useSpedContabil';
import type { DivergRow, DivergTone, Step, WizardResultado } from './types';

export const DIVERG_TONE_CLASSES: Record<DivergTone, string> = {
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
  info: 'bg-muted/40 text-muted-foreground border-border/60',
};

export function buildDivergRows(
  resultado: WizardResultado,
  data: SpedEcfValidacaoResult | undefined,
  ecdRef: EcdReferencia | null,
): DivergRow[] {
  const periodoEcfStr = `${resultado.periodo.inicio} → ${resultado.periodo.fim}`;
  const periodoEcdStr = data ? `${data.periodo.inicio} → ${data.periodo.fim}` : '—';
  const periodoMatch = !!data && periodoEcfStr === periodoEcdStr;
  const cnpjMatch = !!data && resultado.empresa.cnpj === data.empresa.cnpj;
  const ecdTransmitida = ecdRef?.status === 'transmitido';

  return [
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
}

export function createGoToAnchor(setStep: (s: Step) => void, currentStep: Step) {
  return (targetStep: Step, targetId: string, label: string) => {
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
}
