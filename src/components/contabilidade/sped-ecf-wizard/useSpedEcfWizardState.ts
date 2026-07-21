import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  useGerarSpedContabil,
  useRegistrarTransmissaoSped,
  useSpedEcfValidacao,
} from '@/hooks/useSpedContabil';
import { usePreValidacaoSped } from '@/hooks/usePreValidacaoSped';
import { useAuditoriaCFC } from '@/hooks/useAuditoriaCFC';
import { baixarSpedZip } from '@/lib/sped-zip';
import { WIZARD_DRAFT_KEY, type Step, type WizardResultado } from './types';

/**
 * Encapsula todo o estado local do wizard SPED ECF: passo atual, resultado da
 * geração, recibo, feedback visual do clipboard e persistência de rascunho em
 * localStorage. Também expõe os handlers de negócio (gerar, copiar hash, baixar
 * ZIP e registrar transmissão) para consumo do orquestrador e dos steps.
 */
export function useSpedEcfWizardState(params: {
  open: boolean;
  empresaId: string;
  anoCalendario: number;
}) {
  const { open, empresaId, anoCalendario } = params;

  const [step, setStep] = useState<Step>(1);
  const [resultado, setResultado] = useState<WizardResultado | null>(null);
  const [recibo, setRecibo] = useState('');
  const [hashCopied, setHashCopied] = useState(false);
  const [validacoesOpen, setValidacoesOpen] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validar = useSpedEcfValidacao();
  const gerar = useGerarSpedContabil();
  const transmitir = useRegistrarTransmissaoSped();
  const preValidacao = usePreValidacaoSped(empresaId, anoCalendario);
  const auditoriaCFC = useAuditoriaCFC(empresaId);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

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
        } catch {
          /* noop */
        }
      }
      setStep(restoredStep);
      setResultado(null);
      setRecibo(restoredRecibo);
      validar.mutate({ empresaId, anoCalendario });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaId, anoCalendario]);

  // Persiste rascunho enquanto o wizard está aberto (step 3 é resultado pós-geração)
  useEffect(() => {
    if (!open || !empresaId || !anoCalendario || typeof window === 'undefined') return;
    if (step === 3) return;
    try {
      window.localStorage.setItem(
        WIZARD_DRAFT_KEY(empresaId, anoCalendario),
        JSON.stringify({ step, recibo, ts: Date.now() }),
      );
    } catch {
      /* noop */
    }
  }, [open, empresaId, anoCalendario, step, recibo]);

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
    await transmitir.mutateAsync({
      arquivoId: resultado.arquivo_id,
      recibo: recibo.trim(),
      tipo: 'ECF',
    });
    setRecibo('');
  };

  return {
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
  };
}

export type SpedEcfWizardState = ReturnType<typeof useSpedEcfWizardState>;
