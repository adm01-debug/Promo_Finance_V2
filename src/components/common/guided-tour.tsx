import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { X, ChevronLeft, ChevronRight, Circle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Types
interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string | ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;
  action?: ReactNode;
  disableInteraction?: boolean;
  waitFor?: () => boolean | Promise<boolean>;
}

interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
  showProgress?: boolean;
  showSkip?: boolean;
  onComplete?: () => void;
}

interface TourContextValue {
  activeTour: Tour | null;
  currentStep: number;
  isActive: boolean;
  startTour: (tour: Tour) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completedTours: string[];
}

const TourContext = createContext<TourContextValue | null>(null);

// Tour Provider
interface TourProviderProps {
  children: ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTours, setCompletedTours] = useLocalStorage<string[]>(
    'completed_tours',
    []
  );

  const isActive = activeTour !== null;

  const startTour = useCallback((tour: Tour) => {
    setActiveTour(tour);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    if (activeTour) {
      setCompletedTours((prev) => {
        if (!prev.includes(activeTour.id)) {
          return [...prev, activeTour.id];
        }
        return prev;
      });
      activeTour.onComplete?.();
    }
    setActiveTour(null);
    setCurrentStep(0);
  }, [activeTour, setCompletedTours]);

  const nextStep = useCallback(() => {
    if (!activeTour) return;

    if (currentStep < activeTour.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [activeTour, currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (activeTour && step >= 0 && step < activeTour.steps.length) {
        setCurrentStep(step);
      }
    },
    [activeTour]
  );

  return (
    <TourContext.Provider
      value={{
        activeTour,
        currentStep,
        isActive,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        completedTours,
      }}
    >
      {children}
      {isActive && <TourOverlay />}
    </TourContext.Provider>
  );
}

// Hook to use tour
export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

// Tour Overlay Component
function TourOverlay() {
  const { activeTour, currentStep, nextStep, prevStep, endTour } = useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const step = activeTour?.steps[currentStep];
  const totalSteps = activeTour?.steps.length || 0;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Find target element
  useEffect(() => {
    if (!step) return;

    const findTarget = () => {
      if (step.target === 'center') {
        setTargetRect(null);
        setTooltipPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
        });
        return;
      }

      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        calculateTooltipPosition(rect, step.placement);
      }
    };

    findTarget();

    // Recalculate on resize/scroll
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget, true);

    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget, true);
    };
  }, [step]);

  // Calculate tooltip position
  const calculateTooltipPosition = (
    rect: DOMRect,
    placement: TourStep['placement'] = 'bottom'
  ) => {
    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
      default:
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Keep tooltip in viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setTooltipPosition({ top, left });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [endTour, nextStep, prevStep]);

  if (!step) return null;

  const spotlightPadding = step.spotlightPadding ?? 8;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop with spotlight */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - spotlightPadding}
                y={targetRect.top - spotlightPadding}
                width={targetRect.width + spotlightPadding * 2}
                height={targetRect.height + spotlightPadding * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary-500 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - spotlightPadding,
            left: targetRect.left - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Close button */}
        <button
          onClick={endTour}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {step.content}
          </div>
          {step.action && <div className="mt-4">{step.action}</div>}
        </div>

        {/* Progress */}
        {activeTour?.showProgress !== false && (
          <div className="flex items-center gap-1 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  const { goToStep } = useTour();
                  goToStep(index);
                }}
                className="p-0.5"
              >
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                ) : index === currentStep ? (
                  <Circle className="w-4 h-4 text-primary-600 fill-primary-600" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300" />
                )}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-500">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-2 mt-4">
          {activeTour?.showSkip !== false && (
            <button
              onClick={endTour}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Pular tour
            </button>
          )}
          <div className="flex-1" />
          {!isFirstStep && (
            <button
              onClick={prevStep}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          )}
          <button
            onClick={nextStep}
            className="flex items-center gap-1 px-4 py-1.5 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            {isLastStep ? (
              'Concluir'
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Pre-built tours
export const welcomeTour: Tour = {
  id: 'welcome',
  name: 'Tour de Boas-vindas',
  steps: [
    {
      id: 'welcome-1',
      target: 'center',
      title: 'Bem-vindo ao Finance Hub! 👋',
      content:
        'Vamos fazer um tour rápido para você conhecer as principais funcionalidades do sistema.',
      placement: 'center',
    },
    {
      id: 'welcome-2',
      target: '[data-tour="sidebar"]',
      title: 'Menu de Navegação',
      content:
        'Use o menu lateral para navegar entre as diferentes seções do sistema: Dashboard, Contas, Fornecedores e Relatórios.',
      placement: 'right',
    },
    {
      id: 'welcome-3',
      target: '[data-tour="dashboard"]',
      title: 'Dashboard',
      content:
        'Aqui você tem uma visão geral das suas finanças: saldo, receitas, despesas e gráficos de evolução.',
      placement: 'bottom',
    },
    {
      id: 'welcome-4',
      target: '[data-tour="quick-actions"]',
      title: 'Ações Rápidas',
      content:
        'Use os botões de ação rápida para adicionar novas contas a pagar, receber ou cadastrar fornecedores.',
      placement: 'left',
    },
    {
      id: 'welcome-5',
      target: '[data-tour="notifications"]',
      title: 'Notificações',
      content:
        'Fique atento ao sino de notificações para alertas de contas próximas do vencimento.',
      placement: 'bottom',
    },
    {
      id: 'welcome-6',
      target: 'center',
      title: 'Pronto para começar! 🚀',
      content:
        'Agora você já conhece o básico. Explore o sistema e conte conosco para organizar suas finanças!',
      placement: 'center',
    },
  ],
  showProgress: true,
  showSkip: true,
};

export const createAccountTour: Tour = {
  id: 'create-account',
  name: 'Criar Conta a Pagar',
  steps: [
    {
      id: 'create-1',
      target: '[data-tour="new-account-button"]',
      title: 'Botão Nova Conta',
      content: 'Clique aqui para abrir o formulário de criação de uma nova conta.',
      placement: 'bottom',
    },
    {
      id: 'create-2',
      target: '[data-tour="account-form"]',
      title: 'Formulário',
      content:
        'Preencha os dados da conta: descrição, valor, data de vencimento e categoria.',
      placement: 'right',
    },
    {
      id: 'create-3',
      target: '[data-tour="save-button"]',
      title: 'Salvar',
      content: 'Clique em Salvar para registrar a conta no sistema.',
      placement: 'top',
    },
  ],
  showProgress: true,
  showSkip: true,
};

export type { Tour, TourStep };
export default TourProvider;
