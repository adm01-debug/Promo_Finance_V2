import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Building2 } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export function FornecedoresKPIs({ total, ativos }: { total: number; ativos: number }) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0, type: 'spring', stiffness: 300, damping: 24 }}>
        <Card className="stat-card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total de Fornecedores</p>
                <p className="text-lg sm:text-2xl font-bold font-display mt-1">{total}</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 24 }}>
        <Card className="stat-card group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Fornecedores Ativos</p>
                <p className="text-lg sm:text-2xl font-bold font-display mt-1">{ativos}</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
