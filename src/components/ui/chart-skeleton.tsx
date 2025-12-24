import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
  type?: 'bar' | 'line' | 'pie' | 'area';
  className?: string;
  barCount?: number;
  height?: number;
}

// Skeleton para gráficos de barras com animação crescente
export function BarChartSkeleton({ 
  className, 
  barCount = 7,
  height = 200 
}: Omit<ChartSkeletonProps, 'type'>) {
  const bars = Array.from({ length: barCount }, (_, i) => ({
    height: Math.random() * 60 + 30, // 30-90% height
    delay: i * 0.1,
  }));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 px-4">
        {bars.map((bar, index) => (
          <motion.div
            key={index}
            className="flex-1 bg-gradient-to-t from-primary/30 to-primary/10 rounded-t-md relative overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: `${bar.height}%` }}
            transition={{
              duration: 0.8,
              delay: bar.delay,
              ease: [0.4, 0, 0.2, 1],
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: 1,
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: bar.delay,
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Skeleton para gráficos de linha
export function LineChartSkeleton({ 
  className, 
  height = 200 
}: Omit<ChartSkeletonProps, 'type' | 'barCount'>) {
  return (
    <div className={cn("w-full relative overflow-hidden", className)} style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        <motion.path
          d="M 0 150 Q 50 120, 100 130 T 200 100 T 300 120 T 400 80"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Area fill */}
        <motion.path
          d="M 0 150 Q 50 120, 100 130 T 200 100 T 300 120 T 400 80 L 400 200 L 0 200 Z"
          fill="hsl(var(--primary))"
          opacity={0.1}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
      
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Skeleton para gráficos de pizza/donut
export function PieChartSkeleton({ 
  className, 
  height = 200 
}: Omit<ChartSkeletonProps, 'type' | 'barCount'>) {
  const segments = [
    { angle: 90, color: 'hsl(var(--primary))' },
    { angle: 60, color: 'hsl(var(--chart-2))' },
    { angle: 80, color: 'hsl(var(--chart-3))' },
    { angle: 70, color: 'hsl(var(--chart-4))' },
    { angle: 60, color: 'hsl(var(--chart-5))' },
  ];

  let currentAngle = 0;

  return (
    <div className={cn("w-full flex items-center justify-center", className)} style={{ height }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <mask id="donutMask">
            <circle cx="80" cy="80" r="70" fill="white" />
            <circle cx="80" cy="80" r="40" fill="black" />
          </mask>
        </defs>
        
        <g mask="url(#donutMask)">
          {segments.map((segment, index) => {
            const startAngle = currentAngle;
            currentAngle += segment.angle;
            
            return (
              <motion.circle
                key={index}
                cx="80"
                cy="80"
                r="55"
                fill="none"
                stroke={segment.color}
                strokeWidth="30"
                strokeDasharray={`${segment.angle * 0.96} 360`}
                strokeDashoffset={-startAngle}
                opacity={0.3}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.2, 0.4, 0.2], scale: 1 }}
                transition={{
                  duration: 2,
                  delay: index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </g>
        
        {/* Center pulse */}
        <motion.circle
          cx="80"
          cy="80"
          r="35"
          fill="hsl(var(--muted))"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}

// Skeleton para gráficos de área
export function AreaChartSkeleton({ 
  className, 
  height = 200 
}: Omit<ChartSkeletonProps, 'type' | 'barCount'>) {
  return (
    <div className={cn("w-full relative overflow-hidden", className)} style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Multiple stacked areas */}
        {[0, 1, 2].map((layer) => (
          <motion.path
            key={layer}
            d={`M 0 ${180 - layer * 30} Q 100 ${150 - layer * 30}, 200 ${160 - layer * 30} T 400 ${140 - layer * 30} L 400 200 L 0 200 Z`}
            fill="url(#areaGradient)"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              y: [0, -5, 0]
            }}
            transition={{
              duration: 3,
              delay: layer * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
      
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Componente unificado que escolhe o tipo correto
export function ChartSkeleton({ 
  type = 'bar', 
  className, 
  barCount,
  height 
}: ChartSkeletonProps) {
  switch (type) {
    case 'bar':
      return <BarChartSkeleton className={className} barCount={barCount} height={height} />;
    case 'line':
      return <LineChartSkeleton className={className} height={height} />;
    case 'pie':
      return <PieChartSkeleton className={className} height={height} />;
    case 'area':
      return <AreaChartSkeleton className={className} height={height} />;
    default:
      return <BarChartSkeleton className={className} barCount={barCount} height={height} />;
  }
}

// Grid de múltiplos skeletons para dashboards
export function ChartGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      <div className="p-6 rounded-lg border bg-card">
        <div className="h-4 w-32 bg-muted rounded mb-4 animate-pulse" />
        <BarChartSkeleton height={180} />
      </div>
      <div className="p-6 rounded-lg border bg-card">
        <div className="h-4 w-32 bg-muted rounded mb-4 animate-pulse" />
        <LineChartSkeleton height={180} />
      </div>
      <div className="p-6 rounded-lg border bg-card">
        <div className="h-4 w-32 bg-muted rounded mb-4 animate-pulse" />
        <PieChartSkeleton height={180} />
      </div>
      <div className="p-6 rounded-lg border bg-card">
        <div className="h-4 w-32 bg-muted rounded mb-4 animate-pulse" />
        <AreaChartSkeleton height={180} />
      </div>
    </div>
  );
}
