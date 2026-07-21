import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Coins, ShieldAlert, TrendingUp, User } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { itemVariants } from "./types";

interface StatsCardsProps {
  totalValue: number;
  totalCount: number;
  periodo: string;
  topSupplier: [string, number] | undefined;
}

export function StatsCards({ totalValue, totalCount, periodo, topSupplier }: StatsCardsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-8 border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
          <Coins className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-2 relative z-10">
          <p className="text-[10px] uppercase font-black tracking-widest text-primary/70">Total Economizado</p>
          <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(totalValue)}</h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-success">
            <TrendingUp className="h-3 w-3" />
            <span>Proteção de caixa 100% ativa</span>
          </div>
        </div>
      </Card>

      <Card className="p-8 border border-border bg-card/[0.02] backdrop-blur-xl rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
          <ShieldAlert className="h-16 w-16 text-foreground" />
        </div>
        <div className="space-y-2 relative z-10">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Bloqueios Realizados</p>
          <h3 className="text-4xl font-black tracking-tighter">
            {totalCount} <span className="text-sm font-medium text-muted-foreground tracking-normal">tentativas</span>
          </h3>
          <p className="text-[10px] font-medium text-muted-foreground/60 italic">
            Últimas {periodo === "all" ? "total" : periodo}
          </p>
        </div>
      </Card>

      <Card className="p-8 border border-border bg-card/[0.02] backdrop-blur-xl rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
          <User className="h-16 w-16 text-foreground" />
        </div>
        <div className="space-y-2 relative z-10">
          <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Fornecedor Crítico</p>
          <h3 className="text-2xl font-black tracking-tighter truncate">{topSupplier ? topSupplier[0] : "Nenhum"}</h3>
          <p className="text-[10px] font-bold text-muted-foreground/60">
            {topSupplier ? `${topSupplier[1]} bloqueios detectados` : "Sem recorrências"}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
