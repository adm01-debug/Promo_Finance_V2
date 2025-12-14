import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  FileText,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  BarChart3,
  Eye,
  Loader2,
  Filter,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRelatoriosAgendados, type CreateRelatorioInput, type HistoricoRelatorio } from '@/hooks/useRelatoriosAgendados';
import { useEmpresas } from '@/hooks/useFinancialData';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VisualizarRelatorioDialog } from './VisualizarRelatorioDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const tiposRelatorio = [
  { value: 'fluxo_caixa', label: 'Fluxo de Caixa', icon: BarChart3 },
  { value: 'contas_pagar', label: 'Contas a Pagar', icon: FileText },
  { value: 'contas_receber', label: 'Contas a Receber', icon: FileText },
  { value: 'dre', label: 'DRE - Demonstrativo de Resultados', icon: FileText },
  { value: 'balanco', label: 'Balanço Patrimonial', icon: FileText },
  { value: 'inadimplencia', label: 'Análise de Inadimplência', icon: AlertCircle },
];

const frequencias = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
];

const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export function RelatoriosAgendados() {
  const { relatorios, historico, isLoading, create, delete: deleteRelatorio, toggleAtivo, isCreating, refetch } = useRelatoriosAgendados();
  const { data: empresas = [] } = useEmpresas();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedHistorico, setSelectedHistorico] = useState<HistoricoRelatorio | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Filtros do histórico
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  // Filtrar histórico
  const historicoFiltrado = historico.filter((item) => {
    const relatorio = relatorios.find(r => r.id === item.relatorio_agendado_id);
    
    // Filtro por tipo
    if (filtroTipo !== 'todos' && relatorio?.tipo_relatorio !== filtroTipo) {
      return false;
    }
    
    // Filtro por status
    if (filtroStatus !== 'todos' && item.status !== filtroStatus) {
      return false;
    }
    
    // Filtro por data
    const itemDate = new Date(item.executado_em);
    if (filtroDataInicio) {
      const dataInicio = new Date(filtroDataInicio);
      dataInicio.setHours(0, 0, 0, 0);
      if (itemDate < dataInicio) return false;
    }
    if (filtroDataFim) {
      const dataFim = new Date(filtroDataFim);
      dataFim.setHours(23, 59, 59, 999);
      if (itemDate > dataFim) return false;
    }
    
    return true;
  });

  const limparFiltros = () => {
    setFiltroTipo('todos');
    setFiltroStatus('todos');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };

  const temFiltrosAtivos = filtroTipo !== 'todos' || filtroStatus !== 'todos' || filtroDataInicio || filtroDataFim;
  
  const [formData, setFormData] = useState<CreateRelatorioInput>({
    nome: '',
    tipo_relatorio: '',
    frequencia: 'diario',
    dia_semana: null,
    dia_mes: null,
    hora_execucao: '08:00',
    empresa_id: null,
  });

  const handleCreate = () => {
    create(formData);
    setDialogOpen(false);
    setFormData({
      nome: '',
      tipo_relatorio: '',
      frequencia: 'diario',
      dia_semana: null,
      dia_mes: null,
      hora_execucao: '08:00',
      empresa_id: null,
    });
  };

  const handleDelete = () => {
    if (selectedId) {
      deleteRelatorio(selectedId);
      setDeleteDialogOpen(false);
      setSelectedId(null);
    }
  };

  const handleExecuteManual = async (relatorioId: string, relatorioNome: string) => {
    setExecutingId(relatorioId);
    try {
      const { data, error } = await supabase.functions.invoke('executar-relatorios', {
        body: { relatorio_id: relatorioId },
      });

      if (error) throw error;

      toast({
        title: 'Relatório executado',
        description: `"${relatorioNome}" foi gerado com sucesso.`,
      });

      // Refresh data to show new history entry
      refetch();
    } catch (err) {
      console.error('Erro ao executar relatório:', err);
      toast({
        title: 'Erro ao executar',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      });
    } finally {
      setExecutingId(null);
    }
  };

  const getTipoLabel = (tipo: string) => {
    return tiposRelatorio.find(t => t.value === tipo)?.label || tipo;
  };

  const getFrequenciaLabel = (freq: string) => {
    return frequencias.find(f => f.value === freq)?.label || freq;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'gerado':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Gerado</Badge>;
      case 'enviado':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'erro':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewReport = (item: HistoricoRelatorio) => {
    setSelectedHistorico(item);
    setViewDialogOpen(true);
  };

  const getRelatorioNome = (item: HistoricoRelatorio) => {
    const relatorio = relatorios.find(r => r.id === item.relatorio_agendado_id);
    return relatorio?.nome || 'Relatório removido';
  };

  const getRelatorioTipo = (item: HistoricoRelatorio) => {
    const relatorio = relatorios.find(r => r.id === item.relatorio_agendado_id);
    return relatorio?.tipo_relatorio || '';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="agendados" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="agendados" className="gap-2">
              <Calendar className="h-4 w-4" />
              Agendados
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        <TabsContent value="agendados">
          {relatorios.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum relatório agendado</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Configure relatórios para geração automática
                </p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Agendamento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {relatorios.map((relatorio, index) => (
                  <motion.div
                    key={relatorio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={!relatorio.ativo ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${relatorio.ativo ? 'bg-primary/10' : 'bg-muted'}`}>
                              <FileText className={`h-5 w-5 ${relatorio.ativo ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <h4 className="font-medium">{relatorio.nome}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getTipoLabel(relatorio.tipo_relatorio)}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {getFrequenciaLabel(relatorio.frequencia)}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {relatorio.hora_execucao.slice(0, 5)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right text-sm">
                              {relatorio.proximo_envio && (
                                <div className="text-muted-foreground">
                                  Próximo: {formatDistanceToNow(new Date(relatorio.proximo_envio), { addSuffix: true, locale: ptBR })}
                                </div>
                              )}
                              {relatorio.ultimo_envio && (
                                <div className="text-xs text-muted-foreground/70">
                                  Último: {format(new Date(relatorio.ultimo_envio), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={executingId === relatorio.id}
                                onClick={() => handleExecuteManual(relatorio.id, relatorio.nome)}
                                className="gap-1.5"
                              >
                                {executingId === relatorio.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                                Executar
                              </Button>
                              <Switch
                                checked={relatorio.ativo}
                                onCheckedChange={(ativo) => toggleAtivo({ id: relatorio.id, ativo })}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedId(relatorio.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          {historico.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum histórico</h3>
                <p className="text-muted-foreground text-sm">
                  Os relatórios gerados aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Histórico de Execuções</CardTitle>
                    <CardDescription>
                      {historicoFiltrado.length} de {historico.length} registros
                    </CardDescription>
                  </div>
                  {temFiltrosAtivos && (
                    <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-1.5">
                      <X className="h-4 w-4" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
                
                {/* Filtros */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      {tiposRelatorio.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos status</SelectItem>
                      <SelectItem value="gerado">Gerado</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      placeholder="Data início"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                      className="w-[150px]"
                    />
                    <span className="text-muted-foreground text-sm">até</span>
                    <Input
                      type="date"
                      placeholder="Data fim"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {historicoFiltrado.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>Nenhum registro encontrado com os filtros aplicados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Relatório</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicoFiltrado.map((item) => {
                        const relatorio = relatorios.find(r => r.id === item.relatorio_agendado_id);
                        const hasData = item.dados_relatorio && Object.keys(item.dados_relatorio).length > 0;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm">
                              {format(new Date(item.executado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {relatorio?.nome || 'Relatório removido'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {getTipoLabel(relatorio?.tipo_relatorio || '')}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {item.erro_mensagem || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {hasData && item.status === 'gerado' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewReport(item)}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Visualizar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para criar agendamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Relatório Agendado</DialogTitle>
            <DialogDescription>
              Configure a geração automática de relatórios
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Agendamento</Label>
              <Input
                placeholder="Ex: Relatório Semanal de Fluxo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select
                value={formData.tipo_relatorio}
                onValueChange={(value) => setFormData({ ...formData, tipo_relatorio: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposRelatorio.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  value={formData.frequencia}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    frequencia: value,
                    dia_semana: null,
                    dia_mes: null,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencias.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.hora_execucao}
                  onChange={(e) => setFormData({ ...formData, hora_execucao: e.target.value })}
                />
              </div>
            </div>
            
            {formData.frequencia === 'semanal' && (
              <div className="space-y-2">
                <Label>Dia da Semana</Label>
                <Select
                  value={formData.dia_semana?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, dia_semana: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value.toString()}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {formData.frequencia === 'mensal' && (
              <div className="space-y-2">
                <Label>Dia do Mês</Label>
                <Select
                  value={formData.dia_mes?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, dia_mes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
                      <SelectItem key={dia} value={dia.toString()}>
                        Dia {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Empresa (opcional)</Label>
              <Select
                value={formData.empresa_id || 'all'}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  empresa_id: value === 'all' ? null : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome_fantasia || empresa.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!formData.nome || !formData.tipo_relatorio || isCreating}
            >
              {isCreating ? 'Salvando...' : 'Salvar Agendamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O relatório não será mais gerado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para visualizar relatório */}
      {selectedHistorico && (
        <VisualizarRelatorioDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          tipoRelatorio={getRelatorioTipo(selectedHistorico)}
          nomeRelatorio={getRelatorioNome(selectedHistorico)}
          dados={selectedHistorico.dados_relatorio}
          executadoEm={selectedHistorico.executado_em}
        />
      )}
    </div>
  );
}
