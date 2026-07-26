import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  FileText,
  PieChart,
  Palette,
  Globe,
  Bell,
  Settings,
  Settings2,
  ChevronDown,
  ShoppingCart,
  Key,
  Building2,
  CreditCard,
  BarChart3,
  Receipt,
  Beaker,
  RefreshCcw,
  Users,
  Zap,
  ScrollText,
  User,
  Truck,
  Factory,
  FileSpreadsheet,
  ShieldCheck,
  Bot,
  Shield,
  Scale,
  Sparkles,
  Wallet,
  UserCog,
  FileSignature,
  Calculator,
  Camera,
  ArrowLeftRight,
  FileCheck,
  BookOpen,
  Target,
  Brain,
  BrainCircuit,
  ShieldAlert,
  MessageSquare,
  Tag,
  Code2,
  ClipboardCheck,
  CalendarCheck,
} from 'lucide-react';


import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';
import { useAlertasNaoLidos } from '@/hooks/useAlertas';
import { useAlertasTributariosCount } from '@/hooks/useAlertasTributariosCount';
import { useRealtimeAlertas } from '@/hooks/useRealtimeAlertas';
import { useRealtimeAnomalias } from '@/hooks/useRealtimeAnomalias';
import { useWhatsAppUnreadCount } from '@/hooks/useWhatsAppUnreadCount';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';


interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  badgeKey?: string;
  highlight?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Define navigation groups - Consolidado para 5 grupos (melhor UX)
