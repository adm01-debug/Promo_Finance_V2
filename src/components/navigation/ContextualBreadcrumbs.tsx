import React, { useMemo, forwardRef } from 'react';
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
  Landmark,
  ChevronRight,
} from 'lucide-react';
import { getRouteLabel, getRouteMeta, resolveParentRoute } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { BackButton } from './BackButton';

// Ícones por rota quando conhecidos; rotas sem mapeamento usam ChevronRight.
const iconByRoute: Record<string, React.ElementType> = {
  '/': Home,
  '/dashboard': Home,
  '/bi': BarChart3,
  '/fluxo-caixa': TrendingUp,
  '/contas-pagar': ArrowDownCircle,
  '/contas-receber': ArrowUpCircle,
  '/cobrancas': CreditCard,
  '/boletos': Receipt,
  '/conciliacao': CheckCircle,
  '/notas-fiscais': FileText,
  '/relatorios': BarChart3,
  '/demonstrativos': FileText,
  '/clientes': Users,
  '/fornecedores': Building2,
  '/empresas': Building2,
  '/centro-custos': PiggyBank,
  '/contas-bancarias': Landmark,
  '/pagamentos-recorrentes': Repeat,
  '/reforma-tributaria': Calculator,
  '/tributario': Calculator,
  '/expert': Brain,
  '/configuracoes': Settings,
  '/seguranca': Shield,
  '/alertas': Bell,
  '/aprovacoes': CheckCircle,
  '/usuarios': Users,
};

interface BreadcrumbItemData {
  path: string;
  label: string;
  icon: React.ElementType;
  isLast: boolean;
}

export const ContextualBreadcrumbs = forwardRef<HTMLDivElement, { className?: string }>(
  function ContextualBreadcrumbs({ className }, ref) {
    const location = useLocation();

    const breadcrumbs = useMemo(() => {
      const items: BreadcrumbItemData[] = [];
      let currentPath = location.pathname;
      const seen = new Set<string>();

      // Sobe a cadeia de pais derivada dos metadados de rota (cobre todas
      // as ~128 rotas, inclusive subseções de /tributario e /admin).
      while (currentPath && !seen.has(currentPath)) {
        seen.add(currentPath);
        const meta = getRouteMeta(currentPath);
        if (!meta) {
          // Rota sem metadados: sobe por segmento até achar um conhecido.
          const parent = resolveParentRoute(currentPath);
          currentPath = parent === currentPath ? '' : parent;
          continue;
        }
        items.unshift({
          path: currentPath,
          label: meta.label,
          icon: iconByRoute[currentPath] ?? ChevronRight,
          isLast: items.length === 0,
        });
        currentPath = resolveParentRoute(currentPath);
        if (currentPath === items[0]?.path) break;
      }

      // A página atual sempre aparece por último, mesmo sem metadados
      // (getRouteLabel cai para o segmento humanizado).
      if (items[items.length - 1]?.path !== location.pathname) {
        items.push({
          path: location.pathname,
          label: getRouteLabel(location.pathname),
          icon: ChevronRight,
          isLast: false,
        });
      }

      if (items.length > 0 && items[0].path !== '/') {
        items.unshift({ path: '/', label: 'Dashboard', icon: Home, isLast: false });
      }

      // isLast marca só o item final (a página atual).
      items.forEach((item, idx) => {
        item.isLast = idx === items.length - 1;
      });

      return items;
    }, [location.pathname]);

    // Don't show breadcrumbs on home page (inclui o alias /dashboard)
    if (
      location.pathname === '/' ||
      location.pathname === '/dashboard' ||
      breadcrumbs.length <= 1
    ) {
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'mb-6 flex items-center gap-4 px-4 py-2 rounded-lg bg-card border border-border shadow-sm',
          className
        )}
        ref={ref}
      >
        {/* Back Button integrated with breadcrumbs */}
        <BackButton size="sm" variant="ghost" className="shrink-0" />

        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const Icon = item.icon;

              return (
                <React.Fragment key={item.path}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
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
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>
    );
  }
);

export default ContextualBreadcrumbs;
