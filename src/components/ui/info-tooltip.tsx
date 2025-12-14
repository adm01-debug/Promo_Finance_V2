import { HelpCircle, Info, AlertCircle, Lightbulb } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { cn } from '@/lib/utils';

type TooltipVariant = 'info' | 'help' | 'warning' | 'tip';

interface InfoTooltipProps {
  content: React.ReactNode;
  variant?: TooltipVariant;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
}

const variantConfig: Record<TooltipVariant, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: 'text-primary' },
  help: { icon: HelpCircle, color: 'text-muted-foreground hover:text-foreground' },
  warning: { icon: AlertCircle, color: 'text-warning' },
  tip: { icon: Lightbulb, color: 'text-success' },
};

export function InfoTooltip({ 
  content, 
  variant = 'help', 
  side = 'top',
  className,
  iconClassName,
}: InfoTooltipProps) {
  const { icon: Icon, color } = variantConfig[variant];
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button 
            type="button" 
            className={cn(
              "inline-flex items-center justify-center transition-colors cursor-help",
              color,
              className
            )}
          >
            <Icon className={cn("h-4 w-4", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
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
}

export function FieldLabel({ label, tooltip, required, className }: FieldLabelProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {tooltip && <InfoTooltip content={tooltip} variant="help" />}
    </div>
  );
}

// Contextual help panel
interface HelpPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function HelpPanel({ title, children, className }: HelpPanelProps) {
  return (
    <div className={cn(
      "rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2",
      className
    )}>
      <div className="flex items-center gap-2 text-primary font-medium">
        <Lightbulb className="h-4 w-4" />
        {title}
      </div>
      <div className="text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
