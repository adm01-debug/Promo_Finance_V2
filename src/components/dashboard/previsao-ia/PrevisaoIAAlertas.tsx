import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

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
    case 'critico': return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Crítico</Badge>;
    case 'alto': return <Badge className="gap-1 bg-streak text-streak-foreground"><AlertTriangle className="h-3 w-3" /> Alto</Badge>;
    case 'medio': return <Badge className="gap-1 bg-warning text-warning-foreground"><AlertTriangle className="h-3 w-3" /> Médio</Badge>;
    default: return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Baixo</Badge>;
  }
}

export function PrevisaoIAAlertas({ alertas }: Props) {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-primary" />Alertas Identificados</CardTitle></CardHeader>
        <CardContent>
          <AnimatePresence>
            {alertas?.length ? (
              <div className="space-y-3">
                {alertas.map((alerta, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">{getAlertaBadge(alerta.tipo)}</div>
                    <p className="mt-2 text-sm">{alerta.mensagem}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><ArrowRight className="h-3 w-3" />{alerta.acao_recomendada}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhum alerta identificado</p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
