import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, Shield, Zap, Sparkles, Download, 
  Clock, TrendingUp, AlertTriangle, Lightbulb, 
  ExternalLink, Search, LayoutGrid, ListTodo
} from 'lucide-react';
import { generateBenchmarkingPDF } from '@/lib/pdf-generator';
import { cn } from '@/lib/utils';

const gapsData = [
  { feature: 'Régua de Cobrança c/ IA', status: 'ok', prioridade: 'P1', impacto: 'Alto', esforço: 'Alto', evidencia: 'Nossa engine já suporta IA Generativa para mensagens.' },
  { feature: 'Portal de Renegociação Self-Service', status: 'gap', prioridade: 'P1', impacto: 'Crítico', esforço: 'Médio', evidencia: 'Neofin permite que o devedor negocie sozinho 24/7.' },
  { feature: 'Integração Oficial WhatsApp (Meta)', status: 'ok', prioridade: 'P1', impacto: 'Crítico', esforço: 'Alto', evidencia: 'Utilizamos API oficial para garantir segurança.' },
  { feature: 'Módulo de Protesto Automático', status: 'partial', prioridade: 'P2', impacto: 'Médio', esforço: 'Baixo', evidencia: 'Temos o painel, mas o envio ainda requer ação manual.' },
  { feature: 'CRM de Cobrança c/ Histórico', status: 'ok', prioridade: 'P1', impacto: 'Alto', esforço: 'Médio', evidencia: 'Completo em nossa plataforma.' },
  { feature: 'Interface Multi-Canal (Omnichannel)', status: 'gap', prioridade: 'P2', impacto: 'Médio', esforço: 'Médio', evidencia: 'Neofin centraliza conversas de diversos canais em um só chat.' },
];

const roadmapData = [
  { quarter: 'Q3 2026', item: 'Portal de Auto-Negociação', descricao: 'Interface para clientes finais renegociarem dívidas com base em regras de desconto pré-aprovadas pela IA.' },
  { quarter: 'Q3 2026', item: 'Omnichannel Chat', descricao: 'Centralização de atendimentos WhatsApp, E-mail e SMS em uma única fila de atendimento no CRM.' },
  { quarter: 'Q4 2026', item: 'Automação de Protesto via API', descricao: 'Integração direta com cartórios para envio de títulos inadimplentes sem intervenção humana após X dias.' },
];

export function BenchmarkingConcorrentes() {
  const [activeTab, setActiveTab] = useState('gaps');

  const handleExport = () => {
    generateBenchmarkingPDF('Neofin', gapsData, roadmapData);
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Análise Competitiva vs Neofin</CardTitle>
              <CardDescription>Comparativo de features, roadmap e plano de ação</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Exportar Análise (PDF)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="gaps" className="gap-2"><LayoutGrid className="h-4 w-4" /> Matriz de Gaps</TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-2"><ListTodo className="h-4 w-4" /> Roadmap Priorizado</TabsTrigger>
          </TabsList>

          <TabsContent value="gaps" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gapsData.map((gap, i) => (
                <motion.div
                  key={gap.feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={cn(
                    "border transition-all hover:shadow-md",
                    gap.status === 'gap' ? "border-destructive/30 bg-destructive/[0.02]" : 
                    gap.status === 'partial' ? "border-warning/30 bg-warning/[0.02]" : 
                    "border-success/30 bg-success/[0.02]"
                  )}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm flex items-center gap-2">
                            {gap.feature}
                            <Badge variant="outline" className={cn(
                              "text-[10px] uppercase font-bold px-1.5 h-4",
                              gap.status === 'gap' ? "text-destructive border-destructive/20" : 
                              gap.status === 'partial' ? "text-warning border-warning/20" : 
                              "text-success border-success/20"
                            )}>
                              {gap.status === 'gap' ? 'Gap Crítico' : gap.status === 'partial' ? 'Parcial' : 'Completo'}
                            </Badge>
                          </h4>
                          <p className="text-xs text-muted-foreground italic leading-relaxed">
                            "{gap.evidencia}"
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">{gap.prioridade}</Badge>
                      </div>

                      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Impacto</p>
                          <div className="flex items-center gap-1 text-xs font-semibold">
                            <Zap className="h-3 w-3 text-warning" /> {gap.impacto}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Esforço</p>
                          <div className="flex items-center gap-1 text-xs font-semibold">
                            <Clock className="h-3 w-3 text-primary" /> {gap.esforço}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-4">
            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
              {roadmapData.map((item, i) => (
                <motion.div
                  key={item.item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="absolute -left-[27px] top-1.5 h-6 w-6 rounded-full bg-primary border-4 border-background shadow-sm flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-[10px] font-bold">{item.quarter}</Badge>
                    <h4 className="font-bold text-base">{item.item}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {item.descricao}
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-2">
                        <Lightbulb className="h-3.5 w-3.5" /> Ver specs técnicas
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-2">
                        <ExternalLink className="h-3.5 w-3.5" /> Referência Concorrente
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper icons missing in the file
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
