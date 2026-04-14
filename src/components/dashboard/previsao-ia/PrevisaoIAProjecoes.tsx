import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Lightbulb, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-4">
      <motion.div variants={itemVariants}>
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><Calendar className="h-4 w-4 text-primary" />Projeção de Fluxo de Caixa</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {projecao && Object.entries(projecao).map(([periodo, dados]) => (
            <Card key={periodo} className="overflow-hidden">
              <CardHeader className="bg-muted/50 py-3">
                <CardTitle className="text-sm">
                  {periodo === 'proximos_7_dias' ? 'Próximos 7 dias' : periodo === 'proximos_30_dias' ? 'Próximos 30 dias' : 'Próximos 90 dias'}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Entradas:</span><span className="font-medium text-success">{dados.entradas_previstas}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Saídas:</span><span className="font-medium text-destructive">{dados.saidas_previstas}</span></div>
                <div className="border-t pt-2 flex items-center justify-between"><span className="text-sm font-medium">Saldo:</span><span className={`font-bold ${parseValor(dados.saldo_projetado) >= 0 ? 'text-success' : 'text-destructive'}`}>{dados.saldo_projetado}</span></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4 text-primary" />Recomendações Estratégicas</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recomendacoes?.map((rec, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>{rec}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
