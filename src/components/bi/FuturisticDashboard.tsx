import React from 'react';
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, CheckCircle2, TrendingUp, TrendingDown, AlertTriangle, Building2, BarChart3, Clock, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";

const FuturisticMetricCard = ({ title, value, icon: Icon, trend, glowColor }: any) => (
  <div className={cn(
    "premium-card p-6 border border-white/10 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-md relative group transition-all duration-500 overflow-hidden",
    "hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]"
  )}>
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-12 h-12" style={{ color: glowColor }} />
    </div>
    
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: glowColor }} />
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{title}</p>
      </div>
      
      <h3 className="text-3xl font-bold tracking-tight text-foreground mb-4">{value}</h3>
      
      {trend !== undefined && (
        <div className="flex items-center gap-2 bg-background/40 backdrop-blur-sm w-fit px-2 py-1 rounded-lg border border-white/5">
          <span className={trend >= 0 ? "text-success flex items-center text-xs font-bold" : "text-destructive flex items-center text-xs font-bold"}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">MÊS ATUAL</span>
        </div>
      )}
    </div>

    {/* Decorative background glow */}
    <div className="absolute -bottom-10 -left-10 w-32 h-32 blur-[60px] rounded-full opacity-20 transition-all duration-500 group-hover:opacity-40" style={{ backgroundColor: glowColor }} />
  </div>
);

export function FuturisticDashboard({ kpis, evolucaoMensal }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Live Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-ping" />
            <span className="text-[10px] font-bold text-success uppercase tracking-widest">Sistema Ativo</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-medium uppercase">Última atualização: agora</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">IA Financeira Conectada</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FuturisticMetricCard 
          title="Contas a Receber" 
          value={formatCurrency(kpis.totalReceber)} 
          icon={TrendingUp} 
          glowColor="#22c55e"
          trend={kpis.variacaoReceita}
        />
        <FuturisticMetricCard 
          title="Contas a Pagar" 
          value={formatCurrency(kpis.totalPagar)} 
          icon={TrendingDown} 
          glowColor="#ef4444"
          trend={-1.2}
        />
        <FuturisticMetricCard 
          title="Eficiência de Conciliação" 
          value="98.5%" 
          icon={CheckCircle2} 
          glowColor="#3b82f6"
          trend={0.5}
        />
        <FuturisticMetricCard 
          title="Pagamentos em Atraso" 
          value={formatCurrency(kpis.totalVencidasReceber)} 
          icon={AlertTriangle} 
          glowColor="#f59e0b"
          trend={kpis.inadimplencia}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 premium-card p-6 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <Zap className="w-24 h-24 text-primary opacity-[0.03] rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Inteligência de Fluxo de Caixa
                </h3>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Projeção preditiva baseada em histórico de 12 meses</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-[10px] font-bold text-success uppercase">Realizado</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase">Projetado</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={evolucaoMensal}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="receitas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  fill="url(#colorReceitas)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="lucro" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  fill="url(#colorLucro)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-6 border border-white/10 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Empresas
            </h3>
            <button className="text-[10px] font-bold text-primary uppercase hover:underline">Ver Todas</button>
          </div>
          
          <div className="space-y-4 relative z-10">
            {evolucaoMensal.slice(0, 5).map((item: any, i: number) => (
              <div 
                key={i} 
                className="flex justify-between items-center p-4 rounded-xl bg-background/40 backdrop-blur-sm border border-white/5 hover:border-primary/30 transition-all duration-300 group/item"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary group-hover/item:scale-110 transition-transform">
                    {item.mes.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.mes}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-success" />
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Performance Ótima</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">{formatCurrency(item.receitas)}</p>
                  <p className="text-[10px] font-bold text-success">+{((item.receitas/10000) * 10).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              <span>Score de Saúde Global</span>
              <span className="text-primary">94/100</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "94%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-success shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}