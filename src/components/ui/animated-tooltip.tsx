import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';

interface AnimatedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function AnimatedTooltip({ 
  content, 
  children, 
  side = 'top',
  delay = 0,
  className 
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const animations = {
    top: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 10 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 } },
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            {...animations[side]}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-3 py-2 text-sm rounded-lg',
              'bg-popover text-popover-foreground shadow-lg border',
              'whitespace-nowrap pointer-events-none',
              positions[side],
              className
            )}
          >
            {content}
            {/* Arrow */}
            <span className={cn(
              'absolute w-2 h-2 bg-popover border rotate-45',
              side === 'top' && 'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
              side === 'bottom' && 'top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
              side === 'left' && 'right-[-5px] top-1/2 -translate-y-1/2 border-t-0 border-r-0',
              side === 'right' && 'left-[-5px] top-1/2 -translate-y-1/2 border-b-0 border-l-0',
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Info tooltip with icon
import { Info, HelpCircle, AlertCircle } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
  type?: 'info' | 'help' | 'warning';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function InfoTooltip({ 
  content, 
  type = 'info',
  side = 'top',
  className 
}: InfoTooltipProps) {
  const icons = {
    info: <Info className="h-4 w-4" />,
    help: <HelpCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
  };

  const colors = {
    info: 'text-muted-foreground hover:text-foreground',
    help: 'text-primary hover:text-primary/80',
    warning: 'text-warning hover:text-warning/80',
  };

  return (
    <AnimatedTooltip content={content} side={side} className={className}>
      <button className={cn('transition-colors', colors[type])}>
        {icons[type]}
      </button>
    </AnimatedTooltip>
  );
}

// User avatar tooltip (for team display)
interface UserTooltipProps {
  user: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  children: React.ReactNode;
}

export function UserTooltip({ user, children }: UserTooltipProps) {
  return (
    <AnimatedTooltip
      content={
        <div className="flex items-center gap-3 min-w-[200px]">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{user.name}</p>
            {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            {user.role && <p className="text-xs text-primary">{user.role}</p>}
          </div>
        </div>
      }
      side="top"
    >
      {children}
    </AnimatedTooltip>
  );
}

// Stacked avatars with tooltip
interface StackedAvatarsProps {
  users: Array<{
    name: string;
    avatar?: string;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StackedAvatars({ users, max = 4, size = 'md' }: StackedAvatarsProps) {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user, i) => (
        <AnimatedTooltip key={i} content={user.name} side="top">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              'rounded-full border-2 border-background',
              sizes[size]
            )}
          >
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
        </AnimatedTooltip>
      ))}
      {remainingCount > 0 && (
        <AnimatedTooltip 
          content={users.slice(max).map(u => u.name).join(', ')}
          side="top"
        >
          <div className={cn(
            'rounded-full border-2 border-background bg-muted flex items-center justify-center font-medium',
            sizes[size]
          )}>
            +{remainingCount}
          </div>
        </AnimatedTooltip>
      )}
    </div>
  );
}
