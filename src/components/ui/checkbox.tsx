import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode; description?: string; error?: string; indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, indeterminate, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <div className="relative">
            <input ref={ref} type="checkbox" id={checkboxId}
              className={cn('peer h-4 w-4 shrink-0 rounded border appearance-none cursor-pointer', 'bg-background', 'checked:bg-primary checked:border-primary', 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2', 'disabled:cursor-not-allowed disabled:opacity-50', 'transition-colors duration-200', error ? 'border-destructive focus:ring-destructive' : 'border-border', className)}
              aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${checkboxId}-error` : description ? `${checkboxId}-description` : undefined} {...props} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-primary-foreground opacity-0 peer-checked:opacity-100">
              {indeterminate ? <Minus className="h-3 w-3" strokeWidth={3} /> : <Check className="h-3 w-3" strokeWidth={3} />}
            </div>
          </div>
        </div>
        {(label || description) && (
          <div className="ml-3">
            {label && <label htmlFor={checkboxId} className={cn('text-sm font-medium cursor-pointer', props.disabled ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground')}>{label}</label>}
            {description && <p id={`${checkboxId}-description`} className="text-sm text-muted-foreground">{description}</p>}
            {error && <p id={`${checkboxId}-error`} className="mt-1 text-sm text-destructive" role="alert">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

interface CheckboxGroupProps {
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  value: string[]; onChange: (value: string[]) => void; label?: string; error?: string; direction?: 'horizontal' | 'vertical'; className?: string;
}

export function CheckboxGroup({ options, value, onChange, label, error, direction = 'vertical', className }: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => { checked ? onChange([...value, optionValue]) : onChange(value.filter((v) => v !== optionValue)); };
  return (
    <fieldset className={className}>
      {label && <legend className="text-sm font-medium text-foreground mb-2">{label}</legend>}
      <div className={cn('space-y-2', direction === 'horizontal' && 'flex flex-wrap gap-4 space-y-0')}>
        {options.map((option) => <Checkbox key={option.value} label={option.label} description={option.description} checked={value.includes(option.value)} onChange={(e) => handleChange(option.value, e.target.checked)} disabled={option.disabled} />)}
      </div>
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
    </fieldset>
  );
}