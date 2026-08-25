import { motion } from "framer-motion";
import { DollarSign, AlertTriangle, CalendarDays, Clock, Calendar, TrendingUp, CheckCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useUserEmpresas } from "@/hooks/useUserEmpresas";
import { StatCard } from "@/components/motion/StatCard";
import { Sparkline } from "@/components/charts/Sparkline";

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
  /** Série mensal real (6 meses) — alimenta sparklines e delta; nunca fabricada */
  evolucao?: { mes: string; recebido: number; aReceber: number; vencido: number }[];
}

type KpiCard = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  delta?: { value: string; positive: boolean };
  sparkline?: ReactNode;
};

export function ReceberKpisCards({ kpis, evolucao }: ReceberKpisProps) {
  const recebidoSeries = evolucao?.map((e) => e.recebido) ?? [];
  const aReceberSeries = evolucao?.map((e) => e.aReceber) ?? [];
  const vencidoSeries = evolucao?.map((e) => e.vencido) ?? [];

  // Delta do recebido: último mês vs anterior (apenas com base real > 0)
  let deltaRecebido: KpiCard["delta"];
  if (recebidoSeries.length >= 2) {
    const prev = recebidoSeries[recebidoSeries.length - 2];
    const last = recebidoSeries[recebidoSeries.length - 1];
    if (prev > 0) {
      const pct = ((last - prev) / prev) * 100;
      deltaRecebido = { value: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, positive: pct >= 0 };
    }
  }

  const cards: KpiCard[] = [
    { label: 'Total a Receber', value: formatCurrency(kpis.totalReceber), sub: `${kpis.contasPendentes} contas`, icon: DollarSign, iconColor: 'var(--acc)', iconBg: 'var(--acc-soft)', sparkline: aReceberSeries.length > 1 ? <Sparkline data={aReceberSeries} color="var(--acc)" /> : undefined },
    { label: 'Vencido', value: formatCurrency(kpis.vencido), sub: `${kpis.contasVencidas} contas`, icon: AlertTriangle, iconColor: 'var(--bad)', iconBg: 'var(--bad-soft)', sparkline: vencidoSeries.length > 1 ? <Sparkline data={vencidoSeries} color="var(--bad)" /> : undefined },
    { label: 'Vence Hoje', value: formatCurrency(kpis.venceHoje), icon: CalendarDays, iconColor: 'var(--warn)', iconBg: 'var(--warn-soft)' },
    { label: 'Próx. 7 dias', value: formatCurrency(kpis.venceSemana), icon: Clock, iconColor: 'var(--info)', iconBg: 'var(--info-soft)' },
    { label: 'Próx. 30 dias', value: formatCurrency(kpis.venceMes), icon: Calendar, iconColor: 'var(--acc-2)', iconBg: 'color-mix(in srgb, var(--acc-2) 12%, transparent)' },
    { label: 'Recebido (Mês)', value: formatCurrency(kpis.recebidoMes), icon: TrendingUp, iconColor: 'var(--ok)', iconBg: 'var(--ok-soft)', delta: deltaRecebido, sparkline: recebidoSeries.length > 1 ? <Sparkline data={recebidoSeries} color="var(--ok)" /> : undefined },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={itemVariants}>
            <StatCard
              label={card.label}
              value={card.value}
              sub={card.sub}
              icon={<Icon className="h-5 w-5" />}
              iconColor={card.iconColor}
              iconBg={card.iconBg}
              delta={card.delta}
              sparkline={card.sparkline}
            />
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
