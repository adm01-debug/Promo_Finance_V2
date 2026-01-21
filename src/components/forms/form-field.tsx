import { ReactNode, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  horizontal?: boolean;
  htmlFor?: string;
}

/**
 * Wrapper para campos de formulário com label, erro e hint
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      required,
      children,
      className,
      labelClassName,
      horizontal = false,
      htmlFor,
    },
    ref
  ) => {
    const generatedId = useId();
    const fieldId = htmlFor || generatedId;

    return (
      <div
        ref={ref}
        className={cn(
          'space-y-1.5',
          horizontal && 'sm:flex sm:items-start sm:gap-4 sm:space-y-0',
          className
        )}
      >
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300',
              horizontal && 'sm:w-1/3 sm:pt-2',
              error && 'text-red-600 dark:text-red-400',
              labelClassName
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </Label>
        )}

        <div className={cn(horizontal && 'sm:flex-1')}>
          {children}

          {/* Hint */}
          {hint && !error && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {hint}
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

FormField.displayName = 'FormField';

/**
 * Grupo de campos de formulário
 */
interface FormGroupProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormGroup({ title, description, children, className }: FormGroupProps) {
  return (
    <fieldset className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <legend className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {title}
            </legend>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </fieldset>
  );
}

/**
 * Row de campos (layout horizontal)
 */
interface FormRowProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function FormRow({ children, className, cols = 2 }: FormRowProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[cols], className)}>
      {children}
    </div>
  );
}

/**
 * Ações do formulário (botões)
 */
interface FormActionsProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export function FormActions({ children, className, align = 'right' }: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Divider entre seções
 */
export function FormDivider({ className }: { className?: string }) {
  return (
    <hr className={cn('border-gray-200 dark:border-gray-700 my-6', className)} />
  );
}

// Re-export common form components
export { Input as TextInput } from '@/components/ui/input';
export { Textarea as TextArea } from '@/components/ui/textarea';
export { Select } from '@/components/ui/select';
export { RadioGroup } from '@/components/ui/radio-group';
export { Checkbox } from '@/components/ui/checkbox';
