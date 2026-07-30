/**
 * Status Badge - Badge animado para status
 */

import { motion } from 'framer-motion';
import { Check, Clock, AlertTriangle, X, Loader2, Pause, Play, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'success' 
  | 'pending' 
  | 'warning' 
  | 'error' 
  | 'loading' 
  | 'paused' 
  | 'active'
  | 'inactive'
  | 'paid'
  | 'overdue'
  | 'partial';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
}

const statusConfig: Record<StatusType, {
  icon: LucideIcon;
  label: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}> = {
  success: {
    icon: Check,
    label: 'Concluído',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    iconColor: 'text-success',
  },
  pending: {
    icon: Clock,
    label: 'Pendente',
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
    iconColor: 'text-warning',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Atenção',
    bgColor: 'bg-streak/10',
    textColor: 'text-streak',
    iconColor: 'text-streak',
  },
  error: {
    icon: X,
    label: 'Erro',
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
    iconColor: 'text-destructive',
  },
  loading: {
    icon: Loader2,
    label: 'Processando',
    bgColor: 'bg-secondary/10',
    textColor: 'text-secondary',
    iconColor: 'text-secondary',
  },
  paused: {
    icon: Pause,
    label: 'Pausado',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    iconColor: 'text-muted-foreground',
  },
  active: {
    icon: Play,
    label: 'Ativo',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    iconColor: 'text-success',
  },
  inactive: {
    icon: Pause,
    label: 'Inativo',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    iconColor: 'text-muted-foreground',
  },
  paid: {
    icon: Check,
    label: 'Pago',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    iconColor: 'text-success',
  },
  overdue: {
    icon: AlertTriangle,
    label: 'Vencido',
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
    iconColor: 'text-destructive',
  },
  partial: {
    icon: Clock,
    label: 'Parcial',
    bgColor: 'bg-secondary/10',
    textColor: 'text-secondary',
    iconColor: 'text-secondary',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

export function StatusBadge({
  status,
  label,
  className,
  size = 'md',
  showIcon = true,
  pulse = false,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;
  const isLoading = status === 'loading';

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative inline-flex items-center rounded-full font-medium',
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon 
          className={cn(
            iconSizes[size],
            config.iconColor,
            isLoading && 'animate-spin'
          )} 
        />
      )}
      <span>{displayLabel}</span>
      
      {pulse && !isLoading && (
        <motion.span
          className={cn(
            'absolute inset-0 rounded-full',
            config.bgColor
          )}
          animate={{
            scale: [1, 1.1],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.span>
  );
}

// Status dot (minimal version)
interface StatusDotProps {
  status: StatusType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const dotSizes = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const dotColors: Record<StatusType, string> = {
  success: 'bg-success',
  pending: 'bg-warning',
  warning: 'bg-streak',
  error: 'bg-destructive',
  loading: 'bg-secondary',
  paused: 'bg-muted-foreground',
  active: 'bg-success',
  inactive: 'bg-muted-foreground',
  paid: 'bg-success',
  overdue: 'bg-destructive',
  partial: 'bg-secondary',
};

export function StatusDot({
  status,
  className,
  size = 'md',
  pulse = true,
}: StatusDotProps) {
  const color = dotColors[status];
  const isLoading = status === 'loading';

  return (
    <span className={cn('relative inline-flex', className)}>
      <span 
        className={cn(
          'rounded-full',
          dotSizes[size],
          color,
          isLoading && 'animate-pulse'
        )} 
      />
      {pulse && !isLoading && (
        <motion.span
          className={cn(
            'absolute inset-0 rounded-full',
            color
          )}
          animate={{
            scale: [1, 2],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </span>
  );
}

export default StatusBadge;
