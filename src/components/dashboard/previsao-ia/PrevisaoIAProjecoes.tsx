import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Lightbulb, CheckCircle2, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } } as const;

interface ProjecaoFluxo {
  proximos_7_dias: { entradas_previstas: string; saidas_previstas: string; saldo_projetado: string };
  proximos_30_dias: { entradas_previstas: string; saidas_previstas: string; saldo_projetado: string };
  proximos_90_dias: { entradas_previstas: string; saidas_previstas: string; saldo_projetado: string };
}

interface Props {
  projecao?: ProjecaoFluxo;
  recomendacoes?: string[];
  parseValor: (v: string) => number;
}

export function PrevisaoIAProjecoes({ projecao, recomendacoes, parseValor }: Props) {
  return (
    <div className="space-y-8">
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            <Calendar className="h-4 w-4 text-primary" />
            Quantum Projections: Cash Flow Horizon
          </h3>
          <Button variant="ghost" size="sm" asChild className="text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-primary/10 text-primary">
            <Link to="/simulador-antecipacao">
              Optimizar Liquidez
              <Zap className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {projecao && Object.entries(projecao).map(([periodo, dados]) => {
            const isCritical = parseValor(dados.saldo_projetado) < 0;
            return (
              <Card key={periodo} className="border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden group hover:scale-[1.02] transition-transform relative">
                {isCritical && (
                  <div className="absolute top-0 right-0 p-2">
                    <span className="flex h-2 w-2 rounded-full bg-destructive animate-ping" />
                  </div>
                )}
                <CardHeader className="bg-white/5 py-3 border-b border-white/5">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                    {periodo === 'proximos_7_dias' ? 'Short Term (7d)' : periodo === 'proximos_30_dias' ? 'Mid Term (30d)' : 'Long Term (90d)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Inbound</span>
                    <span className="font-black text-lg tracking-tighter text-success">{dados.entradas_previstas}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Outbound</span>
                    <span className="font-black text-lg tracking-tighter text-destructive">{dados.saidas_previstas}</span>
                  </div>
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Balance</span>
                      <span className={`font-black text-xl tracking-tighter ${parseValor(dados.saldo_projetado) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {dados.saldo_projetado}
                      </span>
                    </div>
                    
                    {isCritical && (
                      <Button variant="outline" size="sm" className="w-full h-8 text-[9px] font-black uppercase tracking-widest bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all gap-2" asChild>
                        <Link to="/simulador-antecipacao">
                          Corrigir Déficit via Antecipação
                          <TrendingUp className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              <Lightbulb className="h-4 w-4 text-primary" />
              Strategic Neural Directives
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {recomendacoes?.map((rec, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }} 
                  className="group flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-default"
                >
                  <div className="mt-1 h-6 w-6 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-muted-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">
                      {rec}
                    </span>
                    {rec.toLowerCase().includes('antecip') && (
                      <Link to="/simulador-antecipacao" className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline">
                        Simular agora <ArrowRight className="h-2 w-2" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
