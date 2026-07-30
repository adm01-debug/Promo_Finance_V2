import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplitButtonOption { id: string; label: string; icon?: ReactNode; description?: string; disabled?: boolean; }

interface SplitButtonProps {
  options: SplitButtonOption[]; onSelect: (option: SplitButtonOption) => void; defaultOptionId?: string;
  loading?: boolean; disabled?: boolean; variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; className?: string;
}

export function SplitButton({ options, onSelect, defaultOptionId, loading = false, disabled = false, variant = 'primary', size = 'md', className }: SplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SplitButtonOption>(options.find((o) => o.id === defaultOptionId) || options[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, []);

  const variants = {
    primary: { main: 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50', dropdown: 'bg-primary hover:bg-primary/90 border-primary/80', menu: 'bg-popover', option: 'hover:bg-accent', selected: 'bg-accent' },
    secondary: { main: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50', dropdown: 'bg-secondary hover:bg-secondary/80 border-secondary/80', menu: 'bg-popover', option: 'hover:bg-accent', selected: 'bg-accent' },
    outline: { main: 'bg-card border border-border text-foreground hover:bg-muted', dropdown: 'bg-card border-l border-border hover:bg-muted', menu: 'bg-popover', option: 'hover:bg-accent', selected: 'bg-accent' },
    ghost: { main: 'bg-transparent text-foreground hover:bg-muted', dropdown: 'bg-transparent hover:bg-muted', menu: 'bg-popover', option: 'hover:bg-accent', selected: 'bg-accent' },
    danger: { main: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50', dropdown: 'bg-destructive hover:bg-destructive/90 border-destructive/80', menu: 'bg-popover', option: 'hover:bg-destructive/10', selected: 'bg-destructive/10' },
  };
  const sizes = { sm: { main: 'px-3 py-1.5 text-sm', dropdown: 'px-2 py-1.5', menu: 'w-48', option: 'px-3 py-1.5 text-sm' }, md: { main: 'px-4 py-2 text-sm', dropdown: 'px-2 py-2', menu: 'w-56', option: 'px-4 py-2 text-sm' }, lg: { main: 'px-5 py-2.5 text-base', dropdown: 'px-3 py-2.5', menu: 'w-64', option: 'px-5 py-2.5 text-base' } };
  const v = variants[variant]; const s = sizes[size];

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button type="button" onClick={() => !disabled && !loading && onSelect(selectedOption)} disabled={disabled || loading} className={cn('flex items-center gap-2 font-medium rounded-l-lg transition-colors disabled:cursor-not-allowed', v.main, s.main)}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : selectedOption.icon ? <span className="flex-shrink-0">{selectedOption.icon}</span> : null}
        <span>{selectedOption.label}</span>
      </button>
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className={cn('flex items-center rounded-r-lg border-l transition-colors disabled:cursor-not-allowed', v.dropdown, s.dropdown)}>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className={cn('absolute top-full right-0 mt-1 rounded-lg shadow-lg border border-border py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100', v.menu, s.menu)}>
          {options.map((option) => (
            <button key={option.id} type="button" onClick={() => { if (!option.disabled) { setSelectedOption(option); setIsOpen(false); onSelect(option); } }} disabled={option.disabled}
              className={cn('w-full flex items-start gap-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed', v.option, selectedOption.id === option.id && v.selected, s.option)}>
              {option.icon && <span className="flex-shrink-0 mt-0.5">{option.icon}</span>}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{option.label}</div>
                {option.description && <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>}
              </div>
              {selectedOption.id === option.id && <span className="flex-shrink-0 text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DropdownButtonProps { label: string; icon?: ReactNode; options: SplitButtonOption[]; onSelect: (option: SplitButtonOption) => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; className?: string; }

export function DropdownButton({ label, icon, options, onSelect, loading = false, disabled = false, variant = 'outline', size = 'md', className }: DropdownButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const variants = { primary: 'bg-primary text-primary-foreground hover:bg-primary/90', secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', outline: 'bg-card border border-border text-foreground hover:bg-muted', ghost: 'bg-transparent text-foreground hover:bg-muted', danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90' };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled || loading} className={cn('flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size])}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon ? <span className="flex-shrink-0">{icon}</span> : null}
        <span>{label}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
          {options.map((option) => (
            <button key={option.id} type="button" onClick={() => { if (!option.disabled) { setIsOpen(false); onSelect(option); } }} disabled={option.disabled} className={cn('w-full flex items-start gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed')}>
              {option.icon && <span className="flex-shrink-0 mt-0.5">{option.icon}</span>}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{option.label}</div>
                {option.description && <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>}
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