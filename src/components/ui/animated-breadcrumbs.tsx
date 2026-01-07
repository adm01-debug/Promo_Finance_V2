import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface AnimatedBreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  homeIcon?: boolean;
  /** Visual style variant */
  variant?: 'default' | 'pills' | 'minimal';
}

// Route to label mapping
const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard-empresa': 'Dashboard Empresa',
  '/contas-pagar': 'Contas a Pagar',
  '/contas-receber': 'Contas a Receber',
  '/fluxo-caixa': 'Fluxo de Caixa',
  '/conciliacao': 'Conciliação',
  '/boletos': 'Boletos',
  '/notas-fiscais': 'Notas Fiscais',
  '/clientes': 'Clientes',
  '/fornecedores': 'Fornecedores',
  '/empresas': 'Empresas',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/bi': 'Business Intelligence',
  '/expert': 'Expert AI',
  '/reforma-tributaria': 'Reforma Tributária',
  '/demonstrativos': 'Demonstrativos',
  '/cobrancas': 'Cobranças',
  '/alertas': 'Alertas',
  '/aprovacoes': 'Aprovações',
  '/seguranca': 'Segurança',
};

// Breadcrumb item component
function BreadcrumbItemComponent({
  item,
  index,
  isLast,
  separator,
  homeIcon,
  variant,
}: {
  item: BreadcrumbItem;
  index: number;
  isLast: boolean;
  separator: React.ReactNode;
  homeIcon: boolean;
  variant: 'default' | 'pills' | 'minimal';
}) {
  const baseStyles = {
    default: 'text-sm',
    pills: 'text-xs px-2.5 py-1 rounded-full',
    minimal: 'text-sm',
  };

  const linkStyles = {
    default: 'text-muted-foreground hover:text-foreground transition-colors',
    pills: 'text-muted-foreground hover:text-foreground hover:bg-muted transition-all bg-muted/50',
    minimal: 'text-muted-foreground/70 hover:text-muted-foreground transition-colors',
  };

  const activeStyles = {
    default: 'font-medium text-foreground',
    pills: 'font-medium text-foreground bg-primary/10 text-primary',
    minimal: 'font-medium text-foreground',
  };

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-center gap-1"
    >
      {index > 0 && variant !== 'pills' && (
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-1"
        >
          {separator}
        </motion.span>
      )}
      
      {item.href && !isLast ? (
        <Link
          to={item.href}
          className={cn(
            'flex items-center gap-1.5',
            baseStyles[variant],
            linkStyles[variant]
          )}
        >
          {index === 0 && homeIcon && (
            <Home className="h-3.5 w-3.5" />
          )}
          {item.icon}
          <span className="hidden sm:inline">{item.label}</span>
        </Link>
      ) : (
        <span className={cn(
          'flex items-center gap-1.5',
          baseStyles[variant],
          activeStyles[variant]
        )}>
          {item.icon}
          {item.label}
        </span>
      )}
    </motion.li>
  );
}

export function AnimatedBreadcrumbs({ 
  items, 
  separator,
  className,
  homeIcon = true,
  variant = 'default',
}: AnimatedBreadcrumbsProps) {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    if (items) {
      setBreadcrumbs(items);
      return;
    }

    // Auto-generate from route
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const autoBreadcrumbs: BreadcrumbItem[] = [
      { label: 'Início', href: '/' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeLabels[currentPath] || 
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      autoBreadcrumbs.push({ label, href: currentPath });
    });

    setBreadcrumbs(autoBreadcrumbs);
  }, [location.pathname, items]);

  const defaultSeparator = (
    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
  );

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className={cn(
        'flex items-center',
        variant === 'pills' ? 'gap-2' : 'gap-1'
      )}>
        <AnimatePresence mode="popLayout">
          {breadcrumbs.map((item, index) => (
            <BreadcrumbItemComponent
              key={item.href || index}
              item={item}
              index={index}
              isLast={index === breadcrumbs.length - 1}
              separator={separator || defaultSeparator}
              homeIcon={homeIcon}
              variant={variant}
            />
          ))}
        </AnimatePresence>
      </ol>
    </nav>
  );
}

// Collapsible breadcrumbs for long paths with dropdown
interface CollapsibleBreadcrumbsProps extends AnimatedBreadcrumbsProps {
  maxVisible?: number;
}

export function CollapsibleBreadcrumbs({ 
  items,
  maxVisible = 3,
  variant = 'default',
  ...props 
}: CollapsibleBreadcrumbsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayItems = useMemo(() => {
    if (!items || items.length <= maxVisible || isExpanded) {
      return items;
    }

    const firstItem = items[0];
    const lastItems = items.slice(-2);
    
    return [firstItem, { label: '...', href: undefined }, ...lastItems];
  }, [items, maxVisible, isExpanded]);

  if (!items || items.length <= maxVisible) {
    return <AnimatedBreadcrumbs items={items} variant={variant} {...props} />;
  }

  const hiddenItems = items.slice(1, -2);

  return (
    <nav className={cn('flex items-center', props.className)}>
      <ol className={cn(
        'flex items-center',
        variant === 'pills' ? 'gap-2' : 'gap-1'
      )}>
        {displayItems?.map((item, index) => (
          <motion.li 
            key={index} 
            className="flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            {index > 0 && variant !== 'pills' && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 mx-1" />
            )}
            
            {item.label === '...' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors',
                      variant === 'pills' 
                        ? 'px-2 py-1 rounded-full bg-muted/50 hover:bg-muted'
                        : 'px-1.5 py-0.5 rounded hover:bg-muted'
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px]">
                  {hiddenItems.map((hiddenItem, hiddenIndex) => (
                    <DropdownMenuItem key={hiddenIndex} asChild>
                      <Link 
                        to={hiddenItem.href || '#'}
                        className="flex items-center gap-2"
                      >
                        {hiddenItem.icon}
                        {hiddenItem.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : item.href ? (
              <Link
                to={item.href}
                className={cn(
                  'text-sm text-muted-foreground hover:text-foreground transition-colors',
                  variant === 'pills' && 'px-2.5 py-1 rounded-full bg-muted/50 hover:bg-muted'
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                'text-sm font-medium',
                variant === 'pills' && 'px-2.5 py-1 rounded-full bg-primary/10 text-primary'
              )}>
                {item.label}
              </span>
            )}
          </motion.li>
        ))}
      </ol>
    </nav>
  );
}

// Breadcrumb with back button
interface BreadcrumbWithBackProps extends AnimatedBreadcrumbsProps {
  onBack?: () => void;
  backLabel?: string;
}

export function BreadcrumbWithBack({
  onBack,
  backLabel = 'Voltar',
  ...props
}: BreadcrumbWithBackProps) {
  return (
    <div className="flex items-center gap-4">
      {onBack && (
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span className="hidden sm:inline">{backLabel}</span>
        </motion.button>
      )}
      <AnimatedBreadcrumbs {...props} />
    </div>
  );
}
