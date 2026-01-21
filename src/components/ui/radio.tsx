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
              'text-primary-600 bg-white dark:bg-gray-800',
              'border-gray-300 dark:border-gray-600',
              'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors duration-200',
              error && 'border-red-500 focus:ring-red-500',
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
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={`${radioId}-description`}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {description}
              </p>
            )}
            {error && (
              <p
                id={`${radioId}-error`}
                className="mt-1 text-sm text-red-500"
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

// Radio Group
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
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

// Card Radio - Styled variant
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
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
              <div className="flex-shrink-0 mr-3 text-gray-600 dark:text-gray-400">
                {option.icon}
              </div>
            )}

            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
              {option.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
              )}
            </div>

            {value === option.value && (
              <div className="absolute top-2 right-2 h-4 w-4 bg-primary-500 rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full" />
              </div>
            )}
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
