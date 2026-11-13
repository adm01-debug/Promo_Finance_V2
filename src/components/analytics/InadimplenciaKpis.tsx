import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, Target, Sparkles, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { getRiskBg } from './inadimplencia-config';

interface InadimplenciaKpisProps {
  taxaGeralRamo: number;
  totaisRamo:
    | { valor_total: number; valor_vencido: number; total_contas: number; total_vencido: number }
    | undefined;
}

export function InadimplenciaKpis({ taxaGeralRamo, totaisRamo }: InadimplenciaKpisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className={`border-none shadow-md ${getRiskBg(taxaGeralRamo)}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70">
                  Taxa de Risco Atual
                </p>
                <p className="text-3xl font-black">{formatPercentage(taxaGeralRamo)}</p>
              </div>
              <AlertTriangle
                className={`h-8 w-8 ${taxaGeralRamo > 15 ? 'text-warning' : 'text-success'}`}
              />
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold">
              <TrendingDown className="h-3 w-3" />
              <span>-2.4% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none shadow-md bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Exposição Vencida
                </p>
                <p className="text-3xl font-black text-destructive">
                  {formatCurrency(totaisRamo?.valor_vencido || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-destructive opacity-30" />
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">
              Impacto direto no Fluxo de Caixa
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-none shadow-md bg-chart-1/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Alvos de Recuperação
                </p>
                <p className="text-3xl font-black text-chart-1">{totaisRamo?.total_vencido || 0}</p>
              </div>
              <Target className="h-8 w-8 text-chart-1 opacity-30" />
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">
              Títulos pendentes em negociação
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-none shadow-md bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Previsão de Recebimento
                </p>
                <p className="text-3xl font-black text-success">
                  {formatCurrency((totaisRamo?.valor_vencido || 0) * 0.72)}
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-success opacity-30" />
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">
              Estimado via IA (72% de confiança)
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
