import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Database, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface BitrixKpisProps {
  isConnected: boolean;
  stats: { ultimaSync?: string; totalSincronizados: number; dealsImportados: number; errosHoje: number; };
  formatRelativeTime: (dateStr: string | undefined) => string;
}

export function BitrixKpiCards({ isConnected, stats, formatRelativeTime }: BitrixKpisProps) {
  const items = [
    { icon: isConnected ? CheckCircle2 : XCircle, iconColor: isConnected ? 'text-success' : 'text-destructive', bg: isConnected ? 'bg-success/10' : 'bg-destructive/10', label: 'Status', value: isConnected ? 'Online' : 'Offline', valueColor: isConnected ? 'text-success' : 'text-destructive' },
    { icon: Clock, iconColor: 'text-secondary', bg: 'bg-secondary/10', label: 'Última Sync', value: formatRelativeTime(stats.ultimaSync) },
    { icon: Database, iconColor: 'text-accent', bg: 'bg-accent/10', label: 'Sincronizados', value: stats.totalSincronizados.toString() },
    { icon: DollarSign, iconColor: 'text-streak', bg: 'bg-streak/10', label: 'Deals', value: stats.dealsImportados.toString() },
    { icon: XCircle, iconColor: 'text-destructive', bg: 'bg-destructive/10', label: 'Erros Hoje', value: stats.errosHoje.toString() },
  ];

  return (
    <motion.div className="grid grid-cols-2 lg:grid-cols-5 gap-4" variants={containerVariants} initial="hidden" animate="visible">
      {items.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", item.bg)}><item.icon className={cn("h-5 w-5", item.iconColor)} /></div>
                <div><p className="text-xs text-muted-foreground">{item.label}</p><p className={cn("font-semibold", item.valueColor)}>{item.value}</p></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
