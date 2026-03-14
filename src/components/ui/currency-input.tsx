import { useState, useEffect, forwardRef, useCallback } from 'react';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, parseCurrency } from '@/lib/currency';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
  currency?: 'BRL' | 'USD' | 'EUR';
  showIcon?: boolean;
  allowNegative?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

const sizeClasses = {
  sm: { input: 'h-8 text-sm', padding: 'pl-8 pr-3', paddingNoIcon: 'px-3', icon: 'w-4 h-4 left-2' },
  md: { input: 'h-10 text-sm', padding: 'pl-10 pr-4', paddingNoIcon: 'px-4', icon: 'w-5 h-5 left-3' },
  lg: { input: 'h-12 text-base', padding: 'pl-12 pr-4', paddingNoIcon: 'px-4', icon: 'w-6 h-6 left-4' },
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      currency = 'BRL',
      showIcon = true,
      allowNegative = false,
      size = 'md',
      error = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused && value !== undefined) {
        setDisplayValue(formatCurrency(value, currency));
      }
    }, [value, currency, isFocused]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;
        inputValue = inputValue.replace(/[^\d,.-]/g, '');
        if (!allowNegative) {
          inputValue = inputValue.replace(/-/g, '');
        }
        const normalizedValue = inputValue.replace(',', '.');
        const numericValue = parseFloat(normalizedValue);
        setDisplayValue(inputValue);
        if (!isNaN(numericValue)) {
          onChange?.(numericValue);
        } else if (inputValue === '' || inputValue === '-') {
          onChange?.(0);
        }
      },
      [allowNegative, onChange]
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      if (value !== undefined && value !== 0) {
        setDisplayValue(value.toFixed(2).replace('.', ','));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      if (value !== undefined) {
        setDisplayValue(formatCurrency(value, currency));
      }
    }, [value, currency]);

    const classes = sizeClasses[size];

    return (
      <div className="relative">
        {showIcon && (
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none',
              classes.icon
            )}
          >
            <DollarSign className="w-full h-full" />
          </div>
        )}
        
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border',
            'bg-background text-foreground',
            'placeholder-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
            'transition-colors',
            'text-right font-mono',
            error
              ? 'border-destructive'
              : 'border-input',
            disabled && 'opacity-50 cursor-not-allowed bg-muted',
            classes.input,
            showIcon ? classes.padding : classes.paddingNoIcon,
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export const SimpleCurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (props, ref) => {
    return <CurrencyInput ref={ref} showIcon={false} {...props} />;
  }
);

SimpleCurrencyInput.displayName = 'SimpleCurrencyInput';

interface LabeledCurrencyInputProps extends CurrencyInputProps {
  label: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
}

export function LabeledCurrencyInput({
  label,
  helperText,
  errorMessage,
  required,
  error,
  className,
  ...props
}: LabeledCurrencyInputProps) {
  const hasError = error || !!errorMessage;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      <CurrencyInput error={hasError} {...props} />
      
      {errorMessage && (
        <p className="mt-1 text-sm text-destructive">{errorMessage}</p>
      )}
      
      {helperText && !errorMessage && (
        <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export default CurrencyInput;