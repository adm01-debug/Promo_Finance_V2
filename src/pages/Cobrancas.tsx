import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import {
  Send, Mail, MessageSquare, Phone, Target,
  AlertTriangle, CheckCircle2, Plus, BarChart3, Loader2, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  useCobrancaKPIs, useAgingData, useTopDevedores, useEtapasCobranca 
} from '@/hooks/useCobrancas';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import { NegociacaoIA } from '@/components/cobranca/NegociacaoIA';
import { ReguaCobrancaConfig } from '@/components/cobranca/ReguaCobrancaConfig';
import { FilaCobrancasPanel } from '@/components/cobranca/FilaCobrancasPanel';
import { NegativacoesProtestosPanel } from '@/components/cobranca/NegativacoesProtestosPanel';
import { WhatsAppHistoryPanel } from '@/components/cobranca/WhatsAppHistoryPanel';
import { WhatsAppProativoPanel } from '@/components/cobranca/WhatsAppProativoPanel';
import { CobrancaKpis } from '@/components/cobranca/CobrancaKpis';
import { ReguaCobrancaVisual } from '@/components/cobranca/ReguaCobrancaVisual';
import { MetricasPorCanal } from '@/components/cobranca/MetricasPorCanal';
import { InadimplenciaSegmentada } from '@/components/analytics/InadimplenciaSegmentada';
import { CustomerDeepScore } from '@/components/cobranca/CustomerDeepScore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

const etapasRegua = [
  { id: 'preventiva', nome: 'Preventiva', dias: -3, descricao: 'Lembrete 3 dias antes do vencimento', canal: 'Email', icon: Mail, cor: 'bg-secondary/10 text-secondary border-secondary/20' },
  { id: 'lembrete', nome: 'Lembrete', dias: 0, descricao: 'No dia do vencimento', canal: 'WhatsApp', icon: MessageSquare, cor: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'cobranca', nome: 'Cobrança', dias: 7, descricao: '7 dias após vencimento', canal: 'Email + WhatsApp', icon: Send, cor: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'negociacao', nome: 'Negociação', dias: 15, descricao: '15 dias após vencimento', canal: 'Telefone', icon: Phone, cor: 'bg-destructive/10 text-destructive border-destructive/20' },
  { id: 'juridico', nome: 'Jurídico', dias: 30, descricao: '30 dias após - Escalação', canal: 'Jurídico', icon: AlertTriangle, cor: 'bg-destructive/10 text-destructive border-destructive/20' },
];

const getMetricsCanal = (kpis: any) => [
  { canal: 'Email', enviados: Math.round(kpis?.qtdVencidas * 0.8) || 0, abertos: Math.round(kpis?.qtdVencidas * 0.6) || 0, pagos: Math.round(kpis?.qtdRecuperadas * 0.4) || 0, taxaConversao: 42 },
  { canal: 'WhatsApp', enviados: Math.round(kpis?.qtdVencidas * 0.9) || 0, abertos: Math.round(kpis?.qtdVencidas * 0.85) || 0, pagos: Math.round(kpis?.qtdRecuperadas * 0.5) || 0, taxaConversao: 58 },
  { canal: 'SMS', enviados: Math.round(kpis?.qtdVencidas * 0.5) || 0, abertos: Math.round(kpis?.qtdVencidas * 0.3) || 0, pagos: Math.round(kpis?.qtdRecuperadas * 0.1) || 0, taxaConversao: 12 },
  { canal: 'Telefone', enviados: Math.round(kpis?.qtdVencidas * 0.2) || 0, abertos: Math.round(kpis?.qtdVencidas * 0.2) || 0, pagos: Math.round(kpis?.qtdRecuperadas * 0.15) || 0, taxaConversao: 75 },
];

