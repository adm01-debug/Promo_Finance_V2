import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Info, HelpCircle, AlertTriangle } from "lucide-react";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    variant?: 'default' | 'info' | 'warning' | 'dark';
  }
>(({ className, sideOffset = 4, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: 'bg-popover text-popover-foreground border',
    info: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    dark: 'bg-foreground text-background border-foreground/80',
  };

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Rich tooltip with title and description
interface RichTooltipProps {
  title?: string;
  description: string;
  icon?: 'info' | 'help' | 'warning';
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

function RichTooltip({ 
  title, 
  description, 
  icon, 
  children, 
  side = 'top',
  className 
}: RichTooltipProps) {
  const icons = {
    info: Info,
    help: HelpCircle,
    warning: AlertTriangle,
  };

  const IconComponent = icon ? icons[icon] : null;
  const variant = icon === 'warning' ? 'warning' : icon === 'info' ? 'info' : 'default';

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} variant={variant} className={cn("max-w-xs", className)}>
        <div className="flex gap-2">
          {IconComponent && (
            <IconComponent className="h-4 w-4 flex-shrink-0 mt-0.5" />
          )}
          <div>
            {title && <p className="font-medium mb-0.5">{title}</p>}
            <p className={cn("text-xs", title && "opacity-80")}>{description}</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Info tooltip helper
interface InfoTooltipProps {
  content: string;
  className?: string;
}

function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button" 
          className={cn(
            "inline-flex items-center justify-center h-4 w-4 rounded-full",
            "text-muted-foreground hover:text-foreground transition-colors",
            className
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent variant="info">
        <p className="text-xs max-w-[200px]">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Keyboard shortcut tooltip
interface ShortcutTooltipProps {
  label: string;
  shortcut: string[];
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

function ShortcutTooltip({ label, shortcut, children, side = 'bottom' }: ShortcutTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex items-center gap-0.5">
          {shortcut.map((key, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-muted-foreground text-xs">+</span>}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
                {key}
              </kbd>
            </React.Fragment>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Truncated text with tooltip
interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

function TruncatedText({ text, maxLength = 30, className }: TruncatedTextProps) {
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate ? `${text.slice(0, maxLength)}...` : text;

  if (!shouldTruncate) {
    return <span className={className}>{text}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("cursor-help", className)}>{displayText}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-md">
        <p className="text-xs break-words">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export { 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent, 
  TooltipProvider,
  RichTooltip,
  InfoTooltip,
  ShortcutTooltip,
  TruncatedText
};
