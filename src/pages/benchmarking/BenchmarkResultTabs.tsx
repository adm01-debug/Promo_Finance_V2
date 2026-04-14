import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUp, ArrowDown, Minus, Lightbulb, AlertTriangle, Zap, Clock,
  TrendingUp, Shield, Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis,
  Tooltip as ReTooltip, CartesianGrid, Legend, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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

interface Props {
  result: BenchmarkResult;
}

export function BenchmarkResultTabs({ result }: Props) {
  const radarData = useMemo(() => {
    return result.benchmarks.slice(0, 6).map(b => ({
      metrica: b.metrica.length > 15 ? b.metrica.substring(0, 15) + '...' : b.metrica,
      empresa: Math.min(100, Math.max(0, 50 + b.diferenca_percentual)),
      setor: 50,
    }));
  }, [result]);

  const barData = useMemo(() => {
    return result.benchmarks.map(b => ({
      metrica: b.metrica.length > 12 ? b.metrica.substring(0, 12) + '...' : b.metrica,
      diferenca: b.diferenca_percentual,
    }));
  }, [result]);

  return (
    <Tabs defaultValue="benchmarks" className="space-y-4">
      <TabsList className="grid grid-cols-4 w-full max-w-lg">
        <TabsTrigger value="benchmarks">Métricas</TabsTrigger>
        <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
        <TabsTrigger value="tendencias">Tendências</TabsTrigger>
      </TabsList>

      {/* Benchmarks */}
      <TabsContent value="benchmarks" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.benchmarks.map((b, i) => {
            const config = posicaoConfig[b.posicao] || posicaoConfig.na_media;
            const Icon = config.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={cn('border', b.posicao === 'acima' ? 'border-success/30' : b.posicao === 'abaixo' ? 'border-destructive/30' : 'border-warning/30')}>
                  <CardContent className="pt-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{b.metrica}</span>
                      <Badge variant="outline" className={cn('text-xs gap-1', config.color, config.bg)}>
                        <Icon className="h-3 w-3" />
                        {b.diferenca_percentual > 0 ? '+' : ''}{b.diferenca_percentual}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-1.5 rounded bg-primary/10 text-center">
                        <span className="text-muted-foreground block">Sua empresa</span>
                        <span className="font-semibold">{b.valor_empresa}</span>
                      </div>
                      <div className="p-1.5 rounded bg-muted text-center">
                        <span className="text-muted-foreground block">Média setor</span>
                        <span className="font-semibold">{b.media_setor}</span>
                      </div>
                      <div className="p-1.5 rounded bg-success/10 text-center">
                        <span className="text-muted-foreground block">Top 25%</span>
                        <span className="font-semibold">{b.melhor_setor}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                      {b.recomendacao}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <Card className="border-success/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-success">
                <Shield className="h-4 w-4" /> Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.pontos_fortes.map((p, i) => (
                  <li key={i} className="text-xs flex items-start gap-2"><span className="text-success mt-0.5">✓</span> {p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Pontos de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {result.pontos_fracos.map((p, i) => (
                  <li key={i} className="text-xs flex items-start gap-2"><span className="text-destructive mt-0.5">⚠</span> {p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Charts */}
      <TabsContent value="graficos" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Radar de Competitividade</CardTitle>
              <CardDescription>Sua empresa vs média do setor</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="metrica" className="text-xs fill-muted-foreground" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs fill-muted-foreground" />
                  <Radar name="Sua Empresa" dataKey="empresa" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Radar name="Média Setor" dataKey="setor" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Diferença vs Setor (%)</CardTitle>
              <CardDescription>Positivo = acima da média</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" />
                  <YAxis dataKey="metrica" type="category" width={100} className="text-xs fill-muted-foreground" />
                  <ReTooltip
                    formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'Diferença']}
                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="diferenca" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.diferenca >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Opportunities */}
      <TabsContent value="oportunidades" className="space-y-3">
        {result.oportunidades.map((op, i) => {
          const prazo = prazoConfig[op.prazo] || prazoConfig.medio;
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Lightbulb className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{op.titulo}</span>
                        <Badge className={cn('text-[10px]', prazo.color)}>
                          <Clock className="h-2.5 w-2.5 mr-0.5" />{prazo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{op.descricao}</p>
                      <div className="flex items-center gap-1 text-xs font-medium text-success">
                        <Zap className="h-3 w-3" /> Impacto estimado: {op.impacto_estimado}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </TabsContent>

      {/* Trends */}
      <TabsContent value="tendencias" className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Tendências do Setor de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.tendencias_setor.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="p-1.5 rounded bg-accent/10"><Sparkles className="h-4 w-4 text-accent" /></div>
                  <p className="text-sm">{t}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
