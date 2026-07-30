import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Wallet, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface Props {
  saldoTotal: number;
  saldoDisponivel: number;
  contasAtivas: number;
  totalContas: number;
  showSaldos: boolean;
}

export function ContasBancariasKPIs({ saldoTotal, saldoDisponivel, contasAtivas, totalContas, showSaldos }: Props) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <p className="text-3xl font-bold">{showSaldos ? formatCurrency(saldoTotal) : '••••••'}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-3xl font-bold">{showSaldos ? formatCurrency(saldoDisponivel) : '••••••'}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {saldoTotal > 0 ? ((saldoDisponivel / saldoTotal) * 100).toFixed(1) : 0}% do total
                </p>
              </div>
              <div className="p-3 rounded-full bg-success/10">
                <Wallet className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contas Ativas</p>
                <p className="text-3xl font-bold">{contasAtivas}</p>
                <p className="text-sm text-muted-foreground mt-1">de {totalContas} cadastradas</p>
              </div>
              <div className="p-3 rounded-full bg-secondary/10">
                <Building2 className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
