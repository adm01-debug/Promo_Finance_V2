import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  FileText,
  Download,
  Upload,
  Send,
  Receipt,
  DollarSign,
  Users,
  Building2,
  Settings,
  BarChart3,
  Calendar,
  CreditCard,
  Wallet,
  ArrowRight,
} from 'lucide-react';

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700',
    icon: 'text-gray-600 dark:text-gray-300',
    text: 'text-gray-900 dark:text-white',
  },
  primary: {
    bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-900 dark:text-blue-100',
  },
  success: {
    bg: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-900 dark:text-green-100',
  },
  warning: {
    bg: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-900 dark:text-amber-100',
  },
  danger: {
    bg: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-900 dark:text-red-100',
  },
};

export function QuickAction({
  icon,
  label,
  description,
  onClick,
  href,
  variant = 'default',
  disabled = false,
  className,
}: QuickActionProps) {
  const styles = variantStyles[variant];

  const content = (
    <>
      <div className={cn('p-2 rounded-lg', styles.icon)}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className={cn('font-medium text-sm', styles.text)}>{label}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </>
  );

  const baseClasses = cn(
    'flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
    styles.bg,
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  if (href && !disabled) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={baseClasses}>
      {content}
    </button>
  );
}

// Grid de ações rápidas
interface QuickActionsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function QuickActionsGrid({
  children,
  columns = 2,
  className,
}: QuickActionsGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Card container para ações rápidas
interface QuickActionsCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function QuickActionsCard({
  title = 'Ações Rápidas',
  children,
  className,
}: QuickActionsCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5',
        className
      )}
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

// Presets de ações financeiras
export function FinanceQuickActions({
  onNovaContaPagar,
  onNovaContaReceber,
  onNovoCliente,
  onNovoFornecedor,
  onExportarRelatorio,
  className,
}: {
  onNovaContaPagar?: () => void;
  onNovaContaReceber?: () => void;
  onNovoCliente?: () => void;
  onNovoFornecedor?: () => void;
  onExportarRelatorio?: () => void;
  className?: string;
}) {
  return (
    <QuickActionsCard className={className}>
      <QuickActionsGrid columns={2}>
        <QuickAction
          icon={<Receipt className="h-5 w-5" />}
          label="Nova Conta a Pagar"
          description="Registrar despesa"
          variant="danger"
          onClick={onNovaContaPagar}
        />
        <QuickAction
          icon={<DollarSign className="h-5 w-5" />}
          label="Nova Conta a Receber"
          description="Registrar receita"
          variant="success"
          onClick={onNovaContaReceber}
        />
        <QuickAction
          icon={<Users className="h-5 w-5" />}
          label="Novo Cliente"
          description="Cadastrar cliente"
          variant="primary"
          onClick={onNovoCliente}
        />
        <QuickAction
          icon={<Building2 className="h-5 w-5" />}
          label="Novo Fornecedor"
          description="Cadastrar fornecedor"
          variant="default"
          onClick={onNovoFornecedor}
        />
        <QuickAction
          icon={<BarChart3 className="h-5 w-5" />}
          label="Exportar Relatório"
          description="Gerar PDF/Excel"
          variant="warning"
          onClick={onExportarRelatorio}
        />
      </QuickActionsGrid>
    </QuickActionsCard>
  );
}

// Presets de links rápidos
export function NavigationQuickActions({
  className,
}: {
  className?: string;
}) {
  return (
    <QuickActionsCard title="Navegação Rápida" className={className}>
      <QuickActionsGrid columns={2}>
        <QuickAction
          icon={<Receipt className="h-5 w-5" />}
          label="Contas a Pagar"
          href="/contas-pagar"
          variant="default"
        />
        <QuickAction
          icon={<DollarSign className="h-5 w-5" />}
          label="Contas a Receber"
          href="/contas-receber"
          variant="default"
        />
        <QuickAction
          icon={<Users className="h-5 w-5" />}
          label="Clientes"
          href="/clientes"
          variant="default"
        />
        <QuickAction
          icon={<Building2 className="h-5 w-5" />}
          label="Fornecedores"
          href="/fornecedores"
          variant="default"
        />
        <QuickAction
          icon={<BarChart3 className="h-5 w-5" />}
          label="Relatórios"
          href="/relatorios"
          variant="default"
        />
        <QuickAction
          icon={<Settings className="h-5 w-5" />}
          label="Configurações"
          href="/configuracoes"
          variant="default"
        />
      </QuickActionsGrid>
    </QuickActionsCard>
  );
}

export default QuickAction;
