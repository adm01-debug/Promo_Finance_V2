import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface AnaliseHistorica {
  id: string;
  score_saude_financeira: number;
  resumo_executivo: string | null;
  analise_completa: any;
  dados_analisados: any;
  projecoes: any;
  alertas_gerados: number;
  created_at: string;
}

export function HistoricoAnalisesPreditivas() {
  const [selectedAnalise, setSelectedAnalise] = useState<AnaliseHistorica | null>(null);

  const { data: historico, isLoading } = useQuery({
    queryKey: ['historico-analises-preditivas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_analises_preditivas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AnaliseHistorica[];
    },
  });

  const { data: historicoScore } = useQuery({
    queryKey: ['historico-score-saude'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_score_saude')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreTrend = () => {
    if (!historicoScore || historicoScore.length < 2) return null;
    const diff = historicoScore[0].score - historicoScore[1].score;
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-600', text: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-600', text: `${diff}` };
    return { icon: Minus, color: 'text-muted-foreground', text: '0' };
  };

  const trend = getScoreTrend();

  const chartData = (historicoScore || [])
    .slice(0, 15)
    .reverse()
    .map((item) => ({
      data: format(new Date(item.created_at), 'dd/MM', { locale: ptBR }),
      score: item.score,
    }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Atual</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-3xl font-bold ${historicoScore?.[0]?.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {historicoScore?.[0]?.score || '--'}
                  </span>
                  {trend && (
                    <Badge variant="outline" className={trend.color}>
                      <trend.icon className="w-3 h-3 mr-1" />
                      {trend.text}
                    </Badge>
                  )}
                </div>
              </div>
              <Brain className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Análises</p>
                <p className="text-3xl font-bold">{historico?.length || 0}</p>
              </div>
              <History className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Gerados (Total)</p>
                <p className="text-3xl font-bold">
                  {historico?.reduce((acc, a) => acc + (a.alertas_gerados || 0), 0) || 0}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolução do Score de Saúde Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  name="Score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de Análises */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Análises Preditivas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {historico?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Brain className="w-12 h-12 mb-2 opacity-50" />
                <p>Nenhuma análise preditiva registrada</p>
                <p className="text-sm">As análises serão executadas automaticamente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historico?.map((analise) => (
                  <div
                    key={analise.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={getScoreColor(analise.score_saude_financeira)}>
                        {analise.score_saude_financeira}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(analise.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {analise.resumo_executivo || 'Análise automática do sistema'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Target className="w-3 h-3" />
                          {analise.dados_analisados?.contas_receber || 0} receber
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <AlertTriangle className="w-3 h-3" />
                          {analise.alertas_gerados} alertas
                        </div>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedAnalise(analise)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Brain className="w-5 h-5" />
                              Análise Preditiva - {format(new Date(analise.created_at), "dd/MM/yyyy HH:mm")}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Score e Resumo */}
                            <div className="flex items-center gap-4">
                              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${getScoreColor(analise.score_saude_financeira)}`}>
                                <span className="text-2xl font-bold">{analise.score_saude_financeira}</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">Score de Saúde Financeira</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {analise.resumo_executivo}
                                </p>
                              </div>
                            </div>

                            {/* Indicadores */}
                            {analise.analise_completa?.indicadores && (
                              <div>
                                <h4 className="font-medium mb-3">Indicadores Chave</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {Object.entries(analise.analise_completa.indicadores).map(([key, value]) => (
                                    <div key={key} className="p-3 bg-muted rounded-lg">
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {key.replace(/_/g, ' ')}
                                      </p>
                                      <p className="font-medium">{String(value)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Projeções */}
                            {analise.projecoes && (
                              <div>
                                <h4 className="font-medium mb-3">Projeções de Fluxo de Caixa</h4>
                                <div className="grid grid-cols-3 gap-3">
                                  {Object.entries(analise.projecoes).map(([periodo, valores]: [string, any]) => (
                                    <div key={periodo} className="p-3 border rounded-lg">
                                      <p className="text-xs text-muted-foreground capitalize mb-2">
                                        {periodo.replace(/_/g, ' ')}
                                      </p>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-green-600">Entradas:</span>
                                          <span>R$ {(valores.entradas || valores.entradas_previstas || 0).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-red-600">Saídas:</span>
                                          <span>R$ {(valores.saidas || valores.saidas_previstas || 0).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex justify-between font-medium border-t pt-1">
                                          <span>Saldo:</span>
                                          <span className={valores.saldo >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            R$ {(valores.saldo || valores.saldo_projetado || 0).toLocaleString('pt-BR')}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recomendações */}
                            {analise.analise_completa?.acoes_recomendadas && (
                              <div>
                                <h4 className="font-medium mb-3">Ações Recomendadas</h4>
                                <ul className="space-y-2">
                                  {analise.analise_completa.acoes_recomendadas.map((acao: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                                      <span className="text-sm">{acao}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
