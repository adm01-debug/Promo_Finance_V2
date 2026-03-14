import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, 
  RefreshCw, Shield, AlertTriangle, 
  Users, Target, ChevronRight,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useScoringClientes, ClienteScore } from '@/hooks/useScoringClientes';
import { formatCurrency } from '@/lib/formatters';
import { motion } from 'framer-motion';

const CORES_CLASSIFICACAO: Record<string, string> = {
  A: 'bg-success',
  B: 'bg-primary',
  C: 'bg-warning',
  D: 'bg-warning/70',
  E: 'bg-destructive',
};

const CORES_RISCO: Record<string, string> = {
  baixo: 'text-success bg-success/10',
  medio: 'text-warning bg-warning/10',
  alto: 'text-warning bg-warning/20',
  critico: 'text-destructive bg-destructive/10',
};

export function ScoringClientesPanel() {
  const { 
    clientesComScore, 
    estatisticas, 
    isLoading,
    recalcularScore,
    isRecalculando
  } = useScoringClientes();

  const [busca, setBusca] = useState('');
  const [filtroClassificacao, setFiltroClassificacao] = useState<string | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteScore | null>(null);

  const clientesFiltrados = clientesComScore.filter(c => {
    const matchBusca = c.clienteNome.toLowerCase().includes(busca.toLowerCase());
    const matchClassificacao = !filtroClassificacao || c.classificacao === filtroClassificacao;
    return matchBusca && matchClassificacao;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Calculando scores...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(['A', 'B', 'C', 'D', 'E'] as const).map(classificacao => (
          <Card 
            key={classificacao}
            className={`cursor-pointer transition-all ${
              filtroClassificacao === classificacao ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => setFiltroClassificacao(
              filtroClassificacao === classificacao ? null : classificacao
            )}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-full ${CORES_CLASSIFICACAO[classificacao]} flex items-center justify-center text-white font-bold text-lg`}>
                  {classificacao}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{estatisticas.porClassificacao[classificacao]}</p>
                  <p className="text-xs text-muted-foreground">clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score Médio</p>
                <p className="text-3xl font-bold">{estatisticas.scoreMedio}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={estatisticas.scoreMedio / 10} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Risco Alto</p>
                <p className="text-3xl font-bold text-destructive">{estatisticas.clientesRiscoAlto}</p>
              </div>
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {((estatisticas.clientesRiscoAlto / Math.max(1, estatisticas.totalClientes)) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Melhorando</p>
                <p className="text-3xl font-bold text-success">{estatisticas.clientesMelhorando}</p>
              </div>
              <div className="p-3 rounded-full bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Score subindo nos últimos 3 meses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ranking de Clientes
                </CardTitle>
                <CardDescription>
                  {clientesFiltrados.length} clientes {filtroClassificacao ? `classificação ${filtroClassificacao}` : ''}
                </CardDescription>
              </div>
              <Input
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-48"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {clientesFiltrados.map((cliente, idx) => (
                  <motion.div
                    key={cliente.clienteId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      clienteSelecionado?.clienteId === cliente.clienteId 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setClienteSelecionado(cliente)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-mono">#{idx + 1}</span>
                          <div className={`w-8 h-8 rounded-full ${CORES_CLASSIFICACAO[cliente.classificacao]} flex items-center justify-center text-white font-bold text-sm`}>
                            {cliente.classificacao}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{cliente.clienteNome}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={CORES_RISCO[cliente.risco]}>
                              {cliente.risco}
                            </Badge>
                            {cliente.tendencia === 'subindo' && (
                              <ArrowUpRight className="h-4 w-4 text-success" />
                            )}
                            {cliente.tendencia === 'descendo' && (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{cliente.score}</p>
                        <p className="text-xs text-muted-foreground">
                          Limite: {formatCurrency(cliente.limiteRecomendado)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detalhes do Cliente Selecionado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Análise Detalhada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clienteSelecionado ? (
              <div className="space-y-4">
                <div className="text-center pb-4 border-b">
                  <div className={`inline-flex w-16 h-16 rounded-full ${CORES_CLASSIFICACAO[clienteSelecionado.classificacao]} items-center justify-center text-white font-bold text-2xl mb-2`}>
                    {clienteSelecionado.classificacao}
                  </div>
                  <h3 className="font-semibold">{clienteSelecionado.clienteNome}</h3>
                  <p className="text-3xl font-bold mt-1">{clienteSelecionado.score}</p>
                  <Badge className={CORES_RISCO[clienteSelecionado.risco]}>
                    Risco {clienteSelecionado.risco}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">FATORES DO SCORE</h4>
                  {clienteSelecionado.fatores.map((fator, idx) => (
                    <TooltipProvider key={idx}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1">
                                {fator.impacto === 'positivo' && <TrendingUp className="h-3 w-3 text-success" />}
                                {fator.impacto === 'negativo' && <TrendingDown className="h-3 w-3 text-destructive" />}
                                {fator.impacto === 'neutro' && <Minus className="h-3 w-3 text-muted-foreground" />}
                                {fator.nome}
                              </span>
                              <span className="font-semibold">{fator.valor}</span>
                            </div>
                            <Progress 
                              value={(fator.valor / 250) * 100} 
                              className={`h-1.5 ${
                                fator.impacto === 'positivo' ? '[&>div]:bg-success' :
                                fator.impacto === 'negativo' ? '[&>div]:bg-destructive' : ''
                              }`}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{fator.descricao}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Limite Recomendado</span>
                    <span className="font-bold text-lg">{formatCurrency(clienteSelecionado.limiteRecomendado)}</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => recalcularScore(clienteSelecionado.clienteId)}
                    disabled={isRecalculando}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculando ? 'animate-spin' : ''}`} />
                    Recalcular Score
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Selecione um cliente para ver a análise detalhada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
