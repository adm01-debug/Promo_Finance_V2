import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { HoverLift } from '@/components/ui/micro-interactions';
import { User, Star, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

interface Props {
  totalClientes: number;
  clientesAtivos: number;
  limiteTotal: number;
}

export function ClientesKPIs({ totalClientes, clientesAtivos, limiteTotal }: Props) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HoverLift>
        <Card className="stat-card group h-full">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold font-display mt-1">{totalClientes}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                <User className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </HoverLift>

      <HoverLift>
        <Card className="stat-card group h-full">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold font-display mt-1">{clientesAtivos}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                <Star className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </HoverLift>

      <HoverLift>
        <Card className="stat-card group h-full">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Limite Total</p>
                <p className="text-2xl font-bold font-display mt-1">{formatCurrency(limiteTotal)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </HoverLift>
    </motion.div>
  );
}
