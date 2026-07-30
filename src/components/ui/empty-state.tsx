import { LucideIcon, Search, FileX, Inbox, FolderOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact' | 'card' | 'inline';
  illustration?: 'search' | 'empty' | 'error' | 'folder' | 'inbox' | 'none';
}

// Animated illustrations
function EmptyIllustration({ type }: { type: string }) {
  const illustrations: Record<string, React.ReactNode> = {
    search: (
      <motion.div 
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, 0],
            y: [0, -5, 0]
          }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary/20"
          />
        </motion.div>
      </motion.div>
    ),
    empty: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center rotate-3">
            <FileX className="h-8 w-8 text-muted-foreground" />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-muted"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -top-1 -left-2 h-2 w-2 rounded-full bg-muted"
          />
        </motion.div>
      </motion.div>
    ),
    error: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </motion.div>
      </motion.div>
    ),
    folder: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <motion.div
          animate={{ rotateY: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          style={{ perspective: 100 }}
        >
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-warning" />
          </div>
        </motion.div>
      </motion.div>
    ),
    inbox: (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Inbox className="h-8 w-8 text-primary" />
          </div>
        </motion.div>
      </motion.div>
    ),
  };

  return illustrations[type] || illustrations.empty;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  secondaryAction,
  className,
  variant = 'default',
  illustration = 'none'
}: EmptyStateProps) {
  
  if (variant === 'inline') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-dashed",
          className
        )}
      >
        {Icon && <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action && (
          <Button 
            size="sm" 
            variant={action.variant || 'ghost'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex flex-col items-center justify-center py-8 px-4 text-center", className)}
      >
        {Icon && (
          <div className="mb-3 p-2 rounded-full bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{description}</p>
        )}
        {action && (
          <Button 
            size="sm" 
            variant={action.variant || 'outline'}
            onClick={action.onClick} 
            className="mt-3"
          >
            {action.label}
          </Button>
        )}
      </motion.div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-6 text-center rounded-xl border bg-card/50",
          className
        )}
      >
        {illustration !== 'none' ? (
          <EmptyIllustration type={illustration} />
        ) : Icon && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="p-4 rounded-full bg-muted"
          >
            <Icon className="h-8 w-8 text-muted-foreground" />
          </motion.div>
        )}
        
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 text-lg font-semibold text-foreground"
        >
          {title}
        </motion.h3>
        
        {description && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm text-muted-foreground max-w-sm"
          >
            {description}
          </motion.p>
        )}
        
        {(action || secondaryAction) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-3 mt-6"
          >
            {action && (
              <Button onClick={action.onClick} variant={action.variant || 'default'}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="ghost" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
    >
      {illustration !== 'none' ? (
        <EmptyIllustration type={illustration} />
      ) : Icon && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted"
        >
          <Icon className="h-8 w-8 text-muted-foreground" />
        </motion.div>
      )}
      
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4 text-lg font-semibold text-foreground"
      >
        {title}
      </motion.h3>
      
      {description && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-sm text-muted-foreground max-w-sm"
        >
          {description}
        </motion.p>
      )}
      
      {(action || secondaryAction) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3 mt-6"
        >
          {action && (
            <Button onClick={action.onClick} variant={action.variant || 'default'}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Error state with retry
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Ocorreu um erro ao carregar os dados. Tente novamente.',
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <EmptyState
      illustration="error"
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Tentar novamente',
        onClick: onRetry,
      } : undefined}
      variant="card"
      className={className}
    />
  );
}

// No results state
interface NoResultsProps {
  query?: string;
  onClear?: () => void;
  className?: string;
}

export function NoResults({
  query,
  onClear,
  className
}: NoResultsProps) {
  return (
    <EmptyState
      illustration="search"
      title={query ? `Nenhum resultado para "${query}"` : 'Nenhum resultado encontrado'}
      description="Tente ajustar sua busca ou filtros"
      action={onClear ? {
        label: 'Limpar busca',
        onClick: onClear,
        variant: 'outline'
      } : undefined}
      variant="default"
      className={className}
    />
  );
}

// Empty Table State
interface EmptyTableProps {
  title?: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
}

export function EmptyTableState({
  title = 'Nenhum registro encontrado',
  description = 'Adicione novos registros para começar.',
  onAdd,
  addLabel = 'Adicionar',
  className
}: EmptyTableProps) {
  return (
    <EmptyState
      illustration="empty"
      title={title}
      description={description}
      action={onAdd ? {
        label: addLabel,
        onClick: onAdd,
      } : undefined}
      variant="compact"
      className={className}
    />
  );
}

// No Data State
export function NoDataState({
  title = 'Nenhum dado disponível',
  description = 'Não há dados para exibir no momento.',
  className
}: { title?: string; description?: string; className?: string }) {
  return (
    <EmptyState
      illustration="empty"
      title={title}
      description={description}
      variant="default"
      className={className}
    />
  );
}
