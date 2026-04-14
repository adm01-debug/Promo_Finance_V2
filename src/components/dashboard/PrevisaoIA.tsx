import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, RefreshCw, Sparkles, TrendingUp, TrendingDown, Activity, AlertTriangle, BarChart3, PieChart, Target } from 'lucide-react';
import { logger } from '@/lib/logger';
import { PrevisaoIAVisaoGeral } from './previsao-ia/PrevisaoIAVisaoGeral';
import { PrevisaoIATendencias } from './previsao-ia/PrevisaoIATendencias';
import { PrevisaoIAProjecoes } from './previsao-ia/PrevisaoIAProjecoes';
import { PrevisaoIAAlertas } from './previsao-ia/PrevisaoIAAlertas';

interface AnalisePreditiva {
  resumo_executivo: string;
  analise_inadimplencia: { taxa_atual: string; tendencia: string; clientes_risco: string[]; valor_em_risco: string };
  projecao_fluxo_caixa: {
    proximos_7_dias: { entradas_previstas: string; saidas_previstas: string; saldo_projetado: string };
    proximos_30_dias: { entradas_previstas: string; saidas_previstas: string; saldo_projetado: string };
    proximos_90_dias: { entradas_previstas: string; saidas_previstas: string; saldo_projetado: string };
  };
  analise_tendencias?: {
    receitas: { tendencia: string; variacao_percentual: string; previsao_proximo_mes: string; observacao: string };
    despesas: { tendencia: string; variacao_percentual: string; previsao_proximo_mes: string; observacao: string };
    inadimplencia: { tendencia: string; variacao_percentual: string; previsao_proximo_mes: string; observacao: string };
    margem_liquida: { atual: string; tendencia: string; previsao: string };
    dados_grafico: Array<{ mes: string; receitas: number; despesas: number; saldo: number }>;
  };
  alertas: Array<{ tipo: string; mensagem: string; acao_recomendada: string }>;
  recomendacoes: string[];
  score_saude_financeira: string;
  indicadores_chave?: { prazo_medio_recebimento: string; prazo_medio_pagamento: string; ciclo_financeiro: string; liquidez_corrente: string; cobertura_despesas: string };
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } } as const;

export function PrevisaoIA({ className }: { className?: string }) {
  const [analise, setAnalise] = useState<AnalisePreditiva | null>(null);
  const [loading, setLoading] = useState(false);
  const [geradoEm, setGeradoEm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('visao-geral');
  const { toast } = useToast();

  const gerarAnalise = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analise-preditiva');
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAnalise(data.analise);
      setGeradoEm(data.gerado_em);
      toast({ title: "Análise concluída", description: `Analisados ${data.dados_analisados.contas_receber} recebíveis, ${data.dados_analisados.contas_pagar} pagáveis, ${data.dados_analisados.clientes} clientes e ${data.dados_analisados.meses_historico || 0} meses de histórico.` });
    } catch (error: unknown) {
      logger.error('Erro na análise preditiva:', error);
      toast({ title: "Erro na análise", description: error instanceof Error ? error.message : "Não foi possível gerar a análise preditiva.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia?.toLowerCase().includes('cresc')) return <TrendingUp className="h-4 w-4 text-success" />;
    if (tendencia?.toLowerCase().includes('decresc')) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getTendenciaColor = (tendencia: string, inverted = false) => {
    const isUp = tendencia?.toLowerCase().includes('cresc');
    const isDown = tendencia?.toLowerCase().includes('decresc');
    if (inverted) { return isUp ? 'text-destructive' : isDown ? 'text-success' : 'text-muted-foreground'; }
    return isUp ? 'text-success' : isDown ? 'text-destructive' : 'text-muted-foreground';
  };

  const parseValor = (valor: string): number => {
    if (!valor) return 0;
    return parseFloat(valor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  };

  const getScoreColor = (score: string): string => {
    const s = parseInt(score) || 0;
    if (s >= 80) return 'text-success';
    if (s >= 60) return 'text-warning';
    if (s >= 40) return 'text-streak';
    return 'text-destructive';
  };

  if (!analise && !loading) {
    return (
      <Card className={`${className} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardContent className="relative flex flex-col items-center justify-center py-16 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="relative mb-6"><div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" /><Brain className="relative h-16 w-16 text-primary" /></div>
          </motion.div>
          <h3 className="mb-2 text-xl font-semibold">Análise Preditiva com IA</h3>
          <p className="mb-6 max-w-md text-muted-foreground">Utilize inteligência artificial para analisar tendências históricas, prever inadimplência, projetar fluxo de caixa e receber recomendações estratégicas personalizadas.</p>
          <Button onClick={gerarAnalise} size="lg" className="gap-2"><Sparkles className="h-4 w-4" />Gerar Análise Preditiva</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Brain className="h-6 w-6 text-primary" /></motion.div>
            <div><CardTitle>Analisando tendências...</CardTitle><CardDescription>A IA está processando dados históricos e identificando padrões</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const score = parseInt(analise?.score_saude_financeira || '0');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><Brain className="h-5 w-5 text-primary" /></div>
              <div><CardTitle>Análise Preditiva com IA</CardTitle>{geradoEm && <CardDescription>Gerado em {new Date(geradoEm).toLocaleString('pt-BR')}</CardDescription>}</div>
            </div>
            <Button variant="outline" size="sm" onClick={gerarAnalise} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-muted-foreground">Score de Saúde Financeira</p><p className={`text-4xl font-bold ${getScoreColor(analise?.score_saude_financeira || '0')}`}>{analise?.score_saude_financeira || 0}<span className="text-lg text-muted-foreground">/100</span></p></div>
                <div className="w-32"><Progress value={score} className="h-3" /></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{analise?.resumo_executivo}</p>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visao-geral" className="gap-2"><PieChart className="h-4 w-4" />Visão Geral</TabsTrigger>
              <TabsTrigger value="tendencias" className="gap-2"><BarChart3 className="h-4 w-4" />Tendências</TabsTrigger>
              <TabsTrigger value="projecoes" className="gap-2"><Target className="h-4 w-4" />Projeções</TabsTrigger>
              <TabsTrigger value="alertas" className="gap-2"><AlertTriangle className="h-4 w-4" />Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="visao-geral" className="mt-4">
              <PrevisaoIAVisaoGeral indicadores={analise?.indicadores_chave} inadimplencia={analise?.analise_inadimplencia} getTendenciaIcon={getTendenciaIcon} />
            </TabsContent>
            <TabsContent value="tendencias" className="mt-4">
              {analise?.analise_tendencias && <PrevisaoIATendencias tendencias={analise.analise_tendencias} getTendenciaIcon={getTendenciaIcon} getTendenciaColor={getTendenciaColor} />}
            </TabsContent>
            <TabsContent value="projecoes" className="mt-4">
              <PrevisaoIAProjecoes projecao={analise?.projecao_fluxo_caixa} recomendacoes={analise?.recomendacoes} parseValor={parseValor} />
            </TabsContent>
            <TabsContent value="alertas" className="mt-4">
              <PrevisaoIAAlertas alertas={analise?.alertas} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
