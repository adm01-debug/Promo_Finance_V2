/**
 * Enhanced Empty State Component
 * 
 * Componente visual para estados vazios com ilustrações,
 * animações e CTAs contextuais
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Plus, ArrowRight, Sparkles, FileQuestion, Search, Database, Inbox, FolderOpen, Users, FileText, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Ilustrações SVG minimalistas
const illustrations = {
  empty: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" className="fill-muted/30" />
      <circle cx="100" cy="100" r="60" className="fill-muted/50" />
      <path d="M70 90 L100 120 L130 90" className="stroke-muted-foreground/50" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="85" cy="75" r="5" className="fill-muted-foreground/50" />
      <circle cx="115" cy="75" r="5" className="fill-muted-foreground/50" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="90" r="50" className="stroke-muted-foreground/30" strokeWidth="8" />
      <line x1="125" y1="125" x2="160" y2="160" className="stroke-muted-foreground/30" strokeWidth="8" strokeLinecap="round" />
      <circle cx="90" cy="90" r="30" className="fill-muted/30" />
      <path d="M75 90 Q90 75, 105 90" className="stroke-muted-foreground/40" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="120" width="30" height="50" rx="4" className="fill-primary/20" />
      <rect x="70" y="90" width="30" height="80" rx="4" className="fill-primary/30" />
      <rect x="110" y="60" width="30" height="110" rx="4" className="fill-primary/40" />
      <rect x="150" y="40" width="30" height="130" rx="4" className="fill-primary/50" />
      <path d="M30 100 Q80 60, 130 80 T180 40" className="stroke-primary" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="180" cy="40" r="8" className="fill-primary" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="30" width="100" height="140" rx="8" className="fill-muted/30 stroke-muted-foreground/30" strokeWidth="2" />
      <rect x="60" y="50" width="60" height="8" rx="2" className="fill-muted-foreground/30" />
      <rect x="60" y="70" width="80" height="6" rx="2" className="fill-muted-foreground/20" />
      <rect x="60" y="85" width="80" height="6" rx="2" className="fill-muted-foreground/20" />
      <rect x="60" y="100" width="50" height="6" rx="2" className="fill-muted-foreground/20" />
      <circle cx="140" cy="140" r="25" className="fill-primary/20 stroke-primary" strokeWidth="2" />
      <path d="M130 140 L138 148 L152 132" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="70" r="30" className="fill-muted/50" />
      <circle cx="100" cy="70" r="20" className="fill-muted-foreground/20" />
      <path d="M50 160 Q50 120, 100 120 Q150 120, 150 160" className="fill-muted/50" />
      <circle cx="55" cy="85" r="18" className="fill-muted/30" />
      <circle cx="145" cy="85" r="18" className="fill-muted/30" />
    </svg>
  ),
};

export type EmptyStateVariant = 'default' | 'search' | 'finance' | 'documents' | 'users' | 'custom';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

interface EnhancedEmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title: string;
  description?: string;
  tip?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  showIllustration?: boolean;
  customIllustration?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'py-8 px-4',
    illustration: 'w-24 h-24',
    title: 'text-base',
    description: 'text-sm max-w-xs',
    icon: 'h-10 w-10',
  },
  md: {
    container: 'py-12 px-6',
    illustration: 'w-32 h-32',
    title: 'text-lg',
    description: 'text-sm max-w-sm',
    icon: 'h-12 w-12',
  },
  lg: {
    container: 'py-16 px-8',
    illustration: 'w-40 h-40',
    title: 'text-xl',
    description: 'text-base max-w-md',
    icon: 'h-16 w-16',
  },
};

export function EnhancedEmptyState({
  variant = 'default',
  icon: Icon,
  title,
  description,
  tip,
  primaryAction,
  secondaryAction,
  showIllustration = true,
  customIllustration,
  className,
  size = 'md',
}: EnhancedEmptyStateProps) {
  const config = sizeConfig[size];
  const illustration = customIllustration || illustrations[variant === 'custom' ? 'empty' : variant] || illustrations.empty;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.container,
        className
      )}
    >
      {/* Ilustração ou Ícone */}
      {showIllustration ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className={cn('mb-6', config.illustration)}
        >
          {illustration}
        </motion.div>
      ) : Icon ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className={cn(
            'mb-6 flex items-center justify-center rounded-full bg-muted/50 p-4',
          )}
        >
          <Icon className={cn('text-muted-foreground', config.icon)} />
        </motion.div>
      ) : null}

      {/* Título */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn('font-semibold text-foreground', config.title)}
      >
        {title}
      </motion.h3>

      {/* Descrição */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn('mt-2 text-muted-foreground', config.description)}
        >
          {description}
        </motion.p>
      )}

      {/* Dica */}
      {tip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2 text-sm"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{tip}</span>
        </motion.div>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          {primaryAction && (
            <Button onClick={primaryAction.onClick} variant={primaryAction.variant || 'default'}>
              {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant={secondaryAction.variant || 'outline'}>
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />}
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Presets para casos comuns
export const emptyStatePresets = {
  noData: {
    variant: 'default' as const,
    title: 'Nenhum dado encontrado',
    description: 'Não há registros para exibir no momento.',
  },
  noSearchResults: {
    variant: 'search' as const,
    title: 'Nenhum resultado',
    description: 'Tente ajustar os filtros ou buscar por outro termo.',
  },
  noTransactions: {
    variant: 'finance' as const,
    title: 'Sem transações',
    description: 'Comece adicionando sua primeira transação financeira.',
    tip: 'Você pode importar transações de um arquivo CSV ou OFX',
  },
  noDocuments: {
    variant: 'documents' as const,
    title: 'Nenhum documento',
    description: 'Seus documentos fiscais aparecerão aqui.',
  },
  noClients: {
    variant: 'users' as const,
    title: 'Nenhum cliente cadastrado',
    description: 'Adicione seus clientes para gerenciar suas contas a receber.',
    tip: 'Clientes podem ser importados do Bitrix24',
  },
  noSuppliers: {
    variant: 'users' as const,
    title: 'Nenhum fornecedor cadastrado',
    description: 'Cadastre seus fornecedores para organizar suas despesas.',
  },
  noAccountsReceivable: {
    variant: 'finance' as const,
    title: 'Nenhuma conta a receber',
    description: 'Registre suas receitas e cobranças aqui.',
    primaryAction: {
      label: 'Nova Conta a Receber',
      icon: Plus,
    },
  },
  noAccountsPayable: {
    variant: 'finance' as const,
    title: 'Nenhuma conta a pagar',
    description: 'Registre suas despesas e pagamentos aqui.',
    primaryAction: {
      label: 'Nova Conta a Pagar',
      icon: Plus,
    },
  },
  noBankAccounts: {
    variant: 'finance' as const,
    title: 'Nenhuma conta bancária',
    description: 'Cadastre suas contas para acompanhar saldos e movimentações.',
    primaryAction: {
      label: 'Adicionar Conta',
      icon: Plus,
    },
  },
  noReports: {
    variant: 'documents' as const,
    title: 'Nenhum relatório gerado',
    description: 'Gere relatórios financeiros para análise.',
    primaryAction: {
      label: 'Gerar Relatório',
      icon: FileText,
    },
  },
  noAlerts: {
    variant: 'default' as const,
    title: 'Tudo em ordem!',
    description: 'Não há alertas pendentes no momento.',
    icon: Sparkles,
  },
  connectionError: {
    variant: 'default' as const,
    title: 'Erro de conexão',
    description: 'Não foi possível carregar os dados. Verifique sua conexão.',
    primaryAction: {
      label: 'Tentar novamente',
      icon: ArrowRight,
    },
  },
};

// Helper component for common use cases
interface QuickEmptyStateProps {
  preset: keyof typeof emptyStatePresets;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QuickEmptyState({ 
  preset, 
  onPrimaryAction, 
  onSecondaryAction,
  size = 'md',
  className,
}: QuickEmptyStateProps) {
  const config = emptyStatePresets[preset] as any;
  
  return (
    <EnhancedEmptyState
      {...config}
      primaryAction={config.primaryAction && onPrimaryAction ? {
        ...config.primaryAction,
        onClick: onPrimaryAction,
      } : undefined}
      secondaryAction={onSecondaryAction ? {
        label: 'Ver ajuda',
        onClick: onSecondaryAction,
        variant: 'ghost',
      } : undefined}
      size={size}
      className={className}
    />
  );
}
