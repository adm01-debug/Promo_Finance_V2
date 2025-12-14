import * as React from 'react';
import { Button, ButtonProps } from './button';
import { Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActionState = 'idle' | 'loading' | 'success' | 'error';

interface ActionButtonProps extends ButtonProps {
  state?: ActionState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  onSuccess?: () => void;
  resetDelay?: number;
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ 
    children, 
    state = 'idle', 
    loadingText,
    successText,
    errorText,
    className,
    disabled,
    ...props 
  }, ref) => {
    const isLoading = state === 'loading';
    const isSuccess = state === 'success';
    const isError = state === 'error';
    
    return (
      <Button
        ref={ref}
        className={cn(
          "relative transition-all duration-300",
          isSuccess && "bg-success hover:bg-success/90 text-success-foreground",
          isError && "bg-destructive hover:bg-destructive/90",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className={cn(
          "flex items-center gap-2 transition-opacity duration-200",
          isLoading && "opacity-0"
        )}>
          {isSuccess ? (
            <>
              <Check className="h-4 w-4 animate-scale-in" />
              {successText || children}
            </>
          ) : isError ? (
            <>
              <X className="h-4 w-4 animate-scale-in" />
              {errorText || children}
            </>
          ) : (
            children
          )}
        </span>
        
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText && <span className="text-sm">{loadingText}</span>}
          </span>
        )}
      </Button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

// Hook for managing action state with auto-reset
export function useActionState(resetDelay = 2000) {
  const [state, setState] = React.useState<ActionState>('idle');
  
  const setLoading = () => setState('loading');
  const setSuccess = () => {
    setState('success');
    setTimeout(() => setState('idle'), resetDelay);
  };
  const setError = () => {
    setState('error');
    setTimeout(() => setState('idle'), resetDelay);
  };
  const reset = () => setState('idle');
  
  return { state, setLoading, setSuccess, setError, reset };
}
