import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="flex items-start gap-2">
        <div className="relative">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className={cn(
              'peer h-4 w-4 shrink-0 rounded border border-gray-300 dark:border-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'checked:bg-primary checked:border-primary',
              className
            )}
            {...props}
          />
        </div>
        {label && (
          <label htmlFor={inputId} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            {label}
          </label>
        )}
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
export default Checkbox;
