import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Calendar, Plus, History, CheckCircle, XCircle, AlertCircle, Eye, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRelatoriosAgendados, type CreateRelatorioInput, type HistoricoRelatorio } from '@/hooks/useRelatoriosAgendados';
import { useEmpresas } from '@/hooks/useFinancialData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { VisualizarRelatorioDialog } from './VisualizarRelatorioDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { AgendamentoCard } from './agendados/AgendamentoCard';
import { CriarAgendamentoDialog } from './agendados/CriarAgendamentoDialog';

const tiposRelatorio = [
  { value: 'fluxo_caixa', label: 'Fluxo de Caixa' },
  { value: 'contas_pagar', label: 'Contas a Pagar' },
  { value: 'contas_receber', label: 'Contas a Receber' },
  { value: 'dre', label: 'DRE - Demonstrativo de Resultados' },
  { value: 'balanco', label: 'Balanço Patrimonial' },
  { value: 'inadimplencia', label: 'Análise de Inadimplência' },
];

const frequencias = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
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
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  const [formData, setFormData] = useState<CreateRelatorioInput>({
    nome: '', tipo_relatorio: '', frequencia: 'diario', dia_semana: null, dia_mes: null, hora_execucao: '08:00', empresa_id: null,
  });

  const historicoFiltrado = historico.filter((item) => {
    const relatorio = relatorios.find(r => r.id === item.relatorio_agendado_id);
    if (filtroTipo !== 'todos' && relatorio?.tipo_relatorio !== filtroTipo) return false;
    if (filtroStatus !== 'todos' && item.status !== filtroStatus) return false;
    const itemDate = new Date(item.executado_em);
    if (filtroDataInicio) { const d = new Date(filtroDataInicio); d.setHours(0,0,0,0); if (itemDate < d) return false; }
    if (filtroDataFim) { const d = new Date(filtroDataFim); d.setHours(23,59,59,999); if (itemDate > d) return false; }
    return true;
  });

  const temFiltrosAtivos = filtroTipo !== 'todos' || filtroStatus !== 'todos' || filtroDataInicio || filtroDataFim;
  const limparFiltros = () => { setFiltroTipo('todos'); setFiltroStatus('todos'); setFiltroDataInicio(''); setFiltroDataFim(''); };

  const handleCreate = () => { create(formData); setDialogOpen(false); setFormData({ nome: '', tipo_relatorio: '', frequencia: 'diario', dia_semana: null, dia_mes: null, hora_execucao: '08:00', empresa_id: null }); };
  const handleDelete = () => { if (selectedId) { deleteRelatorio(selectedId); setDeleteDialogOpen(false); setSelectedId(null); } };

  const handleExecuteManual = async (relatorioId: string, relatorioNome: string) => {
    setExecutingId(relatorioId);
    try {
      const { error } = await supabase.functions.invoke('executar-relatorios', { body: { relatorio_id: relatorioId } });
      if (error) throw error;
      toast({ title: 'Relatório executado', description: `"${relatorioNome}" foi gerado com sucesso.` });
      refetch();
    } catch (err: unknown) {
      logger.error('Erro ao executar relatório:', err);
      toast({ title: 'Erro ao executar', description: 'Não foi possível gerar o relatório.', variant: 'destructive' });
    } finally { setExecutingId(null); }
  };

  const getTipoLabel = (tipo: string) => tiposRelatorio.find(t => t.value === tipo)?.label || tipo;
  const getFrequenciaLabel = (freq: string) => frequencias.find(f => f.value === freq)?.label || freq;
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'gerado': return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Gerado</Badge>;
      case 'enviado': return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'erro': return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="agendados" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="agendados" className="gap-2"><Calendar className="h-4 w-4" />Agendados</TabsTrigger>
            <TabsTrigger value="historico" className="gap-2"><History className="h-4 w-4" />Histórico</TabsTrigger>
          </TabsList>
          <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo Agendamento</Button>
        </div>

        <TabsContent value="agendados">
          {relatorios.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12"><Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" /><h3 className="text-lg font-medium mb-2">Nenhum relatório agendado</h3><p className="text-muted-foreground text-sm mb-4">Configure relatórios para geração automática</p><Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Criar Agendamento</Button></CardContent></Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {relatorios.map((relatorio, index) => (
                  <AgendamentoCard key={relatorio.id} relatorio={relatorio} index={index} executingId={executingId} getTipoLabel={getTipoLabel} getFrequenciaLabel={getFrequenciaLabel} onExecute={handleExecuteManual} onToggle={(id, ativo) => toggleAtivo({ id, ativo })} onDelete={(id) => { setSelectedId(id); setDeleteDialogOpen(true); }} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          {historico.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-12"><History className="h-12 w-12 text-muted-foreground/50 mb-4" /><h3 className="text-lg font-medium mb-2">Nenhum histórico</h3><p className="text-muted-foreground text-sm">Os relatórios gerados aparecerão aqui</p></CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-lg">Histórico de Execuções</CardTitle><CardDescription>{historicoFiltrado.length} de {historico.length} registros</CardDescription></div>
                  {temFiltrosAtivos && <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-1.5"><X className="h-4 w-4" />Limpar filtros</Button>}
                </div>
                <div className="flex flex-wrap gap-3 pt-4">
                  <Filter className="h-4 w-4 text-muted-foreground mt-2" />
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os tipos</SelectItem>{tiposRelatorio.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos status</SelectItem><SelectItem value="gerado">Gerado</SelectItem><SelectItem value="enviado">Enviado</SelectItem><SelectItem value="erro">Erro</SelectItem></SelectContent></Select>
                  <div className="flex items-center gap-2"><Input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} className="w-[150px]" /><span className="text-muted-foreground text-sm">até</span><Input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} className="w-[150px]" /></div>
                </div>
              </CardHeader>
              <CardContent>
                {historicoFiltrado.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><AlertCircle className="h-8 w-8 mb-2" /><p>Nenhum registro encontrado com os filtros aplicados</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>Relatório</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Mensagem</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {historicoFiltrado.map((item) => {
                        const relatorio = relatorios.find(r => r.id === item.relatorio_agendado_id);
                        const hasData = item.dados_relatorio && Object.keys(item.dados_relatorio).length > 0;
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm">{format(new Date(item.executado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell className="font-medium">{relatorio?.nome || 'Relatório removido'}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{getTipoLabel(relatorio?.tipo_relatorio || '')}</Badge></TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.erro_mensagem || '-'}</TableCell>
                            <TableCell className="text-right">{hasData && item.status === 'gerado' && <Button variant="ghost" size="sm" onClick={() => { setSelectedHistorico(item); setViewDialogOpen(true); }} className="gap-2"><Eye className="h-4 w-4" />Visualizar</Button>}</TableCell>
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

      <CriarAgendamentoDialog open={dialogOpen} onOpenChange={setDialogOpen} formData={formData} setFormData={setFormData} onCreate={handleCreate} isCreating={isCreating} empresas={empresas} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir agendamento?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedHistorico && (
        <VisualizarRelatorioDialog
          open={viewDialogOpen} onOpenChange={setViewDialogOpen}
          tipoRelatorio={relatorios.find(r => r.id === selectedHistorico.relatorio_agendado_id)?.tipo_relatorio || ''}
          nomeRelatorio={relatorios.find(r => r.id === selectedHistorico.relatorio_agendado_id)?.nome || 'Relatório removido'}
          dados={selectedHistorico.dados_relatorio}
          executadoEm={selectedHistorico.executado_em}
        />
      )}
    </div>
  );
}
