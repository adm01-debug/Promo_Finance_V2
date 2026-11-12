import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  description,
  tone = 'default',
  icon: Icon,
  trend,
}: {
  label: string;
  value: number | string;
  description: string;
  tone?: 'default' | 'success' | 'destructive' | 'warning';
  icon?: LucideIcon;
  trend?: string;
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success bg-success/5 border-success/20 shadow-lg shadow-success/10'
      : tone === 'destructive'
        ? 'text-destructive bg-destructive/5 border-destructive/20 shadow-lg shadow-destructive/10'
        : tone === 'warning'
          ? 'text-warning bg-warning/5 border-warning/20 shadow-lg shadow-warning/10'
          : 'text-foreground bg-card/5 border-white/10 shadow-2xl';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-[2.5rem] border p-8 backdrop-blur-3xl transition-all relative overflow-hidden group',
        toneClass
      )}
    >
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        {Icon && <Icon className="h-24 w-24" />}
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-40">{label}</p>
          <div className="p-2 bg-card/5 rounded-xl">
            {Icon && <Icon className="h-4 w-4 opacity-60" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black tracking-tighter tabular-nums">{value}</p>
          {trend && <span className="text-[10px] font-bold opacity-40">{trend}</span>}
        </div>
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-2">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
