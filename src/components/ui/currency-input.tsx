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
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

const sizeClasses = {
  sm: {
    input: 'h-8 text-sm',
    padding: 'pl-8 pr-3',
    paddingNoIcon: 'px-3',
    icon: 'w-4 h-4 left-2',
  },
  md: {
    input: 'h-10 text-sm',
    padding: 'pl-10 pr-4',
    paddingNoIcon: 'px-4',
    icon: 'w-5 h-5 left-3',
  },
  lg: {
    input: 'h-12 text-base',
    padding: 'pl-12 pr-4',
    paddingNoIcon: 'px-4',
    icon: 'w-6 h-6 left-4',
  },
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

    // Format value when not focused
    useEffect(() => {
      if (!isFocused && value !== undefined) {
        setDisplayValue(formatCurrency(value, currency));
      }
    }, [value, currency, isFocused]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;
        
        // Remove non-numeric characters except decimal separator and minus
        inputValue = inputValue.replace(/[^\d,.-]/g, '');
        
        // Handle negative
        if (!allowNegative) {
          inputValue = inputValue.replace(/-/g, '');
        }
        
        // Replace comma with dot for parsing
        const normalizedValue = inputValue.replace(',', '.');
        
        // Parse the value
        const numericValue = parseFloat(normalizedValue);
        
        // Update display
        setDisplayValue(inputValue);
        
        // Call onChange with numeric value
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
      // Show raw number when focused
      if (value !== undefined && value !== 0) {
        setDisplayValue(value.toFixed(2).replace('.', ','));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      // Format when losing focus
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
              'absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none',
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
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors',
            'text-right font-mono',
            error
              ? 'border-red-500 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800',
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

// Simplified version without icon
export const SimpleCurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (props, ref) => {
    return <CurrencyInput ref={ref} showIcon={false} {...props} />;
  }
);

SimpleCurrencyInput.displayName = 'SimpleCurrencyInput';

// Version with label
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <CurrencyInput error={hasError} {...props} />
      
      {errorMessage && (
        <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
      )}
      
      {helperText && !errorMessage && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

export default CurrencyInput;
