import { useEffect, useMemo, useState } from 'react';
import { Joyride, STATUS, Step, type EventData } from 'react-joyride';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

const STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bem-vindo ao Promo Finance!',
    content:
      'Vamos fazer um tour rápido de 8 passos pelos principais módulos. Você pode pular a qualquer momento.',
    skipBeacon: true,
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
    content:
      'O Copilot Global (canto inferior direito) está sempre disponível para tirar dúvidas. Bom trabalho!',
  },
];

export function OnboardingTour() {
  const { progress, loading, iniciarTour, completarEtapa, finalizar } = useOnboardingProgress();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Auto-inicia para usuários novos (sem registro OU sem finalização)
    if (!progress) {
      iniciarTour();
      setRun(true);
    } else if (!progress.is_completed) {
      setRun(true);
    }
  }, [loading, progress, iniciarTour]);

  const styles = useMemo(
    () => ({
      buttonPrimary: { backgroundColor: 'hsl(var(--primary))' },
      buttonBack: { color: 'hsl(var(--foreground))' },
      buttonSkip: { color: 'hsl(var(--foreground))' },
      buttonClose: { color: 'hsl(var(--foreground))' },
      tooltip: {
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        borderRadius: 8,
        zIndex: 10000,
      },
      tooltipContent: { color: 'hsl(var(--foreground))' },
      tooltipTitle: { color: 'hsl(var(--foreground))' },
      arrow: { color: 'hsl(var(--background))' },
      overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
    }),
    []
  );

  const handleCallback = (data: EventData) => {
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
      scrollToFirstStep
      styles={styles}
      options={{
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
        skipScroll: false,
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
      onEvent={handleCallback}
    />
  );
}
