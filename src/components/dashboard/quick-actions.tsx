import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Plus, FileText, Download, Upload, Send, Receipt, DollarSign, Users, Building2, Settings, BarChart3, Calendar, CreditCard, Wallet, ArrowRight } from 'lucide-react';

interface QuickActionProps {
  icon: ReactNode; label: string; description?: string; onClick?: () => void;
  href?: string; variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  disabled?: boolean; className?: string;
}

const variantStyles = {
  default: { bg: 'bg-muted hover:bg-muted/80', icon: 'text-muted-foreground', text: 'text-foreground' },
  primary: { bg: 'bg-secondary/10 hover:bg-secondary/20', icon: 'text-secondary', text: 'text-secondary' },
  success: { bg: 'bg-success/10 hover:bg-success/20', icon: 'text-success', text: 'text-success' },
  warning: { bg: 'bg-warning/10 hover:bg-warning/20', icon: 'text-warning', text: 'text-warning' },
  danger: { bg: 'bg-destructive/10 hover:bg-destructive/20', icon: 'text-destructive', text: 'text-destructive' },
};

export function QuickAction({ icon, label, description, onClick, href, variant = 'default', disabled = false, className }: QuickActionProps) {
  const styles = variantStyles[variant];
  const content = (
    <>
      <div className={cn('p-2 rounded-lg', styles.icon)}>{icon}</div>
      <div className="flex-1 text-left">
        <p className={cn('font-medium text-sm', styles.text)}>{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </>
  );

  const baseClasses = cn('flex items-center gap-3 p-3 rounded-xl transition-all duration-200', styles.bg, disabled && 'opacity-50 cursor-not-allowed', className);

  if (href && !disabled) return <a href={href} className={baseClasses}>{content}</a>;
  return <button onClick={onClick} disabled={disabled} className={baseClasses}>{content}</button>;
}

export function QuickActionsGrid({ children, columns = 2, className }: { children: ReactNode; columns?: 1 | 2 | 3; className?: string }) {
  const gridCols = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' };
  return <div className={cn('grid gap-3', gridCols[columns], className)}>{children}</div>;
}

export function QuickActionsCard({ title = 'Ações Rápidas', children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-5', className)}>
      <h3 className="font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

export function FinanceQuickActions({ onNovaContaPagar, onNovaContaReceber, onNovoCliente, onNovoFornecedor, onExportarRelatorio, className }: {
  onNovaContaPagar?: () => void; onNovaContaReceber?: () => void; onNovoCliente?: () => void;
  onNovoFornecedor?: () => void; onExportarRelatorio?: () => void; className?: string;
}) {
  return (
    <QuickActionsCard className={className}>
      <QuickActionsGrid columns={2}>
        <QuickAction icon={<Receipt className="h-5 w-5" />} label="Nova Conta a Pagar" description="Registrar despesa" variant="danger" onClick={onNovaContaPagar} />
        <QuickAction icon={<DollarSign className="h-5 w-5" />} label="Nova Conta a Receber" description="Registrar receita" variant="success" onClick={onNovaContaReceber} />
        <QuickAction icon={<Users className="h-5 w-5" />} label="Novo Cliente" description="Cadastrar cliente" variant="primary" onClick={onNovoCliente} />
        <QuickAction icon={<Building2 className="h-5 w-5" />} label="Novo Fornecedor" description="Cadastrar fornecedor" variant="default" onClick={onNovoFornecedor} />
        <QuickAction icon={<BarChart3 className="h-5 w-5" />} label="Exportar Relatório" description="Gerar PDF/Excel" variant="warning" onClick={onExportarRelatorio} />
      </QuickActionsGrid>
    </QuickActionsCard>
  );
}

export function NavigationQuickActions({ className }: { className?: string }) {
  return (
    <QuickActionsCard title="Navegação Rápida" className={className}>
      <QuickActionsGrid columns={2}>
        <QuickAction icon={<Receipt className="h-5 w-5" />} label="Contas a Pagar" href="/contas-pagar" />
        <QuickAction icon={<DollarSign className="h-5 w-5" />} label="Contas a Receber" href="/contas-receber" />
        <QuickAction icon={<Users className="h-5 w-5" />} label="Clientes" href="/clientes" />
        <QuickAction icon={<Building2 className="h-5 w-5" />} label="Fornecedores" href="/fornecedores" />
        <QuickAction icon={<BarChart3 className="h-5 w-5" />} label="Relatórios" href="/relatorios" />
        <QuickAction icon={<Settings className="h-5 w-5" />} label="Configurações" href="/configuracoes" />
      </QuickActionsGrid>
    </QuickActionsCard>
  );
}

export default QuickAction;
