import { motion } from "framer-motion";
import { DollarSign, AlertTriangle, CalendarDays, Clock, Calendar, TrendingUp, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useUserEmpresas } from "@/hooks/useUserEmpresas";

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
  const { currentEmpresaId } = useAuth();
  const { data: vinculos = [] } = useUserEmpresas();
  const currentEmpresa = vinculos.find(v => v.empresa_id === currentEmpresaId);

  return (
    <div className="space-y-4">
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Risk Intelligence</span>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Sincronizado: {currentEmpresa?.empresa.nome_fantasia || 'Multi-empresa'}
                </Badge>
              </div>
              <span className={cn(
                "text-2xl font-black tabular-nums",
                kpis.taxaInadimplencia > 20 ? "text-destructive" : 
                kpis.taxaInadimplencia > 10 ? "text-warning" : "text-success"
              )}>
                {kpis.taxaInadimplencia.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(kpis.taxaInadimplencia, 100)} className="h-3 shadow-inner" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                {formatCurrency(kpis.vencido)} vencido de {formatCurrency(kpis.totalReceber)} total a receber
              </p>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                Real-time Audit Log Active
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
