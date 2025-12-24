import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Bem-vindo ao Dashboard!',
    content: 'Aqui você tem uma visão geral de todas as suas finanças em tempo real.',
    position: 'bottom',
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Menu de Navegação',
    content: 'Use o menu lateral para acessar todas as funcionalidades do sistema.',
    position: 'right',
  },
  {
    target: '[data-tour="search"]',
    title: 'Busca Rápida',
    content: 'Pesquise transações, clientes e fornecedores rapidamente. Use Ctrl+K como atalho!',
    position: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notificações',
    content: 'Fique atento aos alertas de vencimentos e outras notificações importantes.',
    position: 'bottom',
  },
  {
    target: '[data-tour="theme"]',
    title: 'Tema do Sistema',
    content: 'Alterne entre modo claro, escuro ou automático conforme sua preferência.',
    position: 'bottom',
  },
  {
    target: '[data-tour="expert"]',
    title: 'Expert (IA)',
    content: 'Use nosso assistente inteligente para análises e sugestões financeiras!',
    position: 'right',
  },
  {
    target: '[data-tour="contas-receber"]',
    title: 'Contas a Receber',
    content: 'Gerencie todas as suas receitas e acompanhe os recebimentos pendentes.',
    position: 'right',
  },
  {
    target: '[data-tour="contas-pagar"]',
    title: 'Contas a Pagar',
    content: 'Controle suas despesas e nunca perca um vencimento.',
    position: 'right',
  },
  {
    target: '[data-tour="fluxo-caixa"]',
    title: 'Fluxo de Caixa',
    content: 'Visualize projeções e cenários futuros para tomar melhores decisões.',
    position: 'right',
  },
  {
    target: '[data-tour="relatorios"]',
    title: 'Relatórios',
    content: 'Gere relatórios detalhados e agende envios automáticos por email.',
    position: 'right',
  },
  {
    target: '[data-tour="keyboard"]',
    title: 'Atalhos de Teclado',
    content: 'Pressione Alt+? para ver todos os atalhos disponíveis e navegar mais rápido!',
    position: 'bottom',
  },
];

const TOUR_COMPLETED_KEY = 'promo-financeiro-tour-completed';
const TOUR_DISMISSED_KEY = 'promo-financeiro-tour-dismissed';

export const GuidedTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Check if should show tour
  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    const tourDismissed = localStorage.getItem(TOUR_DISMISSED_KEY);
    
    if (!tourCompleted && !tourDismissed) {
      // Show welcome after a short delay
      const timer = setTimeout(() => setShowWelcome(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update target element position
  const updateTargetPosition = useCallback(() => {
    if (!isActive) return;
    
    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    }
  }, [isActive, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);
    
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  const startTour = () => {
    setShowWelcome(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  const skipTour = () => {
    setShowWelcome(false);
    localStorage.setItem(TOUR_DISMISSED_KEY, 'true');
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  };

  const exitTour = () => {
    setIsActive(false);
    localStorage.setItem(TOUR_DISMISSED_KEY, 'true');
  };

  const getTooltipPosition = () => {
    if (!targetRect) return {};
    
    const step = tourSteps[currentStep];
    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180;

    switch (step.position) {
      case 'top':
        return {
          top: targetRect.top - tooltipHeight - padding,
          left: Math.max(padding, Math.min(
            targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(
            targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case 'left':
        return {
          top: targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2),
          left: targetRect.left - tooltipWidth - padding,
        };
      case 'right':
      default:
        return {
          top: targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2),
          left: targetRect.right + padding,
        };
    }
  };

  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Welcome Dialog */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-xl"
            >
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto shadow-glow-primary">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                
                <h2 className="text-2xl font-display font-bold">
                  Bem-vindo ao Promo Financeiro!
                </h2>
                
                <p className="text-muted-foreground">
                  Parece que é sua primeira vez aqui. Gostaria de fazer um tour rápido 
                  para conhecer as principais funcionalidades?
                </p>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={skipTour}
                  >
                    Pular
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={startTour}
                  >
                    <Sparkles className="h-4 w-4" />
                    Iniciar Tour
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tour Overlay */}
      <AnimatePresence>
        {isActive && targetRect && (
          <>
            {/* Backdrop with spotlight */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              style={{
                background: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px, rgba(0,0,0,0.7) ${Math.max(targetRect.width, targetRect.height) / 2 + 40}px)`,
              }}
              onClick={exitTour}
            />

            {/* Target highlight */}
            <motion.div
              className="fixed z-[91] border-2 border-primary rounded-lg pointer-events-none"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
              }}
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(var(--primary), 0.4)',
                  '0 0 0 10px rgba(var(--primary), 0)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[92] w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
              style={getTooltipPosition()}
            >
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Passo {currentStep + 1} de {tourSteps.length}
                    </span>
                    <h3 className="font-semibold text-lg mt-0.5">
                      {tourSteps[currentStep].title}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 -mt-2"
                    onClick={exitTour}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <p className="text-sm text-muted-foreground mb-5">
                  {tourSteps[currentStep].content}
                </p>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  <div className="flex gap-1">
                    {tourSteps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={cn(
                          'h-2 w-2 rounded-full transition-colors',
                          idx === currentStep
                            ? 'bg-primary'
                            : idx < currentStep
                            ? 'bg-primary/50'
                            : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="gap-1"
                  >
                    {currentStep === tourSteps.length - 1 ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Concluir
                      </>
                    ) : (
                      <>
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Button to restart tour manually
export const RestartTourButton = () => {
  const restartTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.removeItem(TOUR_DISMISSED_KEY);
    window.location.reload();
  };

  return (
    <Button variant="outline" size="sm" onClick={restartTour} className="gap-2">
      <Sparkles className="h-4 w-4" />
      Reiniciar Tour
    </Button>
  );
};
