/**
 * Dashboard Skeleton - Loading state with cascading animation
 * 
 * Provides a beautiful loading experience for the dashboard
 */

import { forwardRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
} as const;

// Shimmer effect component
const ShimmerBar = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    return (
      <div ref={ref} className={cn('relative overflow-hidden bg-muted rounded', className)}>
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-background/50 to-transparent"
        />
      </div>
    );
  }
);
ShimmerBar.displayName = 'ShimmerBar';

// KPI Card Skeleton
function KPICardSkeleton({ index = 0, variant = 'primary' }: { index?: number; variant?: 'hero' | 'primary' | 'secondary' }) {
  const sizes = {
    hero: { card: 'p-6 min-h-[180px]', value: 'h-12 w-40', title: 'h-4 w-24', icon: 'h-20 w-20' },
    primary: { card: 'p-5', value: 'h-8 w-32', title: 'h-4 w-20', icon: 'h-14 w-14' },
    secondary: { card: 'p-4', value: 'h-6 w-24', title: 'h-3 w-16', icon: 'h-10 w-10' },
  };

  const config = sizes[variant];

  return (
    <motion.div variants={itemVariants}>
      <Card className={cn('overflow-hidden', config.card)}>
        <CardContent className="p-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <ShimmerBar className={config.title} />
              <ShimmerBar className={config.value} />
              <ShimmerBar className="h-4 w-28" />
            </div>
            <ShimmerBar className={cn('rounded-xl', config.icon)} />
          </div>
        </CardContent>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 origin-left"
        />
      </Card>
    </motion.div>
  );
}

// Chart Skeleton
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <ShimmerBar className="h-5 w-32" />
              <ShimmerBar className="h-3 w-48" />
            </div>
            <ShimmerBar className="h-9 w-24 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative" style={{ height }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <ShimmerBar key={i} className="h-3 w-10" />
              ))}
            </div>
            
            {/* Chart area */}
            <div className="ml-14 h-full flex items-end gap-2 pb-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${30 + Math.random() * 60}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                  className="flex-1 bg-muted rounded-t"
                />
              ))}
            </div>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-14 right-0 flex justify-between">
              {[...Array(6)].map((_, i) => (
                <ShimmerBar key={i} className="h-3 w-8" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Table Skeleton
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <ShimmerBar className="h-5 w-36" />
            <ShimmerBar className="h-8 w-20 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b">
              <ShimmerBar className="h-4 w-1/4" />
              <ShimmerBar className="h-4 w-1/4" />
              <ShimmerBar className="h-4 w-1/4" />
              <ShimmerBar className="h-4 w-1/4" />
            </div>
            {/* Rows */}
            {[...Array(rows)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex gap-4 py-2"
              >
                <ShimmerBar className="h-4 w-1/4" />
                <ShimmerBar className="h-4 w-1/4" />
                <ShimmerBar className="h-4 w-1/4" />
                <ShimmerBar className="h-4 w-1/4" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Full Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBar className="h-8 w-64" />
          <ShimmerBar className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <ShimmerBar className="h-10 w-[200px] rounded-md" />
          <ShimmerBar className="h-10 w-[200px] rounded-md" />
        </div>
      </motion.div>

      {/* KPI Cards - Hero row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <KPICardSkeleton key={i} index={i} variant="primary" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={280} />
        <ChartSkeleton height={280} />
      </div>

      {/* Secondary KPIs + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TableSkeleton rows={6} />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <KPICardSkeleton key={i} index={i} variant="secondary" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export { KPICardSkeleton, ChartSkeleton, TableSkeleton, ShimmerBar };
