import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';

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
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          <Calendar className="h-4 w-4 text-primary" />
          Quantum Projections: Cash Flow Horizon
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {projecao && Object.entries(projecao).map(([periodo, dados]) => (
            <Card key={periodo} className="border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden group hover:scale-[1.02] transition-transform">
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
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Balance</span>
                  <span className={`font-black text-xl tracking-tighter ${parseValor(dados.saldo_projetado) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {dados.saldo_projetado}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
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
                  <span className="text-sm font-bold text-muted-foreground/90 leading-relaxed group-hover:text-foreground transition-colors">
                    {rec}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