const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { label: 'Dashboard Executivo', icon: LayoutDashboard, href: '/' },
      { label: 'Dashboard Empresa', icon: Building2, href: '/dashboard-empresa' },
      { label: 'BI Gestão Estratégica', icon: BarChart3, href: '/bi', highlight: true },
      { label: 'Inteligência Operacional 360°', icon: BrainCircuit, href: '/inteligencia', highlight: true },
      { label: 'Action Matrix Audit', icon: ClipboardCheck, href: '/inteligencia', highlight: true },
      { label: 'Benchmarking Setorial', icon: Scale, href: '/benchmarking', highlight: true },
      { label: 'EXPERT IA Financeira', icon: Bot, href: '/expert', highlight: true },
      { label: 'Alertas do Sistema', icon: Bell, href: '/alertas', badgeKey: 'alertas' },
    ],
  },

  {
    id: 'financial',
    label: 'Financeiro',
    icon: Wallet,
    defaultOpen: true,
    items: [
      { label: 'Visão Geral Financeira', icon: LayoutDashboard, href: '/financeiro', highlight: true },
      { label: 'Contas a Pagar', icon: ArrowUpCircle, href: '/contas-pagar' },
      { label: 'Contas a Receber', icon: ArrowDownCircle, href: '/contas-receber' },
      { label: 'Movimentações', icon: ArrowLeftRight, href: '/movimentacoes' },
      { label: 'Conciliação', icon: RefreshCcw, href: '/conciliacao' },
      { label: 'Cobrança Elite', icon: Receipt, href: '/cobrancas' },
      { label: 'Fluxo de Caixa', icon: BarChart3, href: '/fluxo-caixa' },
      { label: 'Tesouraria Multi-CNPJ', icon: Landmark, href: '/tesouraria' },
      { label: 'Simulador Antecipação', icon: Calculator, href: '/simulador-antecipacao' },
      { label: 'Asaas Pagamentos', icon: CreditCard, href: '/asaas', highlight: true },
      { label: 'Auditoria de Duplicidade', icon: ShieldAlert, href: '/contas-pagar/bloqueios', highlight: true },
      { label: 'Metas Financeiras', icon: Target, href: '/metas', highlight: true },
      { label: 'Orçamentos', icon: Scale, href: '/orcamentos', highlight: true },
      { label: 'Quantum-Sentinel: Riscos', icon: Brain, href: '/inteligencia#alertas-preditivos', highlight: true },
      { label: 'Gestão de Compras', icon: ShoppingCart, href: '/compras', highlight: true },
      { label: 'Gestão Logística', icon: Truck, href: '/logistica', highlight: true },

    ],
  },
  {
    id: 'fiscal',
    label: 'Fiscal & Documentos',
    icon: FileText,
    items: [
      { label: 'Quantum-Sentinel: Tributário', icon: Scale, href: '/tributario/dashboard', highlight: true, badgeKey: 'tributario' },
      { label: 'Reforma Tributária', icon: Scale, href: '/reforma-tributaria/visao-geral' },
      { label: 'Split Payment', icon: ArrowLeftRight, href: '/tributario/split-payment' },
      { label: 'Conciliação Tributária', icon: RefreshCcw, href: '/tributario/conciliacao' },
      { label: 'Incentivos Fiscais', icon: Zap, href: '/tributario/incentivos' },
      { label: 'Compliance & Auditoria', icon: ShieldCheck, href: '/tributario/auditoria' },
      { label: 'Comparativo Regimes', icon: Scale, href: '/tributario/comparativo' },
      { label: 'Cashback Simulador', icon: Wallet, href: '/tributario/cashback' },
      { label: 'Importação XML', icon: FileSpreadsheet, href: '/tributario/importacao-xml' },
      { label: 'Exportação SPED', icon: BookOpen, href: '/tributario/sped' },
      { label: 'Relatórios Contábeis', icon: FileSpreadsheet, href: '/tributario/relatorios-contabeis' },
      { label: 'PER/DCOMP', icon: FileText, href: '/tributario/per-dcomp' },
      { label: 'Retenções na Fonte', icon: Receipt, href: '/tributario/retencoes' },
      { label: 'Monofásico PIS/COFINS', icon: Beaker, href: '/tributario/monofasico' },
      { label: 'Encargos de Folha (RAT/FAP)', icon: Users, href: '/tributario/folha-encargos' },
      { label: 'ICMS-ST e DIFAL', icon: Truck, href: '/tributario/icms-st' },
      { label: 'IPI e ISS', icon: Factory, href: '/tributario/ipi-iss' },
      { label: 'PIS/COFINS (créditos)', icon: Receipt, href: '/tributario/pis-cofins' },
      { label: 'IRPJ/CSLL (Lucro Real)', icon: Landmark, href: '/tributario/irpj-csll' },
      { label: 'DARF Consolidado', icon: Receipt, href: '/tributario/darf' },
      { label: 'Obrigações Acessórias', icon: CalendarCheck, href: '/tributario/obrigacoes' },
      { label: 'Comparativo de Conformidade', icon: BarChart3, href: '/tributario/comparativo-conformidade' },
      { label: 'Preferências do Resumo', icon: BarChart3, href: '/tributario/preferencias-digest' },

      { label: 'Fechamento Mensal', icon: FileCheck, href: '/tributario/fechamento-mensal', highlight: true },
      { label: 'Relatórios & BI', icon: FileText, href: '/relatorios', highlight: true },
      { label: 'Relatórios de Entregas', icon: FileText, href: '/relatorios/entregas', highlight: true },
      { label: 'Simulação de Regimes', icon: Calculator, href: '/tributario/simulacao-regimes', highlight: true },
      { label: 'Oportunidades de Elisão', icon: Sparkles, href: '/tributario/oportunidades-elisao', highlight: true },
      { label: 'Projeção 2026-2033', icon: BarChart3, href: '/tributario/projecao-reforma', highlight: true },
      { label: 'Histórico Tributário', icon: FileSpreadsheet, href: '/tributario/historico-financeiro' },
      { label: 'Certificados Digitais A1', icon: ShieldCheck, href: '/tributario/certificados-digitais', highlight: true },
      { label: 'NF-e Recebidas (SEFAZ)', icon: FileText, href: '/tributario/nfe-recebidas', highlight: true },
      { label: 'Observabilidade SEFAZ', icon: Activity, href: '/tributario/sefaz-observabilidade' },
      { label: 'Notas Fiscais', icon: FileText, href: '/notas-fiscais' },
      { label: 'Demonstrativos', icon: FileSpreadsheet, href: '/demonstrativos' },
      { label: 'Contabilidade & SPED', icon: BookOpen, href: '/contabilidade' },
      { label: 'Contratos', icon: FileCheck, href: '/contratos' },
      { label: 'Assinatura Digital', icon: FileSignature, href: '/assinatura-digital' },
      { label: 'Comprovante OCR', icon: Camera, href: '/comprovante-ocr' },
      { label: 'Cofre de Integridade', icon: ShieldCheck, href: '/contas-pagar/bloqueios', highlight: true },
    ],
  },
  {
    id: 'records',
    label: 'Cadastros',
    icon: Users,
    items: [
      { label: 'Gestão de Clientes', icon: User, href: '/clientes' },
      { label: 'Histórico & Chat WA', icon: MessageSquare, href: '/cobrancas#whatsapp', badgeKey: 'whatsapp', highlight: true },
      { label: 'Scoring de Crédito & Risco', icon: Target, href: '/clientes/scoring', highlight: true },
      { label: 'Portal de Tokens API', icon: Key, href: '/clientes/portal-tokens' },
      { label: 'Gestão de Fornecedores', icon: Truck, href: '/fornecedores' },
      { label: 'Gestão de Vendedores', icon: UserCog, href: '/vendedores' },
      { label: 'Empresas (Multicnpj)', icon: Building2, href: '/empresas' },
      { label: 'Gestão de Contas Bancárias', icon: Landmark, href: '/contas-bancarias' },
      { label: 'Centros de Custo', icon: PieChart, href: '/centro-custos' },
      { label: 'Categorias de Lançamento', icon: Tag, href: '/categorias' },
      { label: 'Orçamento vs Realizado', icon: Scale, href: '/orcamento-evento', highlight: true },
      { label: 'Área de Gestão de Boletos', icon: FileText, href: '/boletos', highlight: true },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: ShieldCheck,
    items: [
      { label: 'Aprovações', icon: ShieldCheck, href: '/aprovacoes', badgeKey: 'aprovacoes' },
      { label: 'Segurança', icon: Shield, href: '/seguranca', highlight: true },
      { label: 'Logs de Auditoria', icon: ScrollText, href: '/audit-logs' },
      { label: 'Eventos JIT (SSO)', icon: ShieldCheck, href: '/admin/sso-jit-events' },
      { label: 'Privacidade & LGPD', icon: Shield, href: '/configuracoes/privacidade', highlight: true },
      { label: 'Usuários', icon: UserCog, href: '/usuarios' },
      { label: 'Integrações Hub', icon: Zap, href: '/integracoes', highlight: true },
      { label: 'Portal do Cliente', icon: Globe, href: '/portal-cliente', highlight: true },
      { label: 'Configurações', icon: Settings, href: '/configuracoes' },
      { label: 'Preferências', icon: Settings2, href: '/configuracoes/preferencias' },
      { label: 'Meu Perfil', icon: User, href: '/meu-perfil' },
      { label: 'Guia de Estilo', icon: Palette, href: '/style-guide', highlight: true },
      { label: 'API & Integrações', icon: Code2, href: '/admin/api', highlight: true },
      { label: 'Campos Customizados', icon: Settings2, href: '/admin/campos-customizados', highlight: true },

    ],
  },


];