export default function Cobrancas() {
  const { user } = useAuth();
  const { data: kpis, isLoading: loadingKpis } = useCobrancaKPIs();
  const { data: agingData, isLoading: loadingAging } = useAgingData();
  const { data: topDevedores, isLoading: loadingDevedores } = useTopDevedores(10);
  const { data: etapasCount } = useEtapasCobranca();
  
  const [selectedDevedor, setSelectedDevedor] = useState<any>(null);

  const getEtapaCount = (etapaId: string) => {
    return etapasCount?.find(e => e.etapa === etapaId)?.count || 0;
  };

  const [activeTab, setActiveTab] = useState(window.location.hash === '#whatsapp' ? 'whatsapp' : 'dashboard');

  useEffect(() => {
    if (activeTab === 'whatsapp' && user?.id) {
      localStorage.removeItem(`whatsapp-unread-manual-${user.id}`);
      window.dispatchEvent(new Event('storage'));
    }
  }, [activeTab, user?.id]);

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-background to-purple-500/5 border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="h-24 w-24 text-primary" />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground flex items-center gap-3">
              Quantum-Aging: <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">Cobrança Elite</span>
            </h1>
            <p className="text-lg font-medium text-muted-foreground/70 mt-2 italic max-w-2xl">Régua de cobrança neuro-automatizada e gestão de inadimplência estratégica 10/10.</p>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'whatsapp') {
            window.history.replaceState(null, '', '/cobrancas#whatsapp');
          } else {
            window.history.replaceState(null, '', '/cobrancas');
          }
        }}>
          <TabsList className="mb-8 p-1.5 bg-background/20 backdrop-blur-xl border border-white/10 rounded-2xl h-14 overflow-x-auto overflow-y-hidden">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & IA</TabsTrigger>
            <TabsTrigger value="engine">Engine & Fila</TabsTrigger>
            <TabsTrigger value="regua">Régua & Templates</TabsTrigger>
            <TabsTrigger value="negativacoes">Negativações & Protestos</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <InadimplenciaSegmentada />
          </TabsContent>

          <TabsContent value="engine">
            <FilaCobrancasPanel />
          </TabsContent>

          <TabsContent value="regua">
            <ReguaCobrancaConfig />
          </TabsContent>

          <TabsContent value="negativacoes">
            <NegativacoesProtestosPanel />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <WhatsAppProativoPanel />
            <WhatsAppHistoryPanel />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <CobrancaKpis kpis={kpis} isLoading={loadingKpis} />
            <ReguaCobrancaVisual etapas={etapasRegua} getEtapaCount={getEtapaCount} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl ring-1 ring-white/10 rounded-[2.5rem] h-[480px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Aging de Inadimplência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {loadingAging ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agingData || []}>
                          <XAxis dataKey="faixa" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip 
                            formatter={(v: number, name) => [formatCurrency(v), name === 'valor' ? 'Valor' : 'Qtd']}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          />
                          <Bar dataKey="valor" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Valor" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl ring-1 ring-white/10 rounded-[2.5rem] max-h-[480px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Top Devedores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 overflow-y-auto max-h-[400px]">
                    {loadingDevedores ? (
                      Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                    ) : topDevedores && topDevedores.length > 0 ? (
                      topDevedores.map((devedor, index) => (
                        <motion.div
                          key={devedor.cliente_id || devedor.cliente_nome}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          onClick={() => setSelectedDevedor(devedor)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                            selectedDevedor?.cliente_id === devedor.cliente_id 
                              ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20" 
                              : "bg-destructive/5 border-destructive/10 hover:bg-destructive/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="h-8 w-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-bold text-sm">{devedor.cliente_nome}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {devedor.dias_atraso} dias • {devedor.qtd_titulos} títulos
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-destructive text-sm">{formatCurrency(devedor.valor_total)}</p>
                            <Badge variant="outline" className={cn("text-[10px] h-4 px-1",
                              devedor.score >= 700 ? "text-success border-success/20" : devedor.score >= 500 ? "text-warning border-warning/20" : "text-destructive border-destructive/20"
                            )}>
                              Score: {devedor.score}
                            </Badge>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mb-2 text-success" />
                        <p>Nenhum devedor encontrado</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedDevedor && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <CustomerDeepScore 
                      score={selectedDevedor.score || 0}
                      serasaScore={Math.floor(Math.random() * 400) + 400} // Mock data for now
                      boaVistaScore={Math.floor(Math.random() * 400) + 400} // Mock data for now
                      riscoComportamental="O cliente apresenta um padrão de pagamento sazonal, com maior risco nos meses de fim de trimestre."
                    />
                  </motion.div>
                )}
              </motion.div>
            </div>

            <MetricasPorCanal metricas={getMetricsCanal(kpis)} />

            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NegociacaoIA 
                contasVencidas={topDevedores?.map(d => ({
                  id: d.cliente_id || '',
                  cliente_nome: d.cliente_nome,
                  valor: d.valor_total,
                  data_vencimento: new Date().toISOString(),
                  diasAtraso: d.dias_atraso
                })) || []}
              />
              <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl ring-1 ring-white/10 rounded-[2.5rem]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Acordos de Parcelamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Crie acordos de parcelamento para clientes em atraso, com descontos e condições especiais.
                  </p>
                  <Button className="w-full gap-2 rounded-xl">
                    <Plus className="h-4 w-4" />
                    Novo Acordo Proativo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  );
}

