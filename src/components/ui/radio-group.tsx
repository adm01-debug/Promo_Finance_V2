import * as React from 'react';
import { cn } from '@/lib/utils';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  className,
  orientation = 'vertical',
}: RadioGroupProps) {
  return (
    <div className={cn(
      'flex gap-4',
      orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
      className
    )}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            option.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={option.disabled}
            className={cn(
              'h-4 w-4 border-gray-300 text-primary focus:ring-primary',
              'disabled:cursor-not-allowed'
            )}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export default RadioGroup;
