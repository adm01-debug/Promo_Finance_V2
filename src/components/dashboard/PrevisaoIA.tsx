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
      <Card className={cn(className, "border-none bg-background/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group")}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <CardContent className="relative flex flex-col items-center justify-center py-20 text-center z-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="relative mb-8">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-[40px]" />
              <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl">
                <Brain className="h-10 w-10 text-white" />
              </div>
            </div>
          </motion.div>
          <h3 className="mb-3 text-3xl font-black tracking-tight text-foreground">Intelligence Analysis</h3>
          <p className="mb-8 max-w-md text-base font-medium text-muted-foreground/70 leading-relaxed italic px-6">
            Ative o processamento neural para identificar tendências, anomalias e projeções estratégicas personalizadas para seu negócio.
          </p>
          <Button onClick={gerarAnalise} size="lg" className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-3 shadow-xl transition-all hover:scale-105 active:scale-95">
            <Sparkles className="h-5 w-5" />
            Engajar Inteligência Financeira
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn(className, "border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-[2.5rem] ring-1 ring-white/10")}>
        <CardHeader className="p-10">
          <div className="flex items-center gap-6">
            <motion.div 
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1],
              }} 
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"
            >
              <Brain className="h-7 w-7" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Sincronizando Redes Neurais...</CardTitle>
              <CardDescription className="text-sm font-medium">Extraindo insights de milhares de pontos de dados transacionais.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 pt-2 space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/5" />)}
          </div>
          <Skeleton className="h-56 w-full rounded-3xl bg-white/5" />
        </CardContent>
      </Card>
    );
  }

  const score = parseInt(analise?.score_saude_financeira || '0');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={className}>
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Análise Preditiva IA</CardTitle>
                {geradoEm && <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Insight gerado às {new Date(geradoEm).toLocaleTimeString('pt-BR')}</CardDescription>}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={gerarAnalise} 
              disabled={loading}
              className="h-10 rounded-xl border-white/10 bg-white/5 font-bold hover:bg-white/10"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Re-analisar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-8">
          <div className="rounded-[2rem] border border-white/5 bg-black/20 p-8 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-1 text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Corporate Health Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-6xl font-black tracking-tighter tabular-nums", getScoreColor(analise?.score_saude_financeira || '0'))}>
                    {analise?.score_saude_financeira || 0}
                  </span>
                  <span className="text-xl font-bold text-muted-foreground/40 italic">/ 100</span>
                </div>
              </div>
              <div className="flex-1 max-w-sm w-full space-y-4">
                <div className="h-3 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn(
                      "h-full rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]",
                      score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive"
                    )} 
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed text-center italic">
                  "{analise?.resumo_executivo}"
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/5 p-1 text-muted-foreground w-full border border-white/10 backdrop-blur-xl mb-6">
              <TabsTrigger value="visao-geral" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-xs gap-2">
                <PieChart className="h-3.5 w-3.5" />
                Snapshot
              </TabsTrigger>
              <TabsTrigger value="tendencias" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-xs gap-2">
                <BarChart3 className="h-3.5 w-3.5" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="projecoes" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-xs gap-2">
                <Target className="h-3.5 w-3.5" />
                Target
              </TabsTrigger>
              <TabsTrigger value="alertas" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-xs gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Risks
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[300px]">
              <TabsContent value="visao-geral" className="mt-0 outline-none">
                <PrevisaoIAVisaoGeral indicadores={analise?.indicadores_chave} inadimplencia={analise?.analise_inadimplencia} getTendenciaIcon={getTendenciaIcon} />
              </TabsContent>
              <TabsContent value="tendencias" className="mt-0 outline-none">
                {analise?.analise_tendencias && <PrevisaoIATendencias tendencias={analise.analise_tendencias} getTendenciaIcon={getTendenciaIcon} getTendenciaColor={getTendenciaColor} />}
              </TabsContent>
              <TabsContent value="projecoes" className="mt-0 outline-none">
                <PrevisaoIAProjecoes projecao={analise?.projecao_fluxo_caixa} recomendacoes={analise?.recomendacoes} parseValor={parseValor} />
              </TabsContent>
              <TabsContent value="alertas" className="mt-0 outline-none">
                <PrevisaoIAAlertas alertas={analise?.alertas} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
