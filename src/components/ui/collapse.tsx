import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Context for accordion group
interface AccordionContextValue {
  openItems: string[];
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

// Collapse animation component
interface CollapseProps {
  isOpen: boolean;
  children: ReactNode;
  duration?: number;
  className?: string;
}

export function Collapse({
  isOpen,
  children,
  duration = 200,
  className,
}: CollapseProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(isOpen ? 'auto' : 0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!contentRef.current) return;

    const contentHeight = contentRef.current.scrollHeight;

    if (isOpen) {
      setHeight(contentHeight);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setHeight('auto');
        setIsAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setHeight(contentHeight);
      // Force reflow
      contentRef.current.offsetHeight;
      requestAnimationFrame(() => {
        setHeight(0);
        setIsAnimating(true);
        const timer = setTimeout(() => {
          setIsAnimating(false);
        }, duration);
      });
    }
  }, [isOpen, duration]);

  return (
    <div
      className={cn(
        'overflow-hidden',
        isAnimating && 'transition-[height]',
        className
      )}
      style={{
        height,
        transitionDuration: `${duration}ms`,
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

// Single collapsible panel
interface CollapsibleProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  disabled = false,
  icon,
  badge,
  className,
  headerClassName,
  contentClassName,
}: CollapsibleProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isOpen = controlledIsOpen ?? internalIsOpen;

  const handleToggle = useCallback(() => {
    if (disabled) return;

    const newState = !isOpen;
    if (onToggle) {
      onToggle(newState);
    } else {
      setInternalIsOpen(newState);
    }
  }, [isOpen, disabled, onToggle]);

  return (
    <div
      className={cn(
        'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
        className
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left',
          'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50',
          'transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          headerClassName
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="font-medium text-gray-900 dark:text-white">
            {title}
          </span>
          {badge && <span>{badge}</span>}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <Collapse isOpen={isOpen}>
        <div className={cn('px-4 py-3', contentClassName)}>{children}</div>
      </Collapse>
    </div>
  );
}

// Accordion group
interface AccordionProps {
  children: ReactNode;
  defaultOpenItems?: string[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({
  children,
  defaultOpenItems = [],
  allowMultiple = false,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpenItems);

  const toggleItem = useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        if (prev.includes(id)) {
          return prev.filter((item) => item !== id);
        }
        if (allowMultiple) {
          return [...prev, id];
        }
        return [id];
      });
    },
    [allowMultiple]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, allowMultiple }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

// Accordion item
interface AccordionItemProps {
  id: string;
  title: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function AccordionItem({
  id,
  title,
  children,
  disabled = false,
  icon,
  badge,
  className,
}: AccordionItemProps) {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error('AccordionItem must be used within an Accordion');
  }

  const { openItems, toggleItem } = context;
  const isOpen = openItems.includes(id);

  return (
    <Collapsible
      title={title}
      isOpen={isOpen}
      onToggle={() => toggleItem(id)}
      disabled={disabled}
      icon={icon}
      badge={badge}
      className={className}
    >
      {children}
    </Collapsible>
  );
}

// FAQ Accordion (styled variant)
interface FAQItem {
  id: string;
  question: string;
  answer: ReactNode;
}

interface FAQAccordionProps {
  items: FAQItem[];
  allowMultiple?: boolean;
  className?: string;
}

export function FAQAccordion({
  items,
  allowMultiple = false,
  className,
}: FAQAccordionProps) {
  return (
    <Accordion allowMultiple={allowMultiple} className={className}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          id={item.id}
          title={item.question}
          className="border-none border-b border-gray-200 dark:border-gray-700 rounded-none last:border-b-0"
        >
          <div className="text-gray-600 dark:text-gray-400">{item.answer}</div>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// Expandable card
interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  preview?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function ExpandableCard({
  title,
  subtitle,
  preview,
  children,
  defaultExpanded = false,
  actions,
  className,
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-gray-500 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>
          </div>
        </div>
        {preview && !isExpanded && (
          <div className="mt-3">{preview}</div>
        )}
      </div>
      <Collapse isOpen={isExpanded}>
        <div className="px-4 pb-4 pt-0">{children}</div>
      </Collapse>
    </div>
  );
}

// Show more/less component
interface ShowMoreProps {
  children: ReactNode;
  maxHeight?: number;
  showMoreText?: string;
  showLessText?: string;
  className?: string;
}

export function ShowMore({
  children,
  maxHeight = 200,
  showMoreText = 'Ver mais',
  showLessText = 'Ver menos',
  className,
}: ShowMoreProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsExpansion(contentRef.current.scrollHeight > maxHeight);
    }
  }, [children, maxHeight]);

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={cn('relative overflow-hidden transition-all duration-300')}
        style={{ maxHeight: isExpanded || !needsExpansion ? 'none' : maxHeight }}
      >
        {children}
        {!isExpanded && needsExpansion && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
        )}
      </div>
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {isExpanded ? showLessText : showMoreText}
        </button>
      )}
    </div>
  );
}

export default Collapse;
