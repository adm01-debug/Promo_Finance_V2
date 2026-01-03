import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Play, Pause, Settings, Clock, CheckCircle2, 
  XCircle, RefreshCw, Zap, TrendingUp, Calendar,
  ChevronDown, ChevronUp, Edit2, Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useRPAFinanceiro, 
  TarefaRPA, 
  ExecucaoRPA,
  parseCronExpression,
  getIconeTarefa 
} from '@/hooks/useRPAFinanceiro';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RPADashboard() {
  const {
    tarefas,
    execucoes,
    estatisticas,
    toggleTarefa,
    executarTarefa,
    atualizarCron,
    isExecutando
  } = useRPAFinanceiro();

  const [tarefaExpandida, setTarefaExpandida] = useState<string | null>(null);
  const [editandoCron, setEditandoCron] = useState<string | null>(null);
  const [cronTemp, setCronTemp] = useState('');

  const handleEditCron = (tarefa: TarefaRPA) => {
    setEditandoCron(tarefa.id);
    setCronTemp(tarefa.cron_expression);
  };

  const handleSaveCron = (tarefaId: string) => {
    atualizarCron(tarefaId, cronTemp);
    setEditandoCron(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            RPA Financeiro
          </h2>
          <p className="text-muted-foreground">
            Automação inteligente de processos financeiros
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Zap className="h-4 w-4 mr-2 text-yellow-500" />
          {estatisticas.tempo_economizado_horas.toFixed(1)}h economizadas
        </Badge>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tarefas Ativas</p>
                <p className="text-2xl font-bold">
                  {estatisticas.tarefas_ativas}/{estatisticas.total_tarefas}
                </p>
              </div>
              <Bot className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Execuções</p>
                <p className="text-2xl font-bold">{estatisticas.total_execucoes}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Sucesso</p>
                <p className="text-2xl font-bold text-green-600">
                  {estatisticas.taxa_sucesso.toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Economizado</p>
                <p className="text-2xl font-bold text-amber-600">
                  {estatisticas.tempo_economizado_horas.toFixed(1)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tarefas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tarefas">Tarefas RPA</TabsTrigger>
          <TabsTrigger value="execucoes">Histórico de Execuções</TabsTrigger>
        </TabsList>

        <TabsContent value="tarefas">
          <div className="grid gap-4">
            {tarefas.map((tarefa) => (
              <motion.div
                key={tarefa.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`transition-all ${tarefa.ativo ? 'border-primary/50' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getIconeTarefa(tarefa.tipo)}</span>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {tarefa.nome}
                            <Badge variant={tarefa.ativo ? 'default' : 'secondary'}>
                              {tarefa.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{tarefa.descricao}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={tarefa.ativo}
                          onCheckedChange={() => toggleTarefa(tarefa.id)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => executarTarefa.mutate(tarefa)}
                          disabled={isExecutando}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Executar
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setTarefaExpandida(
                            tarefaExpandida === tarefa.id ? null : tarefa.id
                          )}
                        >
                          {tarefaExpandida === tarefa.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Métricas rápidas */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {editandoCron === tarefa.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={cronTemp}
                              onChange={(e) => setCronTemp(e.target.value)}
                              className="h-7 w-32 text-xs"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleSaveCron(tarefa.id)}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:text-primary flex items-center gap-1"
                            onClick={() => handleEditCron(tarefa)}
                          >
                            {parseCronExpression(tarefa.cron_expression)}
                            <Edit2 className="h-3 w-3 opacity-50" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{tarefa.execucoes_sucesso} sucesso</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>{tarefa.execucoes_erro} erros</span>
                      </div>
                      {tarefa.ultima_execucao && (
                        <span className="text-muted-foreground">
                          Última: {formatDistanceToNow(new Date(tarefa.ultima_execucao), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      )}
                    </div>

                    {/* Área expandida */}
                    <AnimatePresence>
                      {tarefaExpandida === tarefa.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Parâmetros</h4>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(tarefa.parametros, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Desempenho</h4>
                              <div className="space-y-2">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Taxa de Sucesso</span>
                                    <span>
                                      {tarefa.total_execucoes > 0
                                        ? ((tarefa.execucoes_sucesso / tarefa.total_execucoes) * 100).toFixed(0)
                                        : 100}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={tarefa.total_execucoes > 0
                                      ? (tarefa.execucoes_sucesso / tarefa.total_execucoes) * 100
                                      : 100} 
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {tarefa.total_execucoes} execuções totais
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="execucoes">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>
                Últimas execuções das tarefas automatizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {execucoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma execução registrada ainda</p>
                    <p className="text-sm">Execute uma tarefa para ver o histórico</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {execucoes.map((exec) => {
                      const tarefa = tarefas.find(t => t.id === exec.tarefa_id);
                      return (
                        <div
                          key={exec.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {tarefa ? getIconeTarefa(tarefa.tipo) : '⚙️'}
                            </span>
                            <div>
                              <p className="font-medium">{tarefa?.nome || 'Tarefa'}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(exec.iniciado_em), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {exec.status === 'executando' && (
                              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                            <Badge
                              variant={
                                exec.status === 'sucesso' ? 'default' :
                                exec.status === 'erro' ? 'destructive' :
                                exec.status === 'executando' ? 'secondary' : 'outline'
                              }
                            >
                              {exec.status === 'sucesso' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {exec.status === 'erro' && <XCircle className="h-3 w-3 mr-1" />}
                              {exec.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {exec.registros_processados} registros
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
