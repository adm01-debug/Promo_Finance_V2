import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  Home, 
  BarChart3, 
  FileText, 
  Users, 
  Building2, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle,
  PiggyBank,
  Receipt,
  Settings,
  Shield,
  Bell,
  CheckCircle,
  Brain,
  Calculator,
  TrendingUp,
  CreditCard,
  Repeat,
  Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Route configuration with icons and labels
const routeConfig: Record<string, { label: string; icon: React.ElementType; parent?: string }> = {
  '/': { label: 'Dashboard', icon: Home },
  '/dashboard': { label: 'Dashboard', icon: Home },
  '/bi': { label: 'Business Intelligence', icon: BarChart3, parent: '/' },
  '/fluxo-caixa': { label: 'Fluxo de Caixa', icon: TrendingUp, parent: '/' },
  '/contas-pagar': { label: 'Contas a Pagar', icon: ArrowDownCircle, parent: '/' },
  '/contas-receber': { label: 'Contas a Receber', icon: ArrowUpCircle, parent: '/' },
  '/cobrancas': { label: 'Cobranças', icon: CreditCard, parent: '/' },
  '/boletos': { label: 'Boletos', icon: Receipt, parent: '/' },
  '/conciliacao': { label: 'Conciliação', icon: CheckCircle, parent: '/' },
  '/notas-fiscais': { label: 'Notas Fiscais', icon: FileText, parent: '/' },
  '/relatorios': { label: 'Relatórios', icon: BarChart3, parent: '/' },
  '/demonstrativos': { label: 'Demonstrativos', icon: FileText, parent: '/' },
  '/clientes': { label: 'Clientes', icon: Users, parent: '/' },
  '/fornecedores': { label: 'Fornecedores', icon: Building2, parent: '/' },
  '/empresas': { label: 'Empresas', icon: Building2, parent: '/' },
  '/centros-custo': { label: 'Centros de Custo', icon: PiggyBank, parent: '/' },
  '/contas-bancarias': { label: 'Contas Bancárias', icon: Landmark, parent: '/' },
  '/pagamentos-recorrentes': { label: 'Pagamentos Recorrentes', icon: Repeat, parent: '/' },
  '/reforma-tributaria': { label: 'Reforma Tributária', icon: Calculator, parent: '/' },
  '/expert': { label: 'Especialista IA', icon: Brain, parent: '/' },
  '/configuracoes': { label: 'Configurações', icon: Settings, parent: '/' },
  '/seguranca': { label: 'Segurança', icon: Shield, parent: '/' },
  '/alertas': { label: 'Alertas', icon: Bell, parent: '/' },
  '/aprovacoes': { label: 'Aprovações', icon: CheckCircle, parent: '/' },
  '/usuarios': { label: 'Usuários', icon: Users, parent: '/configuracoes' },
};

interface BreadcrumbItemData {
  path: string;
  label: string;
  icon: React.ElementType;
  isLast: boolean;
}

export function ContextualBreadcrumbs({ className }: { className?: string }) {
  const location = useLocation();
  
  const breadcrumbs = useMemo(() => {
    const items: BreadcrumbItemData[] = [];
    let currentPath = location.pathname;
    
    // Build breadcrumb chain from current route to root
    while (currentPath) {
      const config = routeConfig[currentPath];
      if (config) {
        items.unshift({
          path: currentPath,
          label: config.label,
          icon: config.icon,
          isLast: items.length === 0,
        });
        currentPath = config.parent || '';
      } else {
        // Handle dynamic routes or unknown routes
        break;
      }
    }
    
    // Always ensure home is first if not already
    if (items.length > 0 && items[0].path !== '/') {
      items.unshift({
        path: '/',
        label: 'Dashboard',
        icon: Home,
        isLast: false,
      });
    }
    
    return items;
  }, [location.pathname]);
  
  // Don't show breadcrumbs on home page
  if (location.pathname === '/' || breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mb-4", className)}
    >
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <BreadcrumbItem key={item.path}>
                {index > 0 && <BreadcrumbSeparator />}
                
                {item.isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link 
                      to={item.path}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </motion.div>
  );
}

export default ContextualBreadcrumbs;
