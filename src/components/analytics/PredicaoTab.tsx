import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  BrainCircuit, AlertTriangle, DollarSign, Clock, ArrowRight, TrendingUp, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { PredicaoInadimplencia } from "@/hooks/useInadimplenciaSegmentada";

const priorityColors = {
  critica: "bg-destructive/20 text-destructive border-destructive/30",
  alta: "bg-warning/20 text-warning border-warning/30",
  media: "bg-primary/20 text-primary border-primary/30",
  baixa: "bg-success/20 text-success border-success/30",
};

interface Props {
  previsoes: PredicaoInadimplencia[] | undefined;
  taxaGeralRamo: number;
}

export function PredicaoTab({ previsoes, taxaGeralRamo }: Props) {
  return (
    <TabsContent value="predicao" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Alertas da Engine Preditiva
              </CardTitle>
              <CardDescription>Ocorrências detectadas com alta probabilidade de inadimplência.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {previsoes && previsoes.length > 0 ? (
                previsoes.map((p, idx) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card transition-all cursor-pointer group"
                  >
                    <div className={`mt-1 p-2 rounded-lg ${priorityColors[p.prioridade as keyof typeof priorityColors] || priorityColors.media}`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{p.titulo}</h4>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">
                          Probabilidade: {p.probabilidade}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.descricao}</p>
                      <div className="flex items-center gap-4 pt-2 text-xs font-semibold">
                        <div className="flex items-center gap-1 text-destructive">
                          <DollarSign className="h-3 w-3" />
                          Risco: {formatCurrency(p.impacto_estimado)}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Estimado para: {formatDate(p.data_previsao)}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center space-y-2">
                  <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground font-medium">Nenhum alerta crítico no radar da IA no momento.</p>
                  <p className="text-xs text-muted-foreground">A engine continua monitorando o comportamento dos clientes 24/7.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tendência de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Jan', value: 12 },
                    { name: 'Fev', value: 15 },
                    { name: 'Mar', value: 10 },
                    { name: 'Abr', value: 18 },
                    { name: 'Mai', value: taxaGeralRamo },
                  ]}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0, 40]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <h5 className="text-xs font-bold text-primary flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  INSIGHT IA DO DIA
                </h5>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  O setor de "Construção Civil" apresentou um aumento de 15% na propensão de atraso para os próximos 15 dias. Recomenda-se reforçar a régua de cobrança preventiva para este grupo.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Confiabilidade da Predição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Precisão Histórica</span>
                  <span className="text-success">94.2%</span>
                </div>
                <Progress value={94} className="h-1.5" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Volume de Dados Processado</span>
                  <span className="text-primary">124k registros</span>
                </div>
                <Progress value={85} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
}
