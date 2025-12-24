import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Brain,
  Loader2,
  RefreshCw,
  Users,
  DollarSign,
  Calendar,
  ChevronRight,
  Shield,
  Target,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClienteRisco {
  id: string;
  nome: string;
  nomeFantasia: string | null;
  score: number;
  totalPendente: number;
  diasAteVencimento: number;
  historicoAtrasos: number;
  probabilidadeAtraso: number;
  nivelRisco: 'alto' | 'medio' | 'baixo';
  fatoresRisco: string[];
  acaoSugerida: string;
}

interface AnaliseInadimplencia {
  clientes: ClienteRisco[];
  resumo: {
    totalEmRisco: number;
    clientesAltoRisco: number;
    clientesMedioRisco: number;
    clientesBaixoRisco: number;
    valorTotalRisco: number;
  };
  geradoEm: string;
}

function calcularProbabilidadeAtraso(cliente: any, contasPendentes: any[], historicoContas: any[]): number {
  let score = 0;
  
  // Fator 1: Score do cliente (peso 30%)
  const scoreCliente = cliente.score || 100;
  if (scoreCliente < 50) score += 30;
  else if (scoreCliente < 70) score += 20;
  else if (scoreCliente < 85) score += 10;
  
  // Fator 2: Histórico de atrasos (peso 40%)
  const contasVencidas = historicoContas.filter(c => c.status === 'vencido');
  const taxaAtraso = historicoContas.length > 0 
    ? (contasVencidas.length / historicoContas.length) * 100 
    : 0;
  if (taxaAtraso > 30) score += 40;
  else if (taxaAtraso > 15) score += 25;
  else if (taxaAtraso > 5) score += 10;
  
  // Fator 3: Valor pendente vs limite (peso 20%)
  const totalPendente = contasPendentes.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  const limiteCredito = cliente.limite_credito || 10000;
  const utilizacao = (totalPendente / limiteCredito) * 100;
  if (utilizacao > 100) score += 20;
  else if (utilizacao > 80) score += 15;
  else if (utilizacao > 50) score += 5;
  
  // Fator 4: Proximidade do vencimento (peso 10%)
  const proximoVencimento = contasPendentes
    .map(c => new Date(c.data_vencimento))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  
  if (proximoVencimento) {
    const diasAteVencimento = differenceInDays(proximoVencimento, new Date());
    if (diasAteVencimento <= 3) score += 10;
    else if (diasAteVencimento <= 7) score += 5;
  }
  
  return Math.min(score, 100);
}

function determinarNivelRisco(probabilidade: number): 'alto' | 'medio' | 'baixo' {
  if (probabilidade >= 60) return 'alto';
  if (probabilidade >= 30) return 'medio';
  return 'baixo';
}

function gerarFatoresRisco(cliente: any, contasPendentes: any[], historicoContas: any[]): string[] {
  const fatores: string[] = [];
  
  if ((cliente.score || 100) < 70) {
    fatores.push(`Score baixo (${cliente.score || 0})`);
  }
  
  const contasVencidas = historicoContas.filter(c => c.status === 'vencido');
  if (contasVencidas.length > 0) {
    fatores.push(`${contasVencidas.length} atraso(s) no histórico`);
  }
  
  const totalPendente = contasPendentes.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  if (totalPendente > (cliente.limite_credito || 10000)) {
    fatores.push('Limite de crédito excedido');
  }
  
  const proximoVencimento = contasPendentes
    .map(c => new Date(c.data_vencimento))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  
  if (proximoVencimento && differenceInDays(proximoVencimento, new Date()) <= 7) {
    fatores.push('Vencimento próximo');
  }
  
  return fatores.length > 0 ? fatores : ['Nenhum fator de risco identificado'];
}

