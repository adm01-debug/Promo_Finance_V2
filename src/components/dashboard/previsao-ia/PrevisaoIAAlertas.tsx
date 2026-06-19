import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } } as const;

interface AlertaIA {
  tipo: string;
  mensagem: string;
  acao_recomendada: string;
}

interface Props {
  alertas?: AlertaIA[];
}

function getAlertaBadge(tipo: string) {
  switch (tipo.toLowerCase()) {
    case 'critico': 
      return (
        <Badge variant="destructive" className="gap-2 font-black uppercase tracking-widest text-[10px] py-1 px-3 rounded-lg animate-pulse">
          <ShieldAlert className="h-3 w-3" /> CRITICAL VECTOR
        </Badge>
      );
    case 'alto': 
      return (
        <Badge className="gap-2 font-black uppercase tracking-widest text-[10px] py-1 px-3 rounded-lg bg-streak text-streak-foreground">
          <AlertTriangle className="h-3 w-3" /> HIGH EXPOSURE
        </Badge>
      );
    case 'medio': 
      return (
        <Badge className="gap-2 font-black uppercase tracking-widest text-[10px] py-1 px-3 rounded-lg bg-warning text-warning-foreground">
          <AlertTriangle className="h-3 w-3" /> MEDIUM RISK
        </Badge>
      );
    default: 
      return (
        <Badge variant="secondary" className="gap-2 font-black uppercase tracking-widest text-[10px] py-1 px-3 rounded-lg">
          <CheckCircle2 className="h-3 w-3" /> OPTIMIZED
        </Badge>
      );
  }
}

export function PrevisaoIAAlertas({ alertas }: Props) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-white/5 bg-black/20 backdrop-blur-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/5">
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Neural Sentinel: Threat Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence>
            {alertas?.length ? (
              <div className="grid gap-4">
                {alertas.map((alerta, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }} 
                    className="group relative rounded-2xl border border-white/5 bg-card/5 p-5 hover:bg-card/10 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ShieldAlert className="h-12 w-12 text-primary" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        {getAlertaBadge(alerta.tipo)}
                      </div>
                      <p className="text-sm font-bold text-foreground/90 leading-relaxed mb-4">
                        {alerta.mensagem}
                      </p>
                      <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-black/40 border border-white/5">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                          Recommended Action: <span className="text-foreground ml-1">{alerta.acao_recomendada}</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black tracking-tight">System Secured</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Zero active threats detected in matrix</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
