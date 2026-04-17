import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Mail, MessageSquare, Phone, Smartphone, Target, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, DollarSign, Filter, Plus,
  Settings, BarChart3, Eye, RefreshCcw, Loader2, Bot, FileText, Shield, Gavel,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { AcordoParcelamentoDialog } from '@/components/cobranca/AcordoParcelamentoDialog';
import { NegociacaoIA } from '@/components/cobranca/NegociacaoIA';
import { PrevisaoInadimplencia } from '@/components/cobranca/PrevisaoInadimplencia';
import { ReguaCobrancaConfig } from '@/components/cobranca/ReguaCobrancaConfig';
import { FilaCobrancasPanel } from '@/components/cobranca/FilaCobrancasPanel';
import { NegativacoesProtestosPanel } from '@/components/cobranca/NegativacoesProtestosPanel';
import { WhatsAppHistoryPanel } from '@/components/cobranca/WhatsAppHistoryPanel';
import { WhatsAppProativoPanel } from '@/components/cobranca/WhatsAppProativoPanel';
import { CobrancaKpis } from '@/components/cobranca/CobrancaKpis';
import { ReguaCobrancaVisual } from '@/components/cobranca/ReguaCobrancaVisual';
import { MetricasPorCanal } from '@/components/cobranca/MetricasPorCanal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

// Régua de Cobrança - 5 Etapas
const etapasRegua = [
  { 
    id: 'preventiva', 
    nome: 'Preventiva', 
    dias: -3, 
    descricao: 'Lembrete 3 dias antes do vencimento',
    canal: 'Email',
    icon: Mail,
    cor: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  { 
    id: 'lembrete', 
    nome: 'Lembrete', 
    dias: 0, 
    descricao: 'No dia do vencimento',
    canal: 'WhatsApp',
    icon: MessageSquare,
    cor: 'bg-warning/10 text-warning border-warning/20',
  },
  { 
    id: 'cobranca', 
    nome: 'Cobrança', 
    dias: 7, 
    descricao: '7 dias após vencimento',
    canal: 'Email + WhatsApp',
    icon: Send,
    cor: 'bg-primary/10 text-primary border-primary/20',
  },
  { 
    id: 'negociacao', 
    nome: 'Negociação', 
    dias: 15, 
    descricao: '15 dias após vencimento',
    canal: 'Telefone',
    icon: Phone,
    cor: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  { 
    id: 'juridico', 
    nome: 'Jurídico', 
    dias: 30, 
    descricao: '30 dias após - Escalação',
    canal: 'Jurídico',
    icon: AlertTriangle,
    cor: 'bg-destructive/10 text-destructive border-destructive/20',
  },
];

// Métricas de canal - calculadas a partir do histórico de cobrança quando disponível
// Por enquanto mostra placeholder até que integração de envio seja implementada
const getMetricsCanal = () => [
  { canal: 'Email', enviados: 0, abertos: 0, pagos: 0, taxaConversao: 0 },
  { canal: 'WhatsApp', enviados: 0, abertos: 0, pagos: 0, taxaConversao: 0 },
  { canal: 'SMS', enviados: 0, abertos: 0, pagos: 0, taxaConversao: 0 },
  { canal: 'Telefone', enviados: 0, abertos: 0, pagos: 0, taxaConversao: 0 },
];

export default function Cobrancas() {
  const { data: kpis, isLoading: loadingKpis } = useCobrancaKPIs();
  const { data: agingData, isLoading: loadingAging } = useAgingData();
  const { data: topDevedores, isLoading: loadingDevedores } = useTopDevedores(10);
  const { data: etapasCount, isLoading: loadingEtapas } = useEtapasCobranca();

  const getEtapaCount = (etapaId: string) => {
    return etapasCount?.find(e => e.etapa === etapaId)?.count || 0;
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Cobrança</h1>
            <p className="text-muted-foreground mt-1">Régua de cobrança automatizada e gestão de inadimplência</p>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="engine">Engine & Fila</TabsTrigger>
            <TabsTrigger value="regua">Régua & Templates</TabsTrigger>
            <TabsTrigger value="negativacoes">Negativações & Protestos</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

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

        {/* KPI Cards */}
        <CobrancaKpis kpis={kpis} isLoading={loadingKpis} />

        {/* Régua de Cobrança Visual */}
        <ReguaCobrancaVisual etapas={etapasRegua} getEtapaCount={getEtapaCount} />

        {/* Charts e Devedores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Aging Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="card-elevated h-[380px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Aging de Inadimplência
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
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
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="valor" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Valor" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Devedores */}
          <motion.div variants={itemVariants}>
            <Card className="card-elevated h-[380px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Top Devedores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto max-h-[300px]">
                {loadingDevedores ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : topDevedores && topDevedores.length > 0 ? (
                  topDevedores.map((devedor, index) => (
                    <motion.div
                      key={devedor.cliente_id || devedor.cliente_nome}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{devedor.cliente_nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {devedor.dias_atraso} dias • {devedor.qtd_titulos} título{devedor.qtd_titulos > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive text-sm">{formatCurrency(devedor.valor_total)}</p>
                        {devedor.score && (
                          <Badge variant="outline" className={cn("text-xs mt-1",
                            devedor.score >= 700 ? "text-success" : devedor.score >= 500 ? "text-warning" : "text-destructive"
                          )}>
                            Score: {devedor.score}
                          </Badge>
                        )}
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
          </motion.div>
        </div>

        {/* Métricas por Canal */}
        <MetricasPorCanal metricas={getMetricsCanal()} />

        {/* Negociação IA e Acordos */}
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
          <Card className="card-elevated">
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
              <p className="text-xs text-muted-foreground">
                Selecione um cliente na lista de devedores acima para iniciar um acordo.
              </p>
            </CardContent>
          </Card>
        </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  );
}
