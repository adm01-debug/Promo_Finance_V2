/**
 * Enhanced Hover Card - Com animações, variantes e componentes ricos
 */

import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & {
    variant?: 'default' | 'rich' | 'minimal';
  }
>(({ className, align = "center", sideOffset = 4, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: "rounded-md border bg-popover p-4 text-popover-foreground shadow-md",
    rich: "rounded-lg border-0 bg-gradient-to-br from-popover to-muted p-5 text-popover-foreground shadow-xl ring-1 ring-border/50",
    minimal: "rounded-md bg-popover/95 backdrop-blur-sm p-3 text-popover-foreground shadow-sm border border-border/50",
  };

  return (
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-64 outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
});
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

// ============================================================================
// Enhanced Profile Hover Card
// ============================================================================

interface ProfileHoverCardProps {
  trigger: React.ReactNode;
  user: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
    bio?: string;
    stats?: { label: string; value: string | number }[];
  };
  side?: 'top' | 'right' | 'bottom' | 'left';
  children?: React.ReactNode;
}

function ProfileHoverCard({ trigger, user, side = 'bottom', children }: ProfileHoverCardProps) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent side={side} variant="rich" className="w-80">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-semibold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{user.name}</h4>
            {user.role && (
              <p className="text-xs text-muted-foreground">{user.role}</p>
            )}
            {user.email && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
            )}
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        {user.stats && user.stats.length > 0 && (
          <div className="flex gap-4 mt-4 pt-3 border-t border-border/50">
            {user.stats.map((stat, i) => (
              <div key={i} className="text-center flex-1">
                <div className="font-semibold text-sm">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {children}
      </HoverCardContent>
    </HoverCard>
  );
}

// ============================================================================
// Info Hover Card - Para informações contextuais
// ============================================================================

interface InfoHoverCardProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

function InfoHoverCard({ trigger, title, description, footer, icon, side = 'top' }: InfoHoverCardProps) {
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent side={side} variant="default" className="w-72">
        <div className="flex gap-3">
          {icon && (
            <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        {footer && (
          <div className="mt-3 pt-3 border-t border-border/50">
            {footer}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

// ============================================================================
// Preview Hover Card - Para preview de links/conteúdo
// ============================================================================

interface PreviewHoverCardProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  image?: string;
  meta?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

function PreviewHoverCard({ trigger, title, description, image, meta, side = 'bottom' }: PreviewHoverCardProps) {
  return (
    <HoverCard openDelay={400} closeDelay={150}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent side={side} variant="minimal" className="w-72 p-0 overflow-hidden">
        {image && (
          <div className="h-32 bg-muted overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-3">
          <h4 className="font-medium text-sm line-clamp-1">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
          {meta && (
            <p className="text-xs text-muted-foreground/70 mt-2">{meta}</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// ============================================================================
// Animated Hover Reveal - Revelar conteúdo no hover
// ============================================================================

interface HoverRevealProps {
  children: React.ReactNode;
  revealContent: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

function HoverReveal({ children, revealContent, className, direction = 'up' }: HoverRevealProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const directionVariants = {
    up: { y: 10, opacity: 0 },
    down: { y: -10, opacity: 0 },
    left: { x: 10, opacity: 0 },
    right: { x: -10, opacity: 0 },
  };

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={directionVariants[direction]}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={directionVariants[direction]}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-10"
          >
            {revealContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { 
  HoverCard, 
  HoverCardTrigger, 
  HoverCardContent,
  ProfileHoverCard,
  InfoHoverCard,
  PreviewHoverCard,
  HoverReveal
};