interface SidebarNavGroupsProps {
  collapsed: boolean;
}

export const SidebarNavGroups = ({ collapsed }: SidebarNavGroupsProps) => {
  const location = useLocation();
  const { t } = useTranslation();

  const { count: aprovacoesPendentes } = useAprovacoesPendentesCount();
  const { data: alertasNaoLidos = 0 } = useAlertasNaoLidos();
  const { data: alertasTributarios = 0 } = useAlertasTributariosCount();
  const { data: whatsappUnread = 0 } = useWhatsAppUnreadCount();
  const { user } = useAuth();

  useRealtimeAlertas();
  useRealtimeAnomalias();

  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach(group => {
      // Open group if it contains current route or is defaultOpen
      const hasActiveItem = group.items.some(item => item.href === location.pathname);
      initial[group.id] = hasActiveItem || !!group.defaultOpen;
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    if (collapsed) return; // Don't toggle when collapsed
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Get badge count for item
  const getBadgeCount = (badgeKey?: string): number | undefined => {
    if (badgeKey === 'aprovacoes' && aprovacoesPendentes > 0) {
      return aprovacoesPendentes;
    }
    if (badgeKey === 'alertas' && alertasNaoLidos > 0) {
      return alertasNaoLidos;
    }
    if (badgeKey === 'tributario' && alertasTributarios > 0) {
      return alertasTributarios;
    }
    if (badgeKey === 'whatsapp' && (whatsappUnread > 0 || localStorage.getItem(`whatsapp-unread-manual-${user?.id}`) === 'true')) {
      return whatsappUnread || 1;
    }
    return undefined;
  };

  // Check if group has active item
  const groupHasActiveItem = (group: NavGroup): boolean => {
    return group.items.some(item => location.pathname === item.href);
  };

  // Render nav item
  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    const badge = getBadgeCount(item.badgeKey);

    const content = (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative text-[13px] font-medium tracking-tight',
          isActive
            ? 'active-nav-item'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] flex-shrink-0 transition-all duration-300',
            isActive ? 'text-primary scale-110' : 'group-hover:text-foreground'
          )}
        />
        {!collapsed && (
          <span className="flex-1 whitespace-nowrap overflow-hidden">
            {t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label)}
          </span>
        )}
        {badge && !collapsed && (
          <Badge
            variant={item.highlight ? "default" : "secondary"}
            className={cn(
              "ml-auto text-[10px] h-5 px-1.5 font-bold tabular-nums",
              item.highlight && "bg-primary text-primary-foreground border-none shadow-sm"
            )}
          >
            {badge}
          </Badge>
        )}
        {item.highlight && !collapsed && !badge && (
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            {t(item.label.toLowerCase().replace(/\s+/g, '_'), item.label)}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
      {navGroups.map(group => {
        const GroupIcon = group.icon;
        const isOpen = openGroups[group.id];
        const hasActive = groupHasActiveItem(group);
        const translatedGroupLabel = t(group.id, group.label);

        return (
          <div key={group.id} className="space-y-1">
            {/* Group Header */}
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'w-full flex items-center justify-center p-2 rounded-lg transition-colors',
                      hasActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <GroupIcon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {translatedGroupLabel}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors group mt-2 first:mt-0',
                  hasActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded border border-border transition-colors",
                    hasActive ? "bg-accent text-primary" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}>
                    <GroupIcon className="h-4 w-4" />
                  </div>
                  <span>{translatedGroupLabel}</span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200 opacity-50',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
            )}

            {/* Group Items */}
            {!collapsed && (
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pl-3 space-y-0.5 mt-1 transition-all">
                      {group.items.map(item => (
                        <NavItemComponent key={item.href} item={item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Collapsed state - show items in tooltip */}
            {collapsed && (
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItemComponent key={item.href} item={item} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
