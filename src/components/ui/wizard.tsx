import {
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  useMemo,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Types
interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  optional?: boolean;
  validate?: () => boolean | Promise<boolean>;
}

interface WizardContextValue {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: Set<number>;
  data: Record<string, unknown>;
  goToStep: (step: number) => void;
  nextStep: () => Promise<void>;
  prevStep: () => void;
  setData: (key: string, value: unknown) => void;
  setStepData: (data: Record<string, unknown>) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isStepComplete: (step: number) => boolean;
  canNavigateTo: (step: number) => boolean;
}

interface WizardProps {
  steps: WizardStep[];
  children: ReactNode;
  onComplete?: (data: Record<string, unknown>) => void | Promise<void>;
  onStepChange?: (step: number, data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
  allowSkip?: boolean;
  linear?: boolean;
  className?: string;
}

interface WizardStepContentProps {
  stepId: string;
  children: ReactNode;
}

interface WizardNavigationProps {
  className?: string;
  nextLabel?: string;
  prevLabel?: string;
  completeLabel?: string;
  showStepIndicator?: boolean;
}

// Context
const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within Wizard');
  }
  return context;
}

// Wizard Component
export function Wizard({
  steps,
  children,
  onComplete,
  onStepChange,
  initialData = {},
  allowSkip = false,
  linear = true,
  className,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [data, setDataState] = useState<Record<string, unknown>>(initialData);
  const [isValidating, setIsValidating] = useState(false);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const isStepComplete = useCallback((step: number) => {
    return completedSteps.has(step);
  }, [completedSteps]);

  const canNavigateTo = useCallback((step: number) => {
    if (!linear) return true;
    if (step <= currentStep) return true;
    // Can only navigate forward if all previous steps are complete
    for (let i = 0; i < step; i++) {
      if (!completedSteps.has(i) && !steps[i].optional) {
        return false;
      }
    }
    return true;
  }, [linear, currentStep, completedSteps, steps]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length && canNavigateTo(step)) {
      setCurrentStep(step);
      onStepChange?.(step, data);
    }
  }, [steps.length, canNavigateTo, onStepChange, data]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const step = steps[currentStep];
    if (!step.validate) return true;

    setIsValidating(true);
    try {
      const result = await step.validate();
      return result;
    } catch {
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid && !allowSkip) return;

    // Mark current step as complete
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (isLastStep) {
      await onComplete?.(data);
    } else {
      setCurrentStep(prev => prev + 1);
      onStepChange?.(currentStep + 1, data);
    }
  }, [currentStep, isLastStep, allowSkip, onComplete, onStepChange, data]);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
      onStepChange?.(currentStep - 1, data);
    }
  }, [isFirstStep, currentStep, onStepChange, data]);

  const setData = useCallback((key: string, value: unknown) => {
    setDataState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setStepData = useCallback((newData: Record<string, unknown>) => {
    setDataState(prev => ({ ...prev, ...newData }));
  }, []);

  const contextValue: WizardContextValue = {
    steps,
    currentStep,
    completedSteps,
    data,
    goToStep,
    nextStep,
    prevStep,
    setData,
    setStepData,
    isFirstStep,
    isLastStep,
    isStepComplete,
    canNavigateTo,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={cn('flex flex-col', className)}>
        {children}
      </div>
    </WizardContext.Provider>
  );
}

// Step Header/Indicator
export function WizardHeader({ className }: { className?: string }) {
  const { steps, currentStep, isStepComplete, goToStep, canNavigateTo } = useWizard();

  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = isStepComplete(index);
          const isClickable = canNavigateTo(index);

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step indicator */}
              <button
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                  isActive && 'border-primary bg-primary text-primary-foreground',
                  isComplete && !isActive && 'border-success bg-success text-success-foreground',
                  !isActive && !isComplete && 'border-border text-muted-foreground',
                  isClickable && !isActive && 'cursor-pointer hover:border-primary/70',
                  !isClickable && 'cursor-not-allowed'
                )}
              >
                {isComplete && !isActive ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>

              {/* Step info */}
              <div className="ml-3 hidden sm:block">
                <p className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-primary' : 'text-foreground'
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 bg-border">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isComplete ? 'bg-success' : 'bg-transparent'
                    )}
                    style={{ width: isComplete ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Vertical Step Header
export function WizardVerticalHeader({ className }: { className?: string }) {
  const { steps, currentStep, isStepComplete, goToStep, canNavigateTo } = useWizard();

  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = isStepComplete(index);
        const isClickable = canNavigateTo(index);

        return (
          <button
            key={step.id}
            onClick={() => isClickable && goToStep(index)}
            disabled={!isClickable}
            className={cn(
              'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all',
              isActive && 'bg-primary/10',
              !isActive && isClickable && 'hover:bg-muted',
              !isClickable && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0',
              isActive && 'border-primary bg-primary text-primary-foreground',
              isComplete && !isActive && 'border-success bg-success text-success-foreground',
              !isActive && !isComplete && 'border-border text-muted-foreground'
            )}>
              {isComplete && !isActive ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            <div>
              <p className={cn(
                'text-sm font-medium',
                isActive ? 'text-primary' : 'text-foreground'
              )}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Step Content
export function WizardStepContent({ stepId, children }: WizardStepContentProps) {
  const { steps, currentStep } = useWizard();
  const isActive = steps[currentStep]?.id === stepId;

  if (!isActive) return null;

  return <div className="animate-in fade-in-0 duration-200">{children}</div>;
}

// Navigation
export function WizardNavigation({
  className,
  nextLabel = 'Próximo',
  prevLabel = 'Voltar',
  completeLabel = 'Concluir',
  showStepIndicator = true,
}: WizardNavigationProps) {
  const {
    steps,
    currentStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
  } = useWizard();

  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await nextStep();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex items-center justify-between mt-8 pt-6 border-t border-border', className)}>
      <Button
        variant="outline"
        onClick={prevStep}
        disabled={isFirstStep || isLoading}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        {prevLabel}
      </Button>

      {showStepIndicator && (
        <span className="text-sm text-muted-foreground">
          Passo {currentStep + 1} de {steps.length}
        </span>
      )}

      <Button onClick={handleNext} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : isLastStep ? (
          <>
            {completeLabel}
            <Check className="w-4 h-4 ml-1" />
          </>
        ) : (
          <>
            {nextLabel}
            <ChevronRight className="w-4 h-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  );
}

// Simple Progress Bar
export function WizardProgress({ className }: { className?: string }) {
  const { steps, currentStep } = useWizard();
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Passo {currentStep + 1} de {steps.length}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export type { WizardStep };
export default Wizard;
