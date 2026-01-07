/**
 * Compound Components Pattern
 * Componentes compostos para maior flexibilidade e reutilização
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

// ============================================
// ACCORDION COMPOUND COMPONENT
// ============================================

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

interface AccordionProps {
  children: ReactNode;
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export function Accordion({ 
  children, 
  allowMultiple = false, 
  defaultOpen = [],
  className 
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggleItem = useCallback((id: string) => {
    setOpenItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return allowMultiple ? [...prev, id] : [id];
    });
  }, [allowMultiple]);

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, allowMultiple }}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

Accordion.Item = function AccordionItem({ id, children, className }: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const isOpen = context.openItems.includes(id);

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)} data-state={isOpen ? 'open' : 'closed'}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ id?: string; isOpen?: boolean }>, { id, isOpen });
        }
        return child;
      })}
    </div>
  );
};

interface AccordionTriggerProps {
  id?: string;
  isOpen?: boolean;
  children: ReactNode;
  className?: string;
}

Accordion.Trigger = function AccordionTrigger({ id, isOpen, children, className }: AccordionTriggerProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');

  return (
    <button
      onClick={() => id && context.toggleItem(id)}
      className={cn(
        'flex w-full items-center justify-between p-4 text-left font-medium transition-colors hover:bg-muted/50',
        className
      )}
    >
      {children}
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </button>
  );
};

interface AccordionContentProps {
  isOpen?: boolean;
  children: ReactNode;
  className?: string;
}

Accordion.Content = function AccordionContent({ isOpen, children, className }: AccordionContentProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={cn('p-4 pt-0', className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// TABS COMPOUND COMPONENT
// ============================================

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  children: ReactNode;
  defaultTab: string;
  onChange?: (tab: string) => void;
  className?: string;
}

export function Tabs({ children, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab);

  const setActiveTab = useCallback((id: string) => {
    setActiveTabState(id);
    onChange?.(id);
  }, [onChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
}

Tabs.List = function TabList({ children, className }: TabListProps) {
  return (
    <div className={cn('flex border-b', className)}>
      {children}
    </div>
  );
};

interface TabTriggerProps {
  id: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

Tabs.Trigger = function TabTrigger({ id, children, className, disabled }: TabTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabTrigger must be used within Tabs');

  const isActive = context.activeTab === id;

  return (
    <button
      onClick={() => !disabled && context.setActiveTab(id)}
      disabled={disabled}
      className={cn(
        'relative px-4 py-2 text-sm font-medium transition-colors',
        'hover:text-foreground',
        isActive ? 'text-foreground' : 'text-muted-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      )}
    </button>
  );
};

interface TabContentProps {
  id: string;
  children: ReactNode;
  className?: string;
}

Tabs.Content = function TabContent({ id, children, className }: TabContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabContent must be used within Tabs');

  if (context.activeTab !== id) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('pt-4', className)}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// MENU COMPOUND COMPONENT
// ============================================

interface MenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

interface MenuProps {
  children: ReactNode;
  className?: string;
}

export function Menu({ children, className }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen, activeItem, setActiveItem }}>
      <div className={cn('relative inline-block', className)}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}

interface MenuTriggerProps {
  children: ReactNode;
  className?: string;
}

Menu.Trigger = function MenuTrigger({ children, className }: MenuTriggerProps) {
  const context = useContext(MenuContext);
  if (!context) throw new Error('MenuTrigger must be used within Menu');

  return (
    <button
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={className}
    >
      {children}
    </button>
  );
};

interface MenuContentProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

Menu.Content = function MenuContent({ children, className, align = 'left' }: MenuContentProps) {
  const context = useContext(MenuContext);
  if (!context) throw new Error('MenuContent must be used within Menu');

  return (
    <AnimatePresence>
      {context.isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => context.setIsOpen(false)} 
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 min-w-[180px] rounded-md border bg-popover p-1 shadow-lg',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface MenuItemProps {
  id: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
}

Menu.Item = function MenuItem({ 
  id, 
  children, 
  onClick, 
  disabled, 
  destructive,
  className 
}: MenuItemProps) {
  const context = useContext(MenuContext);
  if (!context) throw new Error('MenuItem must be used within Menu');

  return (
    <button
      onClick={() => {
        if (!disabled) {
          onClick?.();
          context.setIsOpen(false);
        }
      }}
      disabled={disabled}
      className={cn(
        'flex w-full items-center rounded-sm px-3 py-2 text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        destructive && 'text-destructive hover:bg-destructive/10',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

Menu.Separator = function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
};

// ============================================
// SELECT COMPOUND COMPONENT
// ============================================

interface SelectContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  value: string;
  setValue: (value: string) => void;
  displayValue: string;
  setDisplayValue: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

interface SelectProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Select({ 
  children, 
  value: controlledValue,
  defaultValue = '',
  onChange,
  className 
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [displayValue, setDisplayValue] = useState('');

  const value = controlledValue ?? internalValue;

  const setValue = useCallback((newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
    setIsOpen(false);
  }, [controlledValue, onChange]);

  return (
    <SelectContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      value, 
      setValue, 
      displayValue, 
      setDisplayValue 
    }}>
      <div className={cn('relative', className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps {
  children?: ReactNode;
  placeholder?: string;
  className?: string;
}

Select.Trigger = function SelectTrigger({ 
  children, 
  placeholder = 'Selecione...',
  className 
}: SelectTriggerProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  return (
    <button
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={cn(
        'flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm',
        'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      <span className={!context.displayValue ? 'text-muted-foreground' : ''}>
        {context.displayValue || placeholder}
      </span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

interface SelectContentProps {
  children: ReactNode;
  className?: string;
}

Select.Content = function SelectContent({ children, className }: SelectContentProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  return (
    <AnimatePresence>
      {context.isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => context.setIsOpen(false)} 
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-lg',
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface SelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

Select.Item = function SelectItem({ value, children, className }: SelectItemProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  const isSelected = context.value === value;

  return (
    <button
      onClick={() => {
        context.setValue(value);
        context.setDisplayValue(typeof children === 'string' ? children : value);
      }}
      className={cn(
        'flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent',
        className
      )}
    >
      {children}
      {isSelected && <Check className="h-4 w-4" />}
    </button>
  );
};

// ============================================
// TREE COMPOUND COMPONENT
// ============================================

interface TreeContextValue {
  expandedItems: Set<string>;
  toggleItem: (id: string) => void;
  selectedItem: string | null;
  selectItem: (id: string) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

interface TreeProps {
  children: ReactNode;
  defaultExpanded?: string[];
  onSelect?: (id: string) => void;
  className?: string;
}

export function Tree({ 
  children, 
  defaultExpanded = [],
  onSelect,
  className 
}: TreeProps) {
  const [expandedItems, setExpandedItems] = useState(new Set(defaultExpanded));
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const toggleItem = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectItem = useCallback((id: string) => {
    setSelectedItem(id);
    onSelect?.(id);
  }, [onSelect]);

  return (
    <TreeContext.Provider value={{ expandedItems, toggleItem, selectedItem, selectItem }}>
      <div className={cn('space-y-1', className)}>
        {children}
      </div>
    </TreeContext.Provider>
  );
}

interface TreeItemProps {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

Tree.Item = function TreeItem({ id, label, icon, children, className }: TreeItemProps) {
  const context = useContext(TreeContext);
  if (!context) throw new Error('TreeItem must be used within Tree');

  const hasChildren = Boolean(children);
  const isExpanded = context.expandedItems.has(id);
  const isSelected = context.selectedItem === id;

  return (
    <div className={className}>
      <button
        onClick={() => {
          context.selectItem(id);
          if (hasChildren) {
            context.toggleItem(id);
          }
        }}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected && 'bg-accent text-accent-foreground'
        )}
      >
        {hasChildren ? (
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        ) : (
          <div className="w-4" />
        )}
        {icon}
        {label}
      </button>
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-4 overflow-hidden border-l pl-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
