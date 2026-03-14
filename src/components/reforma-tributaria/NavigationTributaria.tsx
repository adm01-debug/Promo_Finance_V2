// ============================================
// NAVEGAÇÃO HIERÁRQUICA - REFORMA TRIBUTÁRIA
// Mega menu com grupos lógicos
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calculator, FileText, Shield, BarChart3, 
  Settings, ChevronDown, ChevronRight, Zap, TrendingUp,
  Receipt, Clock, AlertTriangle, Download, Scale, Wallet,
  FileUp, Gift, CheckCircle, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    color: 'text-primary',
    items: [
      { id: 'visao-geral', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'metricas', label: 'Métricas', icon: BarChart3 },
      { id: 'cronograma', label: 'Cronograma', icon: Calendar },
    ]
  },
  {
    id: 'operacional',
    label: 'Operacional',
    icon: Calculator,
    color: 'text-secondary',
    items: [
      { id: 'apuracao', label: 'Apuração IBS/CBS', icon: Calculator },
      { id: 'operacoes', label: 'Operações', icon: FileText },
      { id: 'creditos', label: 'Créditos', icon: TrendingUp },
      { id: 'retencoes', label: 'Retenções', icon: Receipt },
      { id: 'irpj-csll', label: 'IRPJ/CSLL', icon: FileText },
    ]
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: Shield,
    color: 'text-emerald-500',
    items: [
      { id: 'obrigacoes', label: 'Obrigações', icon: Clock, badge: '3', badgeVariant: 'destructive' },
      { id: 'auditoria', label: 'Auditoria', icon: Shield },
      { id: 'conciliacao', label: 'Conciliação', icon: CheckCircle },
      { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
    ]
  },
  {
    id: 'simuladores',
    label: 'Simuladores',
    icon: Zap,
    color: 'text-amber-500',
    items: [
      { id: 'calculadora', label: 'Calculadora', icon: Calculator },
      { id: 'simulador', label: 'Cenários', icon: Zap },
      { id: 'comparativo', label: 'Comparativo', icon: Scale },
      { id: 'cashback', label: 'Cashback', icon: Wallet },
    ]
  },
  {
    id: 'exportacao',
    label: 'Exportação',
    icon: Download,
    color: 'text-purple-500',
    items: [
      { id: 'exportacao', label: 'SPED', icon: Download },
      { id: 'per-dcomp', label: 'PER/DCOMP', icon: FileText },
      { id: 'split-payment', label: 'Split Payment', icon: Zap },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    ]
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Settings,
    color: 'text-muted-foreground',
    items: [
      { id: 'incentivos', label: 'Incentivos Fiscais', icon: Gift },
      { id: 'importacao-xml', label: 'Importar XML', icon: FileUp },
    ]
  },
];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function NavigationTributaria({ activeTab, onTabChange }: Props) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => {
    // Encontra o grupo que contém a aba ativa
    for (const group of NAV_GROUPS) {
      if (group.items.some(item => item.id === activeTab)) {
        return group.id;
      }
    }
    return 'overview';
  });

  const handleGroupClick = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  const getActiveGroup = () => {
    for (const group of NAV_GROUPS) {
      if (group.items.some(item => item.id === activeTab)) {
        return group.id;
      }
    }
    return null;
  };

  const activeGroupId = getActiveGroup();

  return (
    <div className="bg-card border rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-sm">
      {/* Desktop: Horizontal navigation */}
      <div className="hidden lg:flex items-center gap-0.5 sm:gap-1 flex-wrap">
        {NAV_GROUPS.map((group) => {
          const isActive = activeGroupId === group.id;
          const isExpanded = expandedGroup === group.id;
          const Icon = group.icon;

          return (
            <div key={group.id} className="relative">
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 transition-all duration-200",
                  isActive && "shadow-md"
                )}
                onClick={() => handleGroupClick(group.id)}
              >
                <Icon className={cn("h-4 w-4", !isActive && group.color)} />
                <span>{group.label}</span>
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </Button>

              {/* Dropdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-popover border rounded-lg shadow-lg p-1"
                  >
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isItemActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.id);
                            setExpandedGroup(null);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                            isItemActive 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-muted"
                          )}
                        >
                          <ItemIcon className="h-4 w-4" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full font-medium",
                              item.badgeVariant === 'destructive' 
                                ? "bg-destructive text-destructive-foreground" 
                                : "bg-secondary text-secondary-foreground"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Mobile: Collapsible accordion */}
      <div className="lg:hidden space-y-0.5 sm:space-y-1">
        {NAV_GROUPS.map((group) => {
          const isActive = activeGroupId === group.id;
          const isExpanded = expandedGroup === group.id;
          const Icon = group.icon;

          return (
            <div key={group.id}>
              <button
                onClick={() => handleGroupClick(group.id)}
                className={cn(
                  "w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[40px]",
                  isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0", group.color)} />
                <span className="flex-1 text-left truncate">{group.label}</span>
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 flex-shrink-0",
                  isExpanded && "rotate-90"
                )} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 sm:pl-6 py-1 space-y-0.5">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isItemActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                              "w-full flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition-colors min-h-[36px]",
                              isItemActive 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-muted text-muted-foreground"
                            )}
                          >
                            <ItemIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.badge && (
                              <span className={cn(
                                "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                                item.badgeVariant === 'destructive' 
                                  ? "bg-destructive text-destructive-foreground" 
                                  : "bg-secondary text-secondary-foreground"
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NavigationTributaria;
