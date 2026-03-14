import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  route?: string; // Optional route where this step should show
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Menu Organizado',
    content: 'O menu foi reorganizado em grupos lógicos: Início, Inteligência, Financeiro, Documentos, Cadastros, Compliance e Sistema. Clique nas categorias para expandir.',
    position: 'right',
  },
  {
    target: '[data-tour="search"]',
    title: 'Busca Global',
    content: 'Pesquise qualquer coisa rapidamente. Use Ctrl+K (ou Cmd+K no Mac) como atalho!',
    position: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Alertas Inteligentes',
    content: 'Receba notificações de vencimentos, aprovações pendentes e insights financeiros importantes.',
    position: 'bottom',
  },
  {
    target: '[data-tour="theme"]',
    title: 'Personalize sua Experiência',
    content: 'Escolha entre modo claro, escuro ou automático conforme sua preferência.',
    position: 'bottom',
  },
];

const TOUR_COMPLETED_KEY = 'promo-financeiro-tour-v2-completed';
const TOUR_DISMISSED_KEY = 'promo-financeiro-tour-v2-dismissed';

export const GuidedTour = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const location = useLocation();

  // Only show on home page
  const isHomePage = location.pathname === '/';

  // Check if should show tour
  useEffect(() => {
    if (!isHomePage) return;
    
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    const tourDismissed = localStorage.getItem(TOUR_DISMISSED_KEY);
    
    if (!tourCompleted && !tourDismissed) {
      // Show welcome after a short delay
      const timer = setTimeout(() => setShowWelcome(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isHomePage]);

  // Update target element position
  const updateTargetPosition = useCallback(() => {
    if (!isActive) return;
    
    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // Element not found, skip to next step
      if (currentStep < tourSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  }, [isActive, currentStep]);

  useEffect(() => {
    if (isActive) {
      // Small delay to let DOM render
      const timer = setTimeout(updateTargetPosition, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, updateTargetPosition]);

  useEffect(() => {
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
    if (!targetRect) return { top: '50%', left: '50%' };
    
    const step = tourSteps[currentStep];
    const padding = 16;
    const tooltipWidth = 340;
    const tooltipHeight = 200;

    switch (step.position) {
      case 'top':
        return {
          top: Math.max(padding, targetRect.top - tooltipHeight - padding),
          left: Math.max(padding, Math.min(
            targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case 'bottom':
        return {
          top: Math.min(targetRect.bottom + padding, window.innerHeight - tooltipHeight - padding),
          left: Math.max(padding, Math.min(
            targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2),
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case 'left':
        return {
          top: Math.max(padding, Math.min(
            targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2),
            window.innerHeight - tooltipHeight - padding
          )),
          left: Math.max(padding, targetRect.left - tooltipWidth - padding),
        };
      case 'right':
      default:
        return {
          top: Math.max(padding, Math.min(
            targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2),
            window.innerHeight - tooltipHeight - padding
          )),
          left: Math.min(targetRect.right + padding, window.innerWidth - tooltipWidth - padding),
        };
    }
  };

  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (!isHomePage) return null;

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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-xl"
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-glow-primary"
                >
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </motion.div>
                
                <h2 className="text-2xl font-display font-bold">
                  Bem-vindo ao Promo Finance!
                </h2>
                
                <p className="text-muted-foreground">
                  O sistema foi totalmente reorganizado para facilitar sua navegação.
                  Quer conhecer as principais novidades?
                </p>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={skipTour}
                  >
                    <SkipForward className="h-4 w-4" />
                    Pular
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={startTour}
                  >
                    <Sparkles className="h-4 w-4" />
                    Fazer Tour
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
                background: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 30}px, rgba(0,0,0,0.75) ${Math.max(targetRect.width, targetRect.height) / 2 + 60}px)`,
              }}
              onClick={exitTour}
            />

            {/* Target highlight */}
            <motion.div
              className="fixed z-[91] rounded-xl pointer-events-none"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                border: '2px solid hsl(var(--primary))',
                boxShadow: '0 0 0 4px hsl(var(--primary) / 0.3)',
              }}
              animate={{
                boxShadow: [
                  '0 0 0 4px hsl(var(--primary) / 0.3)',
                  '0 0 0 8px hsl(var(--primary) / 0.1)',
                  '0 0 0 4px hsl(var(--primary) / 0.3)',
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
              className="fixed z-[92] w-[340px] bg-card border border-border rounded-xl shadow-xl overflow-hidden"
              style={getTooltipPosition()}
            >
              {/* Progress bar */}
              <div className="h-1.5 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-medium text-primary">
                      Passo {currentStep + 1} de {tourSteps.length}
                    </span>
                    <h3 className="font-display font-bold text-lg mt-1">
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
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
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

                  <div className="flex gap-1.5">
                    {tourSteps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={cn(
                          'h-2 w-2 rounded-full transition-all duration-200',
                          idx === currentStep
                            ? 'bg-primary w-4'
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
