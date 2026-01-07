import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button' | 'circle' | 'image';
  animated?: boolean;
  style?: React.CSSProperties;
}

function Skeleton({ 
  className, 
  shimmer = true, 
  variant = 'default', 
  animated = true,
  style
}: SkeletonProps) {
  const variantStyles = {
    default: '',
    card: 'rounded-xl',
    text: 'h-4 rounded',
    avatar: 'rounded-full aspect-square',
    button: 'h-10 rounded-lg',
    circle: 'rounded-full',
    image: 'rounded-lg aspect-video',
  };

  if (animated) {
    return (
      <motion.div 
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className={cn(
          "bg-muted relative overflow-hidden",
          variantStyles[variant],
          shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          className
        )}
        style={style}
      />
    );
  }

  return (
    <div 
      className={cn(
        "bg-muted relative overflow-hidden",
        variantStyles[variant],
        shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        !shimmer && "animate-pulse",
        className
      )}
    />
  );
}

// Animated skeleton with staggered children
interface SkeletonGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

function SkeletonGroup({ children, className, staggerDelay = 0.1 }: SkeletonGroupProps) {
  return (
    <motion.div 
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Skeleton para cards com animação de entrada
function SkeletonCard({ className }: { className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border bg-card p-6 space-y-4", className)}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" className="w-24" />
      </div>
    </motion.div>
  );
}

// Skeleton para tabelas com animação por linha
function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 p-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-5" />
        ))}
      </div>
      {/* Rows with staggered animation */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div 
          key={rowIndex} 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: rowIndex * 0.05 }}
          className="p-4 flex gap-4 border-t"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant="text" 
              className={cn("flex-1", colIndex === 0 && "w-1/4 flex-none")} 
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton para lista com animação
function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-4 p-4 rounded-lg border"
        >
          <Skeleton variant="avatar" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-2/3" />
            <Skeleton variant="text" className="w-1/3 h-3" />
          </div>
          <Skeleton variant="button" className="w-20 h-8" />
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton para dashboard com animação
function SkeletonDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border bg-card p-6"
          >
            <Skeleton variant="text" className="w-1/2 h-4 mb-2" />
            <Skeleton className="h-8 w-2/3 mb-4" />
            <Skeleton variant="text" className="w-full h-3" />
          </motion.div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="rounded-xl border bg-card p-6"
          >
            <Skeleton variant="text" className="w-1/3 h-5 mb-4" />
            <Skeleton className="h-64 rounded-lg" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Skeleton para formulário
function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="space-y-2"
        >
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton className="h-10 w-full rounded-md" />
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: fields * 0.1 }}
        className="flex gap-3 pt-4"
      >
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" className="w-24" />
      </motion.div>
    </motion.div>
  );
}

// Skeleton para perfil de usuário
function SkeletonProfile() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center space-y-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Skeleton variant="avatar" className="h-24 w-24" />
      </motion.div>
      <div className="space-y-2 w-full max-w-xs">
        <Skeleton variant="text" className="h-6 w-1/2 mx-auto" />
        <Skeleton variant="text" className="h-4 w-3/4 mx-auto" />
      </div>
      <div className="flex gap-4 pt-2">
        <Skeleton variant="button" className="w-24" />
        <Skeleton variant="button" className="w-24" />
      </div>
    </motion.div>
  );
}

// Inline skeleton text with wave effect
function SkeletonText({ 
  lines = 3, 
  lastLineWidth = '60%',
  className 
}: { 
  lines?: number; 
  lastLineWidth?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          variant="text" 
          className="h-4"
          style={{ 
            width: i === lines - 1 ? lastLineWidth : '100%',
            animationDelay: `${i * 0.1}s`
          }} 
        />
      ))}
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonGroup,
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList, 
  SkeletonDashboard,
  SkeletonForm,
  SkeletonProfile,
  SkeletonText
};
