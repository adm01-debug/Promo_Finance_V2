import { ReactNode } from 'react';
import { FileQuestion, Search, FolderOpen, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: 'default' | 'search' | 'error' | 'folder';
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  title,
  description,
  icon,
  variant = 'default',
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const defaultIcons = {
    default: <FileQuestion />,
    search: <Search />,
    error: <AlertCircle />,
    folder: <FolderOpen />,
  };

  const displayIcon = icon || defaultIcons[variant];

  const sizes = {
    sm: {
      container: 'py-8 px-4',
      icon: 'h-10 w-10',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12 px-6',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const iconColors = {
    default: 'text-gray-400 dark:text-gray-500',
    search: 'text-blue-400 dark:text-blue-500',
    error: 'text-red-400 dark:text-red-500',
    folder: 'text-yellow-400 dark:text-yellow-500',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes[size].container,
        className
      )}
    >
      <div
        className={cn(
          'mb-4 rounded-full bg-gray-100 dark:bg-gray-800 p-4',
          iconColors[variant]
        )}
      >
        <div className={sizes[size].icon}>{displayIcon}</div>
      </div>
      <h3
        className={cn(
          'font-semibold text-gray-900 dark:text-white mb-2',
          sizes[size].title
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-gray-500 dark:text-gray-400 max-w-md mb-6',
            sizes[size].description
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured Empty States
export function NoResultsEmpty({
  searchTerm,
  onClear,
  className,
}: {
  searchTerm?: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="search"
      title="Nenhum resultado encontrado"
      description={
        searchTerm
          ? `Não encontramos resultados para "${searchTerm}". Tente ajustar sua busca.`
          : 'Tente ajustar seus filtros ou termos de busca.'
      }
      action={
        onClear
          ? { label: 'Limpar busca', onClick: onClear }
          : undefined
      }
      className={className}
    />
  );
}

export function NoDataEmpty({
  entity,
  onCreate,
  className,
}: {
  entity: string;
  onCreate?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="folder"
      title={`Nenhum ${entity} cadastrado`}
      description={`Você ainda não possui ${entity}s cadastrados. Comece adicionando o primeiro.`}
      action={
        onCreate
          ? { label: `Adicionar ${entity}`, onClick: onCreate, icon: <Plus className="h-4 w-4" /> }
          : undefined
      }
      className={className}
    />
  );
}

export function ErrorEmpty({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      variant="error"
      title="Erro ao carregar dados"
      description="Ocorreu um erro ao carregar os dados. Por favor, tente novamente."
      action={
        onRetry
          ? { label: 'Tentar novamente', onClick: onRetry }
          : undefined
      }
      className={className}
    />
  );
}

export function PermissionEmpty({
  className,
}: {
  className?: string;
}) {
  return (
    <EmptyState
      variant="error"
      title="Acesso negado"
      description="Você não tem permissão para acessar este recurso. Entre em contato com o administrador."
      className={className}
    />
  );
}

export function MaintenanceEmpty({
  className,
}: {
  className?: string;
}) {
  return (
    <EmptyState
      variant="default"
      title="Em manutenção"
      description="Esta funcionalidade está temporariamente indisponível. Por favor, tente novamente mais tarde."
      className={className}
    />
  );
}

export function ComingSoonEmpty({
  feature,
  className,
}: {
  feature: string;
  className?: string;
}) {
  return (
    <EmptyState
      variant="default"
      title="Em breve"
      description={`A funcionalidade "${feature}" ainda está em desenvolvimento e estará disponível em breve.`}
      className={className}
    />
  );
}

export default EmptyState;
