import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, forwardRef } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import { Input } from './input';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

interface AnimatedSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}

export function AnimatedSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  searchable = false,
  className,
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = searchable
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2',
          'border rounded-lg bg-background text-left',
          'hover:bg-muted/50 transition-colors',
          isOpen && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        <span className={cn(!selectedOption && 'text-muted-foreground')}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute z-50 w-full mt-2 py-1',
                'bg-popover border rounded-lg shadow-xl',
                'max-h-64 overflow-auto'
              )}
            >
              {searchable && (
                <div className="px-2 pb-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8"
                    />
                  </div>
                </div>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nenhum resultado encontrado
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    disabled={option.disabled}
                    onClick={() => {
                      onChange?.(option.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left',
                      'hover:bg-muted transition-colors',
                      option.value === value && 'bg-primary/10',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {option.icon && (
                      <span className="text-muted-foreground">{option.icon}</span>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{option.label}</p>
                      {option.description && (
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      )}
                    </div>
                    {option.value === value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </motion.button>
                ))
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Multi-select with tags
interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  maxTags = 3,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOptions = options.filter((o) => value.includes(o.value));
  const filteredOptions = options.filter(
    (o) =>
      !value.includes(o.value) &&
      o.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    onChange?.([...value, optionValue]);
  };

  const handleRemove = (optionValue: string) => {
    onChange?.(value.filter((v) => v !== optionValue));
  };

  return (
    <div className={cn('relative', className)}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'min-h-[42px] flex flex-wrap items-center gap-1 px-3 py-1.5',
          'border rounded-lg bg-background cursor-pointer',
          'hover:bg-muted/50 transition-colors',
          isOpen && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        {selectedOptions.slice(0, maxTags).map((option) => (
          <motion.span
            key={option.value}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-sm"
          >
            {option.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(option.value);
              }}
              className="hover:bg-primary/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
        {selectedOptions.length > maxTags && (
          <span className="text-xs text-muted-foreground">
            +{selectedOptions.length - maxTags}
          </span>
        )}
        {selectedOptions.length === 0 && (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 py-2 bg-popover border rounded-lg shadow-xl max-h-64 overflow-auto"
            >
              <div className="px-2 pb-2">
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8"
                />
              </div>
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
