import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, RefreshCw, Sparkles, Activity, AlertTriangle, BarChart3, PieChart, Target } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
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

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } } as const;

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
      toast({ title: "Análise concluída" });
    } catch (error: unknown) {
      logger.error('Erro na análise preditiva:', error);
      toast({ title: "Erro na análise", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const getTendenciaIcon = (tendencia: string) => {
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getTendenciaColor = (tendencia: string, inverted = false) => {
    return 'text-muted-foreground';
  };

  const parseValor = (valor: string): number => {
    if (!valor) return 0;
    return parseFloat(valor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  };

  const getScoreColor = (score: string): string => {
    const s = parseInt(score) || 0;
    if (s >= 80) return 'text-emerald-600';
    if (s >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  if (!analise && !loading) {
    return (
      <Card className={cn(className, "premium-card border-none overflow-hidden")}>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-8 relative z-10 shadow-xl shadow-primary/10 animate-pulse">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-3 text-2xl font-black text-foreground tracking-tight font-heading relative z-10">IA Estratégica P14</h3>
          <p className="mb-10 max-w-sm text-sm font-medium text-muted-foreground leading-relaxed px-6 relative z-10">
            Libere o poder da inteligência preditiva para antecipar riscos e otimizar seu fluxo de caixa automaticamente.
          </p>
          <Button onClick={gerarAnalise} className="premium-button relative z-10">
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar Análise
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn(className, "border border-border bg-card shadow-sm rounded-xl")}>
        <CardHeader className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary animate-pulse">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Processando dados...</CardTitle>
              <CardDescription className="text-xs">Gerando previsões com inteligência artificial.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-6">
          <Skeleton className="h-32 w-full rounded-lg bg-muted/50" />
          <Skeleton className="h-48 w-full rounded-lg bg-muted/50" />
        </CardContent>
      </Card>
    );
  }

  const score = parseInt(analise?.score_saude_financeira || '0');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={className}>
      <Card className="premium-card border-none overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm transition-transform hover:scale-110">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-foreground tracking-tight font-heading">Insights de IA</CardTitle>
                {geradoEm && <CardDescription className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Análise gerada em {new Date(geradoEm).toLocaleTimeString('pt-BR')}</CardDescription>}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={gerarAnalise} 
              className="h-9 rounded-xl border-border bg-background text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-accent transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-2 space-y-8">
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-transparent p-8 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score Financeiro</p>
                <div className="flex items-baseline justify-center sm:justify-start gap-1">
                  <span className={cn("text-5xl font-bold tracking-tight", getScoreColor(analise?.score_saude_financeira || '0'))}>
                    {analise?.score_saude_financeira || 0}
                  </span>
                  <span className="text-base font-medium text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="flex-1 max-w-xs w-full space-y-3">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1 }}
                    className={cn(
                      "h-full rounded-full",
                      score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500"
                    )} 
                  />
                </div>
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed text-center italic">
                  "{analise?.resumo_executivo}"
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 h-9 items-center justify-center rounded-lg bg-muted/50 p-0.5 text-muted-foreground w-full border border-border mb-6">
              <TabsTrigger value="visao-geral" className="rounded-md data-[state=active]:bg-card data-[state=active]:text-primary font-bold text-[10px] gap-1.5 h-8">
                <PieChart className="h-3.5 w-3.5" />
                Resumo
              </TabsTrigger>
              <TabsTrigger value="tendencias" className="rounded-md data-[state=active]:bg-card data-[state=active]:text-primary font-bold text-[10px] gap-1.5 h-8">
                <BarChart3 className="h-3.5 w-3.5" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="projecoes" className="rounded-md data-[state=active]:bg-card data-[state=active]:text-primary font-bold text-[10px] gap-1.5 h-8">
                <Target className="h-3.5 w-3.5" />
                Metas
              </TabsTrigger>
              <TabsTrigger value="alertas" className="rounded-md data-[state=active]:bg-card data-[state=active]:text-primary font-bold text-[10px] gap-1.5 h-8">
                <AlertTriangle className="h-3.5 w-3.5" />
                Riscos
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[250px]">
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