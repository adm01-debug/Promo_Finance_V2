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
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    iconColor: 'text-green-500',
  },
  pending: {
    icon: Clock,
    label: 'Pendente',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    iconColor: 'text-yellow-500',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Atenção',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-300',
    iconColor: 'text-orange-500',
  },
  error: {
    icon: X,
    label: 'Erro',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
    iconColor: 'text-red-500',
  },
  loading: {
    icon: Loader2,
    label: 'Processando',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    iconColor: 'text-blue-500',
  },
  paused: {
    icon: Pause,
    label: 'Pausado',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    iconColor: 'text-gray-500',
  },
  active: {
    icon: Play,
    label: 'Ativo',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    iconColor: 'text-green-500',
  },
  inactive: {
    icon: Pause,
    label: 'Inativo',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    iconColor: 'text-gray-500',
  },
  paid: {
    icon: Check,
    label: 'Pago',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    iconColor: 'text-green-500',
  },
  overdue: {
    icon: AlertTriangle,
    label: 'Vencido',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
    iconColor: 'text-red-500',
  },
  partial: {
    icon: Clock,
    label: 'Parcial',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    iconColor: 'text-blue-500',
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
  success: 'bg-green-500',
  pending: 'bg-yellow-500',
  warning: 'bg-orange-500',
  error: 'bg-red-500',
  loading: 'bg-blue-500',
  paused: 'bg-gray-500',
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  paid: 'bg-green-500',
  overdue: 'bg-red-500',
  partial: 'bg-blue-500',
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
