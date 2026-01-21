import { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  isLoading?: boolean;
  showClear?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    input: 'h-8 text-sm pl-8 pr-8',
    icon: 'w-4 h-4 left-2',
    clear: 'w-4 h-4 right-2',
  },
  md: {
    input: 'h-10 text-sm pl-10 pr-10',
    icon: 'w-5 h-5 left-3',
    clear: 'w-5 h-5 right-3',
  },
  lg: {
    input: 'h-12 text-base pl-12 pr-12',
    icon: 'w-6 h-6 left-4',
    clear: 'w-6 h-6 right-4',
  },
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlledValue,
      onChange,
      onSearch,
      debounceMs = 300,
      isLoading = false,
      showClear = true,
      size = 'md',
      className,
      placeholder = 'Buscar...',
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState('');
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    const inputRef = useRef<HTMLInputElement>(null);

    // Combine refs
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(inputRef.current);
      } else if (ref) {
        ref.current = inputRef.current;
      }
    }, [ref]);

    // Debounced search
    const debouncedValue = useDebounce(value, debounceMs);

    useEffect(() => {
      if (onSearch && debouncedValue !== undefined) {
        onSearch(debouncedValue);
      }
    }, [debouncedValue, onSearch]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      },
      [isControlled, onChange]
    );

    const handleClear = useCallback(() => {
      if (!isControlled) {
        setInternalValue('');
      }
      onChange?.('');
      onSearch?.('');
      inputRef.current?.focus();
    }, [isControlled, onChange, onSearch]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
          handleClear();
        }
        if (e.key === 'Enter') {
          onSearch?.(value);
        }
      },
      [handleClear, onSearch, value]
    );

    const classes = sizeClasses[size];

    return (
      <div className="relative">
        {/* Search icon */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none',
            classes.icon
          )}
        >
          {isLoading ? (
            <Loader2 className="w-full h-full animate-spin" />
          ) : (
            <Search className="w-full h-full" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors',
            classes.input,
            className
          )}
          {...props}
        />

        {/* Clear button */}
        {showClear && value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              'transition-colors',
              classes.clear
            )}
            tabIndex={-1}
          >
            <X className="w-full h-full" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Variant with icon button
interface SearchInputWithButtonProps extends SearchInputProps {
  onButtonClick?: () => void;
  buttonLabel?: string;
}

export function SearchInputWithButton({
  onButtonClick,
  buttonLabel = 'Buscar',
  className,
  ...props
}: SearchInputWithButtonProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      <SearchInput {...props} className="flex-1" />
      <button
        type="button"
        onClick={onButtonClick}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export default SearchInput;
