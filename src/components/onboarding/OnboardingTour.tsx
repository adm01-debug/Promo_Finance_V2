import { useEffect, useMemo, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useNavigate } from 'react-router-dom';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

const STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bem-vindo ao Promo Finance!',
    content: 'Vamos fazer um tour rápido de 8 passos pelos principais módulos. Você pode pular a qualquer momento.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard"]',
    title: 'Dashboard',
    content: 'Visão consolidada dos seus indicadores financeiros e tributários em tempo real.',
  },
  {
    target: '[data-tour="contas-pagar"]',
    title: 'Contas a Pagar',
    content: 'Gerencie pagamentos, fornecedores, parcelas e fluxos de aprovação.',
  },
  {
    target: '[data-tour="contas-receber"]',
    title: 'Contas a Receber',
    content: 'Acompanhe recebíveis, régua de cobrança automática e conciliação.',
  },
  {
    target: '[data-tour="tributario"]',
    title: 'Tributário',
    content: 'Apurações, créditos, Reforma Tributária (CBS/IBS/IS) e Copilot especialista.',
  },
  {
    target: '[data-tour="aprovacoes"]',
    title: 'Aprovações',
    content: 'Workflows configuráveis com limites por valor e auditoria completa.',
  },
  {
    target: '[data-tour="lgpd"]',
    title: 'Privacidade & LGPD',
    content: 'Centro de privacidade: solicite seus dados, retificação ou exclusão.',
  },
  {
    target: 'body',
    placement: 'center',
    title: 'Pronto para começar!',
    content: 'O Copilot Global (canto inferior direito) está sempre disponível para tirar dúvidas. Bom trabalho!',
  },
];

export function OnboardingTour() {
  const navigate = useNavigate();
  const { progress, loading, iniciarTour, completarEtapa, finalizar } = useOnboardingProgress();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Auto-inicia para usuários novos (sem registro OU sem finalização)
    if (!progress) {
      iniciarTour();
      setRun(true);
    } else if (!progress.finalizado_em && !progress.pulado) {
      setRun(true);
    }
  }, [loading, progress, iniciarTour]);

  const styles = useMemo(
    () => ({
      options: {
        primaryColor: 'hsl(var(--primary))',
        zIndex: 10000,
        arrowColor: 'hsl(var(--background))',
        backgroundColor: 'hsl(var(--background))',
        textColor: 'hsl(var(--foreground))',
        overlayColor: 'rgba(0,0,0,0.5)',
      },
    }),
    [],
  );

  const handleCallback = (data: CallBackProps) => {
    const { status, index, type } = data;
    if (type === 'step:after') {
      completarEtapa(`step_${index}`);
    }
    if (status === STATUS.FINISHED) {
      finalizar(false);
      setRun(false);
    } else if (status === STATUS.SKIPPED) {
      finalizar(true);
      setRun(false);
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      hideCloseButton
      scrollToFirstStep
      disableScrolling={false}
      styles={styles}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
      callback={handleCallback}
    />
  );
}
