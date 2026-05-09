import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: LucideIcon;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  children?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  gradientFrom = "from-primary",
  gradientVia = "via-blue-500",
  gradientTo = "to-purple-600",
  children,
  className,
}: PageHeaderProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn("flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4 mb-8", className)}
    >
      <div className="space-y-4">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {badge}
          </div>
        )}
        <h1 className="text-5xl font-black tracking-tighter md:text-6xl lg:text-7xl">
          {title.split(' ').map((word, i, arr) => (
            i === arr.length - 1 ? (
              <span key={i} className={cn("text-transparent bg-clip-text bg-gradient-to-r", gradientFrom, gradientVia, gradientTo)}>
                {" "}{word}
              </span>
            ) : (
              <span key={i}>{i > 0 && " "}{word}</span>
            )
          ))}
        </h1>
        {subtitle && (
          <p className="text-xl text-muted-foreground/70 max-w-2xl leading-relaxed font-medium italic">
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-4 bg-background/40 p-2.5 rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10">
          {children}
        </div>
      )}
    </motion.div>
  );
};

export const PageBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
    <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] rounded-full bg-blue-600/5 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
    <div className="absolute middle-0 left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[130px] animate-pulse" style={{ animationDelay: '1s' }} />
  </div>
);
