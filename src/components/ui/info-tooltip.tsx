import { HelpCircle, Info, AlertCircle, Lightbulb, Zap, BookOpen } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

type TooltipVariant = 'info' | 'help' | 'warning' | 'tip' | 'feature';

interface InfoTooltipProps {
  content: React.ReactNode;
  variant?: TooltipVariant;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
  animated?: boolean;
}

const variantConfig: Record<TooltipVariant, { 
  icon: typeof Info; 
  color: string;
  bgColor: string;
  pulseColor?: string;
}> = {
  info: { 
    icon: Info, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/10',
    pulseColor: 'bg-blue-400',
  },
  help: { 
    icon: HelpCircle, 
    color: 'text-muted-foreground hover:text-foreground', 
    bgColor: 'bg-muted',
  },
  warning: { 
    icon: AlertCircle, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-500/10',
    pulseColor: 'bg-yellow-400',
  },
  tip: { 
    icon: Lightbulb, 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/10',
    pulseColor: 'bg-green-400',
  },
  feature: { 
    icon: Zap, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-500/10',
    pulseColor: 'bg-purple-400',
  },
};

export function InfoTooltip({ 
  content, 
  variant = 'help', 
  side = 'top',
  className,
  iconClassName,
  animated = false,
}: InfoTooltipProps) {
  const { icon: Icon, color, pulseColor } = variantConfig[variant];
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.button 
            type="button" 
            className={cn(
              "relative inline-flex items-center justify-center transition-colors cursor-help",
              color,
              className
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {animated && pulseColor && (
              <motion.span
                className={cn("absolute inset-0 rounded-full", pulseColor)}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <Icon className={cn("h-4 w-4 relative", iconClassName)} />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs animate-in fade-in-0 zoom-in-95"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Field label with integrated tooltip
interface FieldLabelProps {
  label: string;
  tooltip?: string;
  required?: boolean;
  className?: string;
  badge?: string;
}

export function FieldLabel({ label, tooltip, required, className, badge }: FieldLabelProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary">
          {badge}
        </span>
      )}
      {tooltip && <InfoTooltip content={tooltip} variant="help" />}
    </div>
  );
}

// Contextual help panel with animation
interface HelpPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'info' | 'tip' | 'warning';
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function HelpPanel({ 
  title, 
  children, 
  className,
  variant = 'tip',
  collapsible = false,
  defaultOpen = true,
}: HelpPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    info: {
      container: 'border-blue-500/20 bg-blue-500/5',
      icon: 'text-blue-500',
      IconComponent: Info,
    },
    tip: {
      container: 'border-green-500/20 bg-green-500/5',
      icon: 'text-green-500',
      IconComponent: Lightbulb,
    },
    warning: {
      container: 'border-yellow-500/20 bg-yellow-500/5',
      icon: 'text-yellow-500',
      IconComponent: AlertCircle,
    },
  };

  const style = variantStyles[variant];
  const IconComp = style.IconComponent;

  return (
    <motion.div 
      className={cn(
        "rounded-xl border p-4 space-y-2 overflow-hidden",
        style.container,
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 font-medium w-full text-left",
          style.icon,
          collapsible && "cursor-pointer"
        )}
      >
        <motion.div
          animate={collapsible ? { rotate: isOpen ? 0 : -90 } : {}}
        >
          <IconComp className="h-4 w-4" />
        </motion.div>
        {title}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="text-sm text-muted-foreground"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Quick help card for onboarding
interface QuickHelpCardProps {
  title: string;
  description: string;
  icon?: typeof Info;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function QuickHelpCard({ 
  title, 
  description, 
  icon: Icon = BookOpen,
  action,
  className 
}: QuickHelpCardProps) {
  return (
    <motion.div
      className={cn(
        "p-4 rounded-xl border bg-gradient-to-br from-muted/50 to-muted/30",
        "hover:border-primary/30 transition-colors cursor-pointer group",
        className
      )}
      whileHover={{ y: -2 }}
    >
      <div className="flex gap-3">
        <div className="p-2 rounded-lg bg-primary/10 h-fit group-hover:bg-primary/20 transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs text-primary font-medium hover:underline"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
