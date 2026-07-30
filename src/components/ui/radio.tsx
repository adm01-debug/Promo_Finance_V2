import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={cn(
              'h-4 w-4 cursor-pointer',
              'text-primary bg-background',
              'border-input',
              'focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors duration-200',
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${radioId}-error` : description ? `${radioId}-description` : undefined
            }
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  props.disabled
                    ? 'text-muted-foreground cursor-not-allowed'
                    : 'text-foreground'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={`${radioId}-description`}
                className="text-sm text-muted-foreground"
              >
                {description}
              </p>
            )}
            {error && (
              <p
                id={`${radioId}-error`}
                className="mt-1 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  direction?: 'horizontal' | 'vertical';
  className?: string;
  required?: boolean;
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  error,
  direction = 'vertical',
  className,
  required,
}: RadioGroupProps) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </legend>
      )}

      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          'space-y-2',
          direction === 'horizontal' && 'flex flex-wrap gap-4 space-y-0'
        )}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={option.disabled}
          />
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

interface CardRadioOption extends RadioOption {
  icon?: ReactNode;
}

interface CardRadioGroupProps extends Omit<RadioGroupProps, 'options' | 'direction'> {
  options: CardRadioOption[];
  columns?: 1 | 2 | 3 | 4;
}

export function CardRadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  error,
  className,
  required,
  columns = 2,
}: CardRadioGroupProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-sm font-medium text-foreground mb-3">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </legend>
      )}

      <div role="radiogroup" aria-label={label} className={cn('grid gap-3', gridCols[columns])}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'relative flex items-center p-4 rounded-lg border-2 cursor-pointer',
              'transition-all duration-200',
              option.disabled && 'opacity-50 cursor-not-allowed',
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
              className="sr-only"
            />

            {option.icon && (
              <div className="flex-shrink-0 mr-3 text-muted-foreground">
                {option.icon}
              </div>
            )}

            <div className="flex-1">
              <p className="font-medium text-foreground">{option.label}</p>
              {option.description && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}
            </div>

            {value === option.value && (
              <div className="absolute top-2 right-2 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-primary-foreground rounded-full" />
              </div>
            )}
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}