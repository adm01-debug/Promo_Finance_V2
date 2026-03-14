import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
        info: "border-transparent bg-secondary/15 text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  removable?: boolean;
  onRemove?: () => void;
}

function Badge({ className, variant, removable, onRemove, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), removable && "pr-1", className)} {...props}>
      {children}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Animated notification badge
interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  dot?: boolean;
  color?: 'default' | 'primary' | 'destructive' | 'success';
  className?: string;
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  pulse?: boolean;
}

function NotificationBadge({
  count,
  maxCount = 99,
  showZero = false,
  dot = false,
  color = 'destructive',
  className,
  children,
  position = 'top-right',
  pulse = false
}: NotificationBadgeProps) {
  const showBadge = dot || count > 0 || (count === 0 && showZero);
  const displayCount = count > maxCount ? `${maxCount}+` : count;

  const colorStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary text-primary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    success: 'bg-green-500 text-white',
  };

  const positionStyles = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      {children}
      <AnimatePresence>
        {showBadge && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={cn(
              "absolute flex items-center justify-center",
              dot ? "h-2.5 w-2.5 rounded-full" : "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
              colorStyles[color],
              positionStyles[position],
              pulse && "animate-pulse"
            )}
          >
            {!dot && (
              <motion.span
                key={count}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {displayCount}
              </motion.span>
            )}
            {pulse && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-75" 
                    style={{ backgroundColor: 'inherit' }} />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// Status badge with icon
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending';
  label?: string;
  showDot?: boolean;
  className?: string;
}

function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online', dotPulse: true },
    offline: { color: 'bg-gray-400', label: 'Offline', dotPulse: false },
    away: { color: 'bg-yellow-500', label: 'Ausente', dotPulse: false },
    busy: { color: 'bg-red-500', label: 'Ocupado', dotPulse: false },
    pending: { color: 'bg-blue-500', label: 'Pendente', dotPulse: true },
  };

  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
      className
    )}>
      {showDot && (
        <span className="relative flex h-2 w-2">
          {config.dotPulse && (
            <span className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.color
            )} />
          )}
          <span className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            config.color
          )} />
        </span>
      )}
      {displayLabel}
    </span>
  );
}

// Count badge for tabs/sections
interface CountBadgeProps {
  count: number;
  className?: string;
  variant?: 'default' | 'muted';
}

function CountBadge({ count, className, variant = 'default' }: CountBadgeProps) {
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium",
        variant === 'default' 
          ? "bg-primary/10 text-primary" 
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {count}
    </motion.span>
  );
}

// New badge for highlighting new items
interface NewBadgeProps {
  className?: string;
}

function NewBadge({ className }: NewBadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 400 }}
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
        "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
        className
      )}
    >
      Novo
    </motion.span>
  );
}

export { 
  Badge, 
  badgeVariants,
  NotificationBadge,
  StatusBadge,
  CountBadge,
  NewBadge
};
