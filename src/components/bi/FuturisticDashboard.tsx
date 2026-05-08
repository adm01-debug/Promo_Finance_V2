import React from 'react';
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle, Building2, BarChart3, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";

const FuturisticMetricCard = ({ title, value, icon: Icon, trend, color, glowColor }: any) => (
  <div className={`premium-card p-6 border border-white/10 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-md relative group hover:border-[${glowColor}] transition-all duration-300`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} opacity-5 group-hover:opacity-10 transition-opacity rounded-2xl`} />
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-1 text-foreground">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-background/50 border border-white/5`}>
        <Icon className="w-6 h-6" style={{ color: glowColor }} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className={trend > 0 ? "text-success flex items-center" : "text-destructive flex items-center"}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(trend)}%
        </span>
        <span className="text-muted-foreground">vs mês anterior</span>
      </div>
    )}
  </div>
);

export function FuturisticDashboard({ kpis, evolucaoMensal }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FuturisticMetricCard 
          title="Contas a Receber" 
          value={formatCurrency(kpis.totalReceber)} 
          icon={TrendingUp} 
          glowColor="#22c55e"
          trend={5.2}
        />
        <FuturisticMetricCard 
          title="Contas a Pagar" 
          value={formatCurrency(kpis.totalPagar)} 
          icon={TrendingDown} 
          glowColor="#ef4444"
          trend={-2.1}
        />
        <FuturisticMetricCard 
          title="Conciliação Bancária" 
          value="98.5%" 
          icon={CheckCircle2} 
          glowColor="#3b82f6"
        />
        <FuturisticMetricCard 
          title="Pagamentos Atrasados" 
          value={formatCurrency(kpis.totalVencidasReceber)} 
          icon={AlertTriangle} 
          glowColor="#f59e0b"
          trend={12.5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 premium-card p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Fluxo de Caixa Projetado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={evolucaoMensal}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" stroke="#888" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#888" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Area type="monotone" dataKey="receitas" stroke="#22c55e" strokeWidth={3} fill="url(#colorReceitas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="premium-card p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Empresas em Destaque
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-background/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">E{i}</div>
                  <div>
                    <p className="font-medium">Empresa {i}</p>
                    <p className="text-xs text-muted-foreground">Performance 98%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(15000 * i)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}