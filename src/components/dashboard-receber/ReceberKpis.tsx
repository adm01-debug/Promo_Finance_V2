import { motion } from "framer-motion";
import { DollarSign, AlertTriangle, CalendarDays, Clock, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface ReceberKpisProps {
  kpis: {
    totalReceber: number;
    vencido: number;
    venceHoje: number;
    venceSemana: number;
    venceMes: number;
    recebidoMes: number;
    taxaInadimplencia: number;
    contasVencidas: number;
    contasPendentes: number;
  };
}

export function ReceberKpisCards({ kpis }: ReceberKpisProps) {
  const cards = [
    { label: 'Total a Receber', value: formatCurrency(kpis.totalReceber), sub: `${kpis.contasPendentes} contas`, icon: DollarSign, borderColor: 'border-l-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { label: 'Vencido', value: formatCurrency(kpis.vencido), sub: `${kpis.contasVencidas} contas`, icon: AlertTriangle, borderColor: 'border-l-destructive', iconBg: 'bg-destructive/10', iconColor: 'text-destructive', valueColor: 'text-destructive' },
    { label: 'Vence Hoje', value: formatCurrency(kpis.venceHoje), icon: CalendarDays, borderColor: 'border-l-warning', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    { label: 'Próx. 7 dias', value: formatCurrency(kpis.venceSemana), icon: Clock, borderColor: 'border-l-chart-2', iconBg: 'bg-chart-2/10', iconColor: 'text-chart-2' },
    { label: 'Próx. 30 dias', value: formatCurrency(kpis.venceMes), icon: Calendar, borderColor: 'border-l-chart-3', iconBg: 'bg-chart-3/10', iconColor: 'text-chart-3' },
    { label: 'Recebido (Mês)', value: formatCurrency(kpis.recebidoMes), icon: TrendingUp, borderColor: 'border-l-success', iconBg: 'bg-success/10', iconColor: 'text-success', valueColor: 'text-success' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={itemVariants}>
            <Card className={`border-l-4 ${card.borderColor}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className={cn("text-xl font-bold", card.valueColor)}>{card.value}</p>
                    {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
                  </div>
                  <div className={`p-2 rounded-full ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export function ReceberInadimplenciaBar({ kpis }: ReceberKpisProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Taxa de Inadimplência</span>
            <span className={cn(
              "text-lg font-bold",
              kpis.taxaInadimplencia > 20 ? "text-destructive" : 
              kpis.taxaInadimplencia > 10 ? "text-warning" : "text-success"
            )}>
              {kpis.taxaInadimplencia.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(kpis.taxaInadimplencia, 100)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {formatCurrency(kpis.vencido)} vencido de {formatCurrency(kpis.totalReceber)} total
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