function gerarAcaoSugerida(nivelRisco: 'alto' | 'medio' | 'baixo', fatores: string[]): string {
  if (nivelRisco === 'alto') {
    if (fatores.some(f => f.includes('atraso'))) {
      return 'Entrar em contato imediatamente para negociação preventiva';
    }
    return 'Monitorar de perto e preparar régua de cobrança preventiva';
  }
  if (nivelRisco === 'medio') {
    return 'Enviar lembrete amigável antes do vencimento';
  }
  return 'Manter acompanhamento padrão';
}

function useAnaliseInadimplencia() {
  return useQuery({
    queryKey: ['analise-inadimplencia'],
    queryFn: async (): Promise<AnaliseInadimplencia> => {
      const hoje = new Date();
      const em30Dias = addDays(hoje, 30);
      
      // Buscar clientes com contas pendentes nos próximos 30 dias
      const { data: contasPendentes } = await supabase
        .from('contas_receber')
        .select(`
          id, valor, valor_recebido, data_vencimento, status, cliente_id, cliente_nome,
          clientes(id, razao_social, nome_fantasia, score, limite_credito)
        `)
        .in('status', ['pendente', 'parcial'])
        .gte('data_vencimento', format(hoje, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(em30Dias, 'yyyy-MM-dd'))
        .order('data_vencimento');
      
      if (!contasPendentes || contasPendentes.length === 0) {
        return {
          clientes: [],
          resumo: {
            totalEmRisco: 0,
            clientesAltoRisco: 0,
            clientesMedioRisco: 0,
            clientesBaixoRisco: 0,
            valorTotalRisco: 0,
          },
          geradoEm: new Date().toISOString(),
        };
      }
      
      // Agrupar por cliente
      const clientesMap = new Map<string, any>();
      contasPendentes.forEach(conta => {
        const clienteId = conta.cliente_id || conta.cliente_nome;
        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            cliente: conta.clientes || { razao_social: conta.cliente_nome },
            contas: [],
          });
        }
        clientesMap.get(clienteId).contas.push(conta);
      });
      
      // Buscar histórico de cada cliente
      const clientesAnalise: ClienteRisco[] = [];
      
      for (const [clienteId, { cliente, contas }] of clientesMap.entries()) {
        // Buscar histórico
        const { data: historico } = await supabase
          .from('contas_receber')
          .select('status')
          .eq('cliente_id', clienteId)
          .lt('data_vencimento', format(hoje, 'yyyy-MM-dd'));
        
        const probabilidade = calcularProbabilidadeAtraso(cliente, contas, historico || []);
        const nivelRisco = determinarNivelRisco(probabilidade);
        const fatoresRisco = gerarFatoresRisco(cliente, contas, historico || []);
        
        const totalPendente = contas.reduce((sum: number, c: any) => sum + c.valor - (c.valor_recebido || 0), 0);
        const proximoVencimento = contas
          .map((c: any) => new Date(c.data_vencimento))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];
        
        clientesAnalise.push({
          id: clienteId,
          nome: cliente.razao_social || 'Cliente não identificado',
          nomeFantasia: cliente.nome_fantasia,
          score: cliente.score || 100,
          totalPendente,
          diasAteVencimento: proximoVencimento ? differenceInDays(proximoVencimento, hoje) : 0,
          historicoAtrasos: (historico || []).filter(c => c.status === 'vencido').length,
          probabilidadeAtraso: probabilidade,
          nivelRisco,
          fatoresRisco,
          acaoSugerida: gerarAcaoSugerida(nivelRisco, fatoresRisco),
        });
      }
      
      // Ordenar por probabilidade de atraso (maior primeiro)
      clientesAnalise.sort((a, b) => b.probabilidadeAtraso - a.probabilidadeAtraso);
      
      const clientesAltoRisco = clientesAnalise.filter(c => c.nivelRisco === 'alto');
      const clientesMedioRisco = clientesAnalise.filter(c => c.nivelRisco === 'medio');
      const clientesBaixoRisco = clientesAnalise.filter(c => c.nivelRisco === 'baixo');
      
      return {
        clientes: clientesAnalise,
        resumo: {
          totalEmRisco: clientesAnalise.length,
          clientesAltoRisco: clientesAltoRisco.length,
          clientesMedioRisco: clientesMedioRisco.length,
          clientesBaixoRisco: clientesBaixoRisco.length,
          valorTotalRisco: clientesAltoRisco.reduce((sum, c) => sum + c.totalPendente, 0) +
            clientesMedioRisco.reduce((sum, c) => sum + c.totalPendente, 0) * 0.5,
        },
        geradoEm: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function PrevisaoInadimplencia() {
  const [tabAtiva, setTabAtiva] = useState('todos');
  const { data, isLoading, refetch, isFetching } = useAnaliseInadimplencia();

  const clientesFiltrados = data?.clientes.filter(c => {
    if (tabAtiva === 'todos') return true;
    return c.nivelRisco === tabAtiva;
  }) || [];

  const getRiscoConfig = (nivel: 'alto' | 'medio' | 'baixo') => {
    switch (nivel) {
      case 'alto':
        return { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle, label: 'Alto Risco' };
      case 'medio':
        return { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Target, label: 'Médio Risco' };
      case 'baixo':
        return { color: 'text-success', bg: 'bg-success/10', icon: Shield, label: 'Baixo Risco' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Previsão de Inadimplência</h2>
            <p className="text-sm text-muted-foreground">
              Análise preditiva dos próximos 30 dias
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Analisando dados históricos...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Analisado</span>
                </div>
                <p className="text-2xl font-bold">{data?.resumo.totalEmRisco || 0}</p>
                <p className="text-xs text-muted-foreground">clientes com vencimentos</p>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Alto Risco</span>
                </div>
                <p className="text-2xl font-bold text-destructive">{data?.resumo.clientesAltoRisco || 0}</p>
                <p className="text-xs text-muted-foreground">requerem ação imediata</p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Médio Risco</span>
                </div>
                <p className="text-2xl font-bold text-amber-500">{data?.resumo.clientesMedioRisco || 0}</p>
                <p className="text-xs text-muted-foreground">monitorar de perto</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Valor em Risco</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(data?.resumo.valorTotalRisco || 0)}</p>
                <p className="text-xs text-muted-foreground">potencial de perda</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Clientes por Nível de Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
                <TabsList className="mb-4">
                  <TabsTrigger value="todos">
                    Todos ({data?.resumo.totalEmRisco || 0})
                  </TabsTrigger>
                  <TabsTrigger value="alto" className="text-destructive">
                    Alto ({data?.resumo.clientesAltoRisco || 0})
                  </TabsTrigger>
                  <TabsTrigger value="medio" className="text-amber-500">
                    Médio ({data?.resumo.clientesMedioRisco || 0})
                  </TabsTrigger>
                  <TabsTrigger value="baixo" className="text-success">
                    Baixo ({data?.resumo.clientesBaixoRisco || 0})
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[400px]">
                  {clientesFiltrados.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum cliente nesta categoria</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientesFiltrados.map((cliente) => {
                        const config = getRiscoConfig(cliente.nivelRisco);
                        return (
                          <motion.div
                            key={cliente.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "p-4 rounded-lg border transition-colors hover:bg-accent/50",
                              config.bg
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <config.icon className={cn("h-4 w-4", config.color)} />
                                  <span className="font-medium truncate">
                                    {cliente.nomeFantasia || cliente.nome}
                                  </span>
                                  <Badge variant="outline" className={cn("text-xs", config.color)}>
                                    {cliente.probabilidadeAtraso.toFixed(0)}% risco
                                  </Badge>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(cliente.totalPendente)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Vence em {cliente.diasAteVencimento} dia(s)
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    Score: {cliente.score}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1 mb-2">
                                  {cliente.fatoresRisco.map((fator, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {fator}
                                    </Badge>
                                  ))}
                                </div>

                                <p className="text-xs text-primary font-medium">
                                  💡 {cliente.acaoSugerida}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <Progress 
                                  value={cliente.probabilidadeAtraso} 
                                  className="w-20 h-2"
                                />
                                <Button size="sm" variant="ghost">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
