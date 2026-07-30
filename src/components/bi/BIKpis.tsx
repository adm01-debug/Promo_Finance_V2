import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Target, Users, Building2, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface BIKpisProps {
  kpis: {
    saldoTotal: number;
    receitaMes: number;
    variacaoReceita: number;
    lucroMes: number;
    margemLucro: number;
    inadimplencia: number;
    totalVencidasReceber: number;
    totalReceber: number;
    totalPagar: number;
    despesaMes: number;
    clientesAtivos: number;
    contasAtivas: number;
    liquidez: number;
  };
}

export function BIMainKpis({ kpis }: BIKpisProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <CardContent className="pt-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className="text-2xl font-bold">{formatCurrency(kpis.saldoTotal)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            <Badge variant={kpis.liquidez >= 1 ? "default" : "destructive"} className="text-xs">
              Liquidez: {kpis.liquidez.toFixed(2)}x
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent" />
        <CardContent className="pt-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita do Mês</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(kpis.receitaMes)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {kpis.variacaoReceita >= 0 ? (
              <span className="flex items-center text-success">
                <ArrowUpRight className="w-4 h-4" />
                {kpis.variacaoReceita.toFixed(1)}% vs mês anterior
              </span>
            ) : (
              <span className="flex items-center text-destructive">
                <ArrowDownRight className="w-4 h-4" />
                {Math.abs(kpis.variacaoReceita).toFixed(1)}% vs mês anterior
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
        <CardContent className="pt-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lucro do Mês</p>
              <p className={`text-2xl font-bold ${kpis.lucroMes >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(kpis.lucroMes)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Margem de Lucro</span>
              <span>{kpis.margemLucro.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(Math.abs(kpis.margemLucro), 100)} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
        <CardContent className="pt-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inadimplência</p>
              <p className={`text-2xl font-bold ${kpis.inadimplencia > 10 ? 'text-destructive' : 'text-warning'}`}>
                {kpis.inadimplencia.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {formatCurrency(kpis.totalVencidasReceber)} em atraso
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function BISecondaryKpis({ kpis }: BIKpisProps) {
  const items = [
    { label: 'A Receber', value: formatCurrency(kpis.totalReceber), icon: TrendingUp, color: 'text-success' },
    { label: 'A Pagar', value: formatCurrency(kpis.totalPagar), icon: TrendingDown, color: 'text-destructive' },
    { label: 'Despesas Mês', value: formatCurrency(kpis.despesaMes), icon: BarChart3, color: 'text-streak' },
    { label: 'Clientes Ativos', value: kpis.clientesAtivos.toString(), icon: Users, color: 'text-secondary' },
    { label: 'Contas Bancárias', value: kpis.contasAtivas.toString(), icon: Building2, color: 'text-accent' }
  ];

  return (
    <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map((item, idx) => (
        <Card key={idx} className="bg-card/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}
