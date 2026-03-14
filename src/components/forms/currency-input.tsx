import { forwardRef, useState, useCallback, ChangeEvent, FocusEvent } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  currency?: string;
  locale?: string;
  allowNegative?: boolean;
  maxValue?: number;
  minValue?: number;
  error?: boolean;
}

/**
 * Formata número para moeda brasileira
 */
function formatCurrency(value: number | null, currency: string, locale: string): string {
  if (value === null || isNaN(value)) return '';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Parse string de moeda para número
 */
function parseCurrencyString(value: string, allowNegative: boolean): number | null {
  if (!value) return null;

  // Remove tudo exceto dígitos, vírgula, ponto e sinal negativo
  let cleaned = value.replace(/[^\d,.-]/g, '');
  
  // Substitui vírgula por ponto (formato BR)
  cleaned = cleaned.replace(',', '.');
  
  // Remove pontos extras (separadores de milhar)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }

  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) return null;
  if (!allowNegative && parsed < 0) return Math.abs(parsed);
  
  return parsed;
}

/**
 * Input para valores monetários com formatação automática
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      currency = 'BRL',
      locale = 'pt-BR',
      allowNegative = false,
      maxValue,
      minValue,
      error,
      className,
      placeholder = 'R$ 0,00',
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState<string>(() => 
      value !== null && value !== undefined ? formatCurrency(value, currency, locale) : ''
    );
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setDisplayValue(inputValue);

        // Parse e validar
        const numericValue = parseCurrencyString(inputValue, allowNegative);
        
        if (numericValue !== null) {
          let finalValue = numericValue;
          
          if (maxValue !== undefined && finalValue > maxValue) {
            finalValue = maxValue;
          }
          if (minValue !== undefined && finalValue < minValue) {
            finalValue = minValue;
          }
          
          onChange?.(finalValue);
        } else if (inputValue === '' || inputValue === '-') {
          onChange?.(null);
        }
      },
      [onChange, allowNegative, maxValue, minValue]
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      // Mostrar valor numérico durante edição
      if (value !== null && value !== undefined) {
        setDisplayValue(value.toString().replace('.', ','));
      }
    }, [value]);

    const handleBlur = useCallback(
      (e: FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        
        // Formatar valor ao sair do campo
        if (value !== null && value !== undefined) {
          setDisplayValue(formatCurrency(value, currency, locale));
        } else {
          setDisplayValue('');
        }

        onBlur?.(e);
      },
      [value, currency, locale, onBlur]
    );

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'text-right',
            error && 'border-destructive focus:border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

/**
 * Display de valor monetário (apenas visualização)
 */
interface CurrencyDisplayProps {
  value: number | null | undefined;
  currency?: string;
  locale?: string;
  className?: string;
  showSign?: boolean;
  colorBySign?: boolean;
}

export function CurrencyDisplay({
  value,
  currency = 'BRL',
  locale = 'pt-BR',
  className,
  showSign = false,
  colorBySign = false,
}: CurrencyDisplayProps) {
  if (value === null || value === undefined) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  const formatted = formatCurrency(Math.abs(value), currency, locale);
  const sign = value >= 0 ? '+' : '-';
  const displayValue = showSign ? `${sign} ${formatted.replace('-', '')}` : formatted;

  return (
    <span
      className={cn(
        colorBySign && value > 0 && 'text-success',
        colorBySign && value < 0 && 'text-destructive',
        className
      )}
    >
      {displayValue}
    </span>
  );
}
