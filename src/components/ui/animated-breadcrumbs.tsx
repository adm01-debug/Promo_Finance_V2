import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

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

export function AnimatedBreadcrumbs({ 
  items, 
  separator,
  className,
  homeIcon = true
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

  const defaultSeparator = <ChevronRight className="h-4 w-4 text-muted-foreground" />;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1">
        <AnimatePresence mode="popLayout">
          {breadcrumbs.map((item, index) => (
            <motion.li
              key={item.href || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex items-center gap-1"
            >
              {index > 0 && (
                <span className="mx-1">{separator || defaultSeparator}</span>
              )}
              
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 text-sm text-muted-foreground',
                    'hover:text-foreground transition-colors'
                  )}
                >
                  {index === 0 && homeIcon && <Home className="h-4 w-4" />}
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {item.icon}
                  {item.label}
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </nav>
  );
}

// Collapsible breadcrumbs for long paths
interface CollapsibleBreadcrumbsProps extends AnimatedBreadcrumbsProps {
  maxVisible?: number;
}

export function CollapsibleBreadcrumbs({ 
  items,
  maxVisible = 3,
  ...props 
}: CollapsibleBreadcrumbsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!items || items.length <= maxVisible) {
    return <AnimatedBreadcrumbs items={items} {...props} />;
  }

  const firstItem = items[0];
  const lastItems = items.slice(-2);
  const hiddenItems = items.slice(1, -2);

  const visibleItems = isExpanded
    ? items
    : [firstItem, { label: '...', href: undefined }, ...lastItems];

  return (
    <nav className={cn('flex items-center', props.className)}>
      <ol className="flex items-center gap-1">
        {visibleItems.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            )}
            
            {item.label === '...' ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(true)}
                className="px-2 py-1 text-sm text-muted-foreground hover:bg-muted rounded"
              >
                •••
              </motion.button>
            ) : item.href ? (
              <Link
                to={item.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
