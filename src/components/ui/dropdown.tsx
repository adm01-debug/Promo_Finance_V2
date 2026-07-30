import { useState, useRef, useEffect, ReactNode, createContext, useContext } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Context
interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  closeMenu: () => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown provider');
  }
  return context;
}

// Dropdown Root
interface DropdownProps {
  children: ReactNode;
  className?: string;
}

export function Dropdown({ children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, closeMenu }}>
      <div ref={dropdownRef} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// Dropdown Trigger
interface DropdownTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

export function DropdownTrigger({ children, asChild, className }: DropdownTriggerProps) {
  const { isOpen, setIsOpen } = useDropdownContext();
  const handleClick = () => setIsOpen(!isOpen);

  if (asChild) {
    return <div onClick={handleClick} className={className}>{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2',
        'bg-card border border-border',
        'text-sm font-medium text-foreground',
        'hover:bg-muted',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        className
      )}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {children}
    </button>
  );
}

// Dropdown Content
interface DropdownContentProps {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  sideOffset?: number;
  className?: string;
}

export function DropdownContent({
  children, align = 'start', side = 'bottom', sideOffset = 4, className,
}: DropdownContentProps) {
  const { isOpen } = useDropdownContext();
  if (!isOpen) return null;

  const alignClasses = { start: 'left-0', center: 'left-1/2 -translate-x-1/2', end: 'right-0' };
  const sideClasses = { top: `bottom-full mb-${sideOffset}`, bottom: `top-full mt-${sideOffset}` };

  return (
    <div
      className={cn(
        'absolute z-50 min-w-[160px] overflow-hidden rounded-md',
        'bg-popover border border-border',
        'shadow-lg',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        alignClasses[align], sideClasses[side], className
      )}
      style={{ marginTop: side === 'bottom' ? sideOffset : undefined, marginBottom: side === 'top' ? sideOffset : undefined }}
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

// Dropdown Item
interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
  shortcut?: string;
  className?: string;
}

export function DropdownItem({
  children, onClick, disabled = false, destructive = false, icon, shortcut, className,
}: DropdownItemProps) {
  const { closeMenu } = useDropdownContext();
  const handleClick = () => { if (!disabled) { onClick?.(); closeMenu(); } };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
        'transition-colors duration-150',
        'focus:outline-none focus:bg-accent',
        disabled && 'opacity-50 cursor-not-allowed',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-accent',
        className
      )}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="text-xs text-muted-foreground">{shortcut}</span>}
    </button>
  );
}

// Dropdown Separator
export function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn('h-px my-1 bg-border', className)} role="separator" />;
}

// Dropdown Label
interface DropdownLabelProps { children: ReactNode; className?: string; }

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div className={cn('px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider', className)}>
      {children}
    </div>
  );
}

// Dropdown Checkbox Item
interface DropdownCheckboxItemProps {
  children: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownCheckboxItem({
  children, checked, onCheckedChange, disabled = false, className,
}: DropdownCheckboxItemProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
        'text-foreground',
        'hover:bg-accent',
        'focus:outline-none focus:bg-accent',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'w-4 h-4 flex items-center justify-center rounded border',
          checked
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border'
        )}
      >
        {checked && <Check className="w-3 h-3" />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

// Dropdown Sub Menu
interface DropdownSubProps { children: ReactNode; trigger: ReactNode; className?: string; }

export function DropdownSub({ children, trigger, className }: DropdownSubProps) {
  const [isSubOpen, setIsSubOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setIsSubOpen(true)} onMouseLeave={() => setIsSubOpen(false)}>
      <button
        type="button"
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
          'text-foreground',
          'hover:bg-accent',
          className
        )}
      >
        <span className="flex-1">{trigger}</span>
        <ChevronRight className="w-4 h-4" />
      </button>

      {isSubOpen && (
        <div
          className={cn(
            'absolute left-full top-0 ml-1 min-w-[160px]',
            'bg-popover border border-border',
            'rounded-md shadow-lg py-1',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}