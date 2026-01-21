import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplitButtonOption {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}

interface SplitButtonProps {
  options: SplitButtonOption[];
  onSelect: (option: SplitButtonOption) => void;
  defaultOptionId?: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SplitButton({
  options,
  onSelect,
  defaultOptionId,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className,
}: SplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SplitButtonOption>(
    options.find((o) => o.id === defaultOptionId) || options[0]
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleMainClick = () => {
    if (!disabled && !loading) {
      onSelect(selectedOption);
    }
  };

  const handleOptionClick = (option: SplitButtonOption) => {
    if (!option.disabled) {
      setSelectedOption(option);
      setIsOpen(false);
      onSelect(option);
    }
  };

  // Variant styles
  const variants = {
    primary: {
      main: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400',
      dropdown: 'bg-primary-600 hover:bg-primary-700 border-primary-500',
      menu: 'bg-white dark:bg-gray-800',
      option: 'hover:bg-primary-50 dark:hover:bg-primary-900/20',
      selected: 'bg-primary-50 dark:bg-primary-900/20',
    },
    secondary: {
      main: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400',
      dropdown: 'bg-gray-600 hover:bg-gray-700 border-gray-500',
      menu: 'bg-white dark:bg-gray-800',
      option: 'hover:bg-gray-50 dark:hover:bg-gray-700',
      selected: 'bg-gray-50 dark:bg-gray-700',
    },
    outline: {
      main: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
      dropdown: 'bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
      menu: 'bg-white dark:bg-gray-800',
      option: 'hover:bg-gray-50 dark:hover:bg-gray-700',
      selected: 'bg-gray-50 dark:bg-gray-700',
    },
    ghost: {
      main: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
      dropdown: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700',
      menu: 'bg-white dark:bg-gray-800',
      option: 'hover:bg-gray-50 dark:hover:bg-gray-700',
      selected: 'bg-gray-50 dark:bg-gray-700',
    },
    danger: {
      main: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
      dropdown: 'bg-red-600 hover:bg-red-700 border-red-500',
      menu: 'bg-white dark:bg-gray-800',
      option: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      selected: 'bg-red-50 dark:bg-red-900/20',
    },
  };

  // Size styles
  const sizes = {
    sm: {
      main: 'px-3 py-1.5 text-sm',
      dropdown: 'px-2 py-1.5',
      menu: 'w-48',
      option: 'px-3 py-1.5 text-sm',
    },
    md: {
      main: 'px-4 py-2 text-sm',
      dropdown: 'px-2 py-2',
      menu: 'w-56',
      option: 'px-4 py-2 text-sm',
    },
    lg: {
      main: 'px-5 py-2.5 text-base',
      dropdown: 'px-3 py-2.5',
      menu: 'w-64',
      option: 'px-5 py-2.5 text-base',
    },
  };

  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      {/* Main button */}
      <button
        type="button"
        onClick={handleMainClick}
        disabled={disabled || loading}
        className={cn(
          'flex items-center gap-2 font-medium rounded-l-lg transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles.main,
          sizeStyles.main
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : selectedOption.icon ? (
          <span className="flex-shrink-0">{selectedOption.icon}</span>
        ) : null}
        <span>{selectedOption.label}</span>
      </button>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center rounded-r-lg border-l transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'outline' || variant === 'ghost' ? 'border' : '',
          variantStyles.dropdown,
          sizeStyles.dropdown
        )}
      >
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full right-0 mt-1 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50',
            'animate-in fade-in-0 zoom-in-95 duration-100',
            variantStyles.menu,
            sizeStyles.menu
          )}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              className={cn(
                'w-full flex items-start gap-3 text-left transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantStyles.option,
                selectedOption.id === option.id && variantStyles.selected,
                sizeStyles.option
              )}
            >
              {option.icon && (
                <span className="flex-shrink-0 mt-0.5">{option.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {option.description}
                  </div>
                )}
              </div>
              {selectedOption.id === option.id && (
                <span className="flex-shrink-0 text-primary-600 dark:text-primary-400">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple dropdown button (no split, just dropdown)
interface DropdownButtonProps {
  label: string;
  icon?: ReactNode;
  options: SplitButtonOption[];
  onSelect: (option: SplitButtonOption) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DropdownButton({
  label,
  icon,
  options,
  onSelect,
  loading = false,
  disabled = false,
  variant = 'outline',
  size = 'md',
  className,
}: DropdownButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (option: SplitButtonOption) => {
    if (!option.disabled) {
      setIsOpen(false);
      onSelect(option);
    }
  };

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={cn(
          'flex items-center gap-2 font-medium rounded-lg transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size]
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        <span>{label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option)}
              disabled={option.disabled}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-2 text-left text-sm transition-colors',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {option.icon && (
                <span className="flex-shrink-0 mt-0.5">{option.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {option.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type { SplitButtonOption };
export default SplitButton;
