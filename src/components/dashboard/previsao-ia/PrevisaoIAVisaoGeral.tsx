import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Users, Clock, Wallet, DollarSign, Target } from 'lucide-react';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } } as const;

interface IndicadoresChave {
  prazo_medio_recebimento: string;
  prazo_medio_pagamento: string;
  ciclo_financeiro: string;
  liquidez_corrente: string;
  cobertura_despesas: string;
}

interface InadimplenciaData {
  taxa_atual: string;
  tendencia: string;
  clientes_risco: string[];
  valor_em_risco: string;
}

interface Props {
  indicadores?: IndicadoresChave;
  inadimplencia?: InadimplenciaData;
  getTendenciaIcon: (t: string) => React.ReactNode;
}

export function PrevisaoIAVisaoGeral({ indicadores, inadimplencia, getTendenciaIcon }: Props) {
  return (
    <div className="space-y-6">
      {indicadores && (
        <motion.div variants={itemVariants}>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            <Target className="h-4 w-4 text-primary" />
            Neural Matrix: Performance KPIs
          </h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <Card className="relative group overflow-hidden border-white/5 bg-white/5 backdrop-blur-xl transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100" />
              <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10">
                <Clock className="h-5 w-5 text-primary mb-2 opacity-60" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">PMR</p>
                <p className="text-lg font-black tracking-tight">{indicadores.prazo_medio_recebimento}</p>
              </CardContent>
            </Card>

            <Card className="relative group overflow-hidden border-white/5 bg-white/5 backdrop-blur-xl transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-streak/5 to-transparent opacity-0 group-hover:opacity-100" />
              <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10">
                <Clock className="h-5 w-5 text-streak mb-2 opacity-60" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">PMP</p>
                <p className="text-lg font-black tracking-tight">{indicadores.prazo_medio_pagamento}</p>
              </CardContent>
            </Card>

            <Card className="relative group overflow-hidden border-white/5 bg-white/5 backdrop-blur-xl transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100" />
              <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10">
                <Activity className="h-5 w-5 text-secondary mb-2 opacity-60" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Ciclo</p>
                <p className="text-lg font-black tracking-tight">{indicadores.ciclo_financeiro}</p>
              </CardContent>
            </Card>

            <Card className="relative group overflow-hidden border-white/5 bg-white/5 backdrop-blur-xl transition-all hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100" />
              <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10">
                <Wallet className="h-5 w-5 text-success mb-2 opacity-60" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Liquidez</p>
                <p className="text-lg font-black tracking-tight">{indicadores.liquidez_corrente}</p>
              </CardContent>
            </Card>

            <Card className="relative group overflow-hidden border-white/5 bg-white/5 backdrop-blur-xl transition-all hover:scale-105 md:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100" />
              <CardContent className="p-4 flex flex-col items-center justify-center text-center relative z-10">
                <DollarSign className="h-5 w-5 text-blue-500 mb-2 opacity-60" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Cobertura</p>
                <p className="text-lg font-black tracking-tight">{indicadores.cobertura_despesas}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card className="border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden group">
          <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <Users className="h-4 w-4 text-primary" />
                Delinquency Matrix: Risk Analysis
              </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Taxa Atual</span>
                <p className="font-black text-2xl tracking-tighter">{inadimplencia?.taxa_atual}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Tendência Neural</span>
                <div className="flex items-center gap-2">
                  {getTendenciaIcon(inadimplencia?.tendencia || '')}
                  <span className="font-black text-lg tracking-tight capitalize">{inadimplencia?.tendencia}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Exposição em Risco</span>
                <p className="font-black text-2xl tracking-tighter text-destructive shadow-destructive/20">{inadimplencia?.valor_em_risco}</p>
              </div>
            </div>
            
            {inadimplencia?.clientes_risco?.length ? (
              <div className="pt-6 border-t border-white/5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Entidades em Alerta Máximo:</p>
                <div className="flex flex-wrap gap-2">
                  {inadimplencia.clientes_risco.slice(0, 6).map((cliente, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-lg hover:bg-white/10 transition-colors cursor-default"
                    >
                      {cliente}
                    </Badge>
                  ))}
                  {inadimplencia.clientes_risco.length > 6 && (
                    <Badge variant="secondary" className="text-[10px] font-black py-1 px-3 rounded-lg bg-primary/20 text-primary">
                      +{inadimplencia.clientes_risco.length - 6} CRITICAL
                    </Badge>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
