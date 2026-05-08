import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Target, Award, Sparkles,
  Loader2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Minus,
  Lightbulb, AlertTriangle, Zap, Clock, Trophy, Shield,
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis,
  Tooltip as ReTooltip, CartesianGrid, Legend, Cell,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useContasPagar, useContasReceber, useEmpresas } from '@/hooks/useFinancialData';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { BenchmarkResultTabs } from './benchmarking/BenchmarkResultTabs';
import { BenchmarkingConcorrentes } from './benchmarking/BenchmarkingConcorrentes';
import { toast } from 'sonner';

interface Benchmark {
  metrica: string;
  valor_empresa: string;
  media_setor: string;
  melhor_setor: string;
  posicao: 'acima' | 'na_media' | 'abaixo';
  diferenca_percentual: number;
  recomendacao: string;
}

interface Oportunidade {
  titulo: string;
  descricao: string;
  impacto_estimado: string;
  prazo: 'curto' | 'medio' | 'longo';
}

interface BenchmarkResult {
  score_geral: number;
  posicao_mercado: string;
  benchmarks: Benchmark[];
  pontos_fortes: string[];
  pontos_fracos: string[];
  oportunidades: Oportunidade[];
  tendencias_setor: string[];
  resumo_executivo: string;
}

const posicaoConfig = {
  acima: { icon: ArrowUp, color: 'text-success', bg: 'bg-success/10', label: 'Acima da média' },
  na_media: { icon: Minus, color: 'text-warning', bg: 'bg-warning/10', label: 'Na média' },
  abaixo: { icon: ArrowDown, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Abaixo da média' },
};

const prazoConfig = {
  curto: { label: 'Curto prazo', color: 'bg-success/20 text-success' },
  medio: { label: 'Médio prazo', color: 'bg-warning/20 text-warning' },
  longo: { label: 'Longo prazo', color: 'bg-primary/20 text-primary' },
};

export default function BenchmarkingSetorial() {
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  const { data: contasPagar = [] } = useContasPagar();
  const { data: contasReceber = [] } = useContasReceber();
  const { data: empresas = [] } = useEmpresas();

  // Calculate metrics from real data
  const metricas = useMemo(() => {
    const totalReceitas = contasReceber.reduce((a, c) => a + (c.valor || 0), 0);
    const totalDespesas = contasPagar.reduce((a, c) => a + (c.valor || 0), 0);
    const receitasRecebidas = contasReceber.filter(c => c.status === 'pago').reduce((a, c) => a + (c.valor_recebido || c.valor || 0), 0);
    const despesasPagas = contasPagar.filter(c => c.status === 'pago').reduce((a, c) => a + (c.valor_pago || c.valor || 0), 0);
    const inadimplentes = contasReceber.filter(c => c.status === 'vencido');
    const taxaInadimplencia = contasReceber.length > 0 ? (inadimplentes.length / contasReceber.length) * 100 : 0;
    const margemOperacional = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0;
    const ticketMedio = contasReceber.length > 0 ? totalReceitas / contasReceber.length : 0;
    const totalInadimplencia = inadimplentes.reduce((a, c) => a + (c.valor || 0), 0);

    return {
      total_receitas: totalReceitas,
      total_despesas: totalDespesas,
      receitas_recebidas: receitasRecebidas,
      despesas_pagas: despesasPagas,
      margem_operacional: margemOperacional,
      taxa_inadimplencia: taxaInadimplencia,
      ticket_medio: ticketMedio,
      total_clientes: new Set(contasReceber.map(c => c.cliente_nome)).size,
      total_fornecedores: new Set(contasPagar.map(c => c.fornecedor_nome)).size,
      qtd_recebiveis: contasReceber.length,
      qtd_pagamentos: contasPagar.length,
      total_inadimplencia: totalInadimplencia,
      total_empresas: empresas.length,
    };
  }, [contasPagar, contasReceber, empresas]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('benchmarking-setorial', {
        body: { metricas, setor: 'Eventos e Produção' },
      });
      if (error) throw error;
      return data as BenchmarkResult;
    },
    onSuccess: (data) => setResult(data),
    onError: (err) => toast.error('Erro: ' + (err instanceof Error ? err.message : 'Desconhecido')),
  });

  const scoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  // Radar chart data
  const radarData = useMemo(() => {
    if (!result?.benchmarks) return [];
    return result.benchmarks.slice(0, 6).map(b => ({
      metrica: b.metrica.length > 15 ? b.metrica.substring(0, 15) + '...' : b.metrica,
      empresa: Math.min(100, Math.max(0, 50 + b.diferenca_percentual)),
      setor: 50,
    }));
  }, [result]);

  // Bar chart data
  const barData = useMemo(() => {
    if (!result?.benchmarks) return [];
    return result.benchmarks.map(b => ({
      metrica: b.metrica.length > 12 ? b.metrica.substring(0, 12) + '...' : b.metrica,
      diferenca: b.diferenca_percentual,
    }));
  }, [result]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Benchmarking Setorial
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Compare suas métricas com o mercado de eventos e identifique oportunidades
            </p>
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            size="lg"
            className="gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            {mutation.isPending ? 'Analisando mercado...' : result ? 'Reanalisar' : 'Analisar com IA'}
          </Button>
        </div>

        {/* Metrics Summary (always visible) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Receitas</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(metricas.total_receitas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Despesas</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(metricas.total_despesas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Margem</span>
              </div>
              <p className={cn('text-lg font-bold', metricas.margem_operacional >= 0 ? 'text-success' : 'text-destructive')}>
                {metricas.margem_operacional.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Inadimplência</span>
              </div>
              <p className={cn('text-lg font-bold', metricas.taxa_inadimplencia > 5 ? 'text-destructive' : 'text-success')}>
                {metricas.taxa_inadimplencia.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn('text-5xl font-bold', scoreColor(result.score_geral))}>
                        {result.score_geral}
                      </div>
                      <Progress value={result.score_geral} className="h-3 w-24" />
                      <Badge variant="outline" className="text-xs">
                        {result.posicao_mercado === 'acima_media' ? '🏆 Acima da média' :
                         result.posicao_mercado === 'na_media' ? '📊 Na média' : '⚠️ Abaixo da média'}
                      </Badge>
                    </div>
                    <Separator orientation="vertical" className="hidden md:block h-20" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-relaxed">{result.resumo_executivo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <BenchmarkResultTabs result={result} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!result && !mutation.isPending && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Descubra sua posição no mercado</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                A IA irá analisar suas métricas financeiras e comparar com benchmarks
                do setor de eventos, identificando pontos fortes, oportunidades e tendências.
              </p>
              <Button onClick={() => mutation.mutate()} size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Iniciar Análise de Benchmarking
              </Button>
            </CardContent>
          </Card>
        )}

        {mutation.isPending && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Analisando suas métricas vs mercado de eventos...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
