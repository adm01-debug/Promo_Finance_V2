import { motion, type Easing } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardSkeletonProps {
  color?: 'primary' | 'success' | 'destructive' | 'warning';
  index?: number;
}

const easeInOut: Easing = 'easeInOut';
const easeOut: Easing = 'easeOut';

const shimmerTransition = {
  repeat: Infinity,
  duration: 1.5,
  ease: easeInOut,
};

const pulseTransition = {
  repeat: Infinity,
  duration: 2,
  ease: easeInOut,
};

export const StatsCardSkeleton = ({ color = 'primary', index = 0 }: StatsCardSkeletonProps) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
      }}
      transition={{
        delay: index * 0.1,
        duration: 0.3,
        ease: easeOut,
      }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              {/* Title skeleton */}
              <motion.div
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={pulseTransition}
                className="h-4 w-24 rounded-md bg-muted overflow-hidden relative"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={shimmerTransition}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent"
                />
              </motion.div>
              
              {/* Value skeleton */}
              <motion.div
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ ...pulseTransition, delay: 0.1 }}
                className="h-8 w-32 rounded-md bg-muted overflow-hidden relative"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ ...shimmerTransition, delay: 0.1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent"
                />
              </motion.div>
              
              {/* Variation skeleton */}
              <motion.div
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ ...pulseTransition, delay: 0.2 }}
                className="h-4 w-36 rounded-md bg-muted overflow-hidden relative"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ ...shimmerTransition, delay: 0.2 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent"
                />
              </motion.div>
            </div>
            
            {/* Icon skeleton */}
            <motion.div
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={pulseTransition}
              className={cn(
                'h-12 w-12 rounded-xl overflow-hidden relative',
                color === 'primary' && 'bg-primary/10',
                color === 'success' && 'bg-green-100 dark:bg-green-900/30',
                color === 'destructive' && 'bg-red-100 dark:bg-red-900/30',
                color === 'warning' && 'bg-orange-100 dark:bg-orange-900/30'
              )}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={shimmerTransition}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-background/30 to-transparent"
              />
            </motion.div>
          </div>
        </CardContent>
        
        {/* Bottom gradient bar skeleton */}
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={pulseTransition}
          className={cn(
            'h-1 w-full overflow-hidden relative',
            color === 'primary' && 'bg-primary/20',
            color === 'success' && 'bg-green-500/20',
            color === 'destructive' && 'bg-red-500/20',
            color === 'warning' && 'bg-orange-500/20'
          )}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: easeInOut,
            }}
            className={cn(
              'absolute inset-0 w-1/2',
              color === 'primary' && 'bg-gradient-to-r from-transparent via-primary to-transparent',
              color === 'success' && 'bg-gradient-to-r from-transparent via-green-500 to-transparent',
              color === 'destructive' && 'bg-gradient-to-r from-transparent via-red-500 to-transparent',
              color === 'warning' && 'bg-gradient-to-r from-transparent via-orange-500 to-transparent'
            )}
          />
        </motion.div>
      </Card>
    </motion.div>
  );
};

interface StatsGridSkeletonProps {
  count?: number;
}

export const StatsGridSkeleton = ({ count = 4 }: StatsGridSkeletonProps) => {
  const colors: Array<'primary' | 'success' | 'destructive' | 'warning'> = [
    'primary', 'success', 'destructive', 'warning'
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatsCardSkeleton 
          key={i} 
          color={colors[i % colors.length]} 
          index={i}
        />
      ))}
    </div>
  );
};

// Mini KPI card skeleton for secondary stats
export const MiniKpiSkeleton = ({ index = 0 }: { index?: number }) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.3,
        ease: easeOut,
      }}
    >
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={pulseTransition}
            className="p-2 rounded-lg bg-muted h-9 w-9 overflow-hidden relative"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={shimmerTransition}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent"
            />
          </motion.div>
          <div className="space-y-1.5">
            <motion.div
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={pulseTransition}
              className="h-3 w-16 rounded bg-muted overflow-hidden relative"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={shimmerTransition}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ ...pulseTransition, delay: 0.1 }}
              className="h-5 w-10 rounded bg-muted overflow-hidden relative"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ ...shimmerTransition, delay: 0.1 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-transparent"
              />
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const MiniKpiGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MiniKpiSkeleton key={i} index={i} />
      ))}
    </div>
  );
};
