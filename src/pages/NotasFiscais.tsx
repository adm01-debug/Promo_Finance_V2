import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, Download, Eye, Plus, Search, Copy, FileCode, Ban,
  Calendar, Clock, RefreshCw, CheckCircle2, XCircle, Loader2,
  TrendingUp, DollarSign, Hash, BarChart3, History, Shield, Activity,
  ExternalLink, FileX as FileXIcon
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { NotaFiscal, statusConfig, mockNotasFiscais } from '@/components/nfe/nfe-types';
import { NFePreview } from '@/components/nfe/NFePreview';
import { NovaNFeForm } from '@/components/nfe/NovaNFeForm';
import { EventosHistorico } from '@/components/nfe/EventosHistorico';
import { CancelamentoNFe } from '@/components/nfe/CancelamentoNFe';
import { AlertasRejeicao } from '@/components/nfe/AlertasRejeicao';
import { SefazAnalytics } from '@/components/nfe/SefazAnalytics';
import { InutilizacaoNFe } from '@/components/nfe/InutilizacaoNFe';
import { ContingenciaNFe } from '@/components/nfe/ContingenciaNFe';
import { SefazMonitor } from '@/components/nfe/SefazMonitor';
import { BlingNFePanel } from '@/components/nfe/BlingNFePanel';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function NotasFiscais() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showNovaNFe, setShowNovaNFe] = useState(false);
  const [notas, setNotas] = useState<NotaFiscal[]>(mockNotasFiscais);
  const [isConsultando, setIsConsultando] = useState(false);
  const [notaCancelar, setNotaCancelar] = useState<NotaFiscal | null>(null);

  const handleNovaNota = useCallback((novaNota: NotaFiscal) => {
    setNotas(prev => [novaNota, ...prev]);
    setShowNovaNFe(false);
  }, []);

  const handleCancelarNota = useCallback((notaId: string, justificativa: string) => {
    setNotas(prev => prev.map(nota => 
      nota.id === notaId ? { ...nota, status: 'cancelada' as const, motivoCancelamento: justificativa } : nota
    ));
    setNotaCancelar(null);
  }, []);

  const handleConsultarSefaz = useCallback(async () => {
    setIsConsultando(true);
    toast.info('Consultando status na SEFAZ...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setNotas(prev => prev.map(nota => {
      if (nota.status === 'pendente' && Math.random() > 0.2) {
        toast.success(`NF-e #${nota.numero} autorizada!`);
        return { ...nota, status: 'autorizada' as const, protocolo: `135${new Date().getFullYear()}${String(Math.floor(Math.random() * 9999999999)).padStart(10, '0')}` };
      }
      return nota;
    }));
    setIsConsultando(false);
    toast.success('Consulta SEFAZ finalizada!');
  }, []);

  const totalEmitido = notas.filter(n => n.status === 'autorizada').reduce((acc, n) => acc + n.valorTotal, 0);
  const totalCancelado = notas.filter(n => n.status === 'cancelada').reduce((acc, n) => acc + n.valorTotal, 0);
  const totalPendente = notas.filter(n => n.status === 'pendente').reduce((acc, n) => acc + n.valorTotal, 0);
  const notasAutorizadas = notas.filter(n => n.status === 'autorizada').length;

  const filteredNotas = notas.filter(nota => {
    const matchesSearch = nota.numero.includes(searchTerm) || nota.destinatarioNome.toLowerCase().includes(searchTerm.toLowerCase()) || nota.chaveAcesso.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || nota.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const kpis = [
    { label: 'Total Emitido', value: totalEmitido, count: notasAutorizadas, icon: CheckCircle2, color: 'text-success' },
    { label: 'Pendente Autorização', value: totalPendente, count: notas.filter(n => n.status === 'pendente').length, icon: Clock, color: 'text-warning' },
    { label: 'Canceladas', value: totalCancelado, count: notas.filter(n => n.status === 'cancelada').length, icon: XCircle, color: 'text-destructive' },
    { label: 'Notas Este Mês', value: notas.length, isCount: true, icon: FileText, color: 'text-primary' }
  ];

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notas Fiscais Eletrônicas</h1>
            <p className="text-muted-foreground mt-1">Emissão e controle de NF-e com integração SEFAZ</p>
          </div>
          <Dialog open={showNovaNFe} onOpenChange={setShowNovaNFe}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Emitir NF-e</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Emitir Nova NF-e</DialogTitle></DialogHeader>
              <NovaNFeForm onClose={() => setShowNovaNFe(false)} onSuccess={handleNovaNota} />
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.isCount ? kpi.value : formatCurrency(kpi.value)}</p>
                      {!kpi.isCount && kpi.count !== undefined && <p className="text-xs text-muted-foreground mt-1">{kpi.count} nota(s)</p>}
                    </div>
                    <div className={`p-3 rounded-full bg-muted ${kpi.color}`}><Icon className="h-6 w-6" /></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="notas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="notas" className="gap-2"><FileText className="h-4 w-4" /> Notas Fiscais</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
              <TabsTrigger value="inutilizacao" className="gap-2"><FileXIcon className="h-4 w-4" /> Inutilização</TabsTrigger>
              <TabsTrigger value="historico" className="gap-2"><History className="h-4 w-4" /> Histórico SEFAZ</TabsTrigger>
              <TabsTrigger value="contingencia" className="gap-2"><Shield className="h-4 w-4" /> Contingência</TabsTrigger>
              <TabsTrigger value="monitor" className="gap-2"><Activity className="h-4 w-4" /> Monitor</TabsTrigger>
              <TabsTrigger value="bling" className="gap-2"><ExternalLink className="h-4 w-4" /> Bling ERP</TabsTrigger>
            </TabsList>

            <TabsContent value="notas" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar por número, destinatário ou chave de acesso..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="autorizada">Autorizada</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                        <SelectItem value="denegada">Denegada</SelectItem>
                        <SelectItem value="inutilizada">Inutilizada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2" onClick={handleConsultarSefaz} disabled={isConsultando}>
                      {isConsultando ? (<><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</>) : (<><RefreshCw className="h-4 w-4" /> Consultar SEFAZ</>)}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Notas Fiscais Emitidas</CardTitle>
                  <CardDescription>{filteredNotas.length} nota(s) encontrada(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {filteredNotas.map((nota, index) => {
                        const StatusIcon = statusConfig[nota.status].icon;
                        return (
                          <motion.div key={nota.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="p-3 rounded-full bg-primary/10 shrink-0"><FileText className="h-5 w-5 text-primary" /></div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold">NF-e #{nota.numero}</span>
                                    <span className="text-muted-foreground text-sm">Série {nota.serie}</span>
                                    <Badge variant="outline" className={statusConfig[nota.status].color}><StatusIcon className="h-3 w-3 mr-1" />{statusConfig[nota.status].label}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">{nota.destinatarioNome}</p>
                                  <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{nota.chaveAcesso}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold text-lg">{formatCurrency(nota.valorTotal)}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" />{formatDate(nota.dataEmissao)}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Dialog>
                                  <DialogTrigger asChild><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> NF-e #{nota.numero}</DialogTitle></DialogHeader>
                                    <NFePreview nfe={nota} />
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(nota.chaveAcesso); toast.success('Chave de acesso copiada!'); }}><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => toast.success('XML baixado!')}><FileCode className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => toast.success('DANFE gerado!')}><Download className="h-4 w-4" /></Button>
                                {nota.status === 'autorizada' && (
                                  <Button variant="ghost" size="icon" onClick={() => setNotaCancelar(nota)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Cancelar NF-e"><Ban className="h-4 w-4" /></Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    {filteredNotas.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma nota fiscal encontrada</p>
                        <p className="text-sm">Tente ajustar os filtros ou emita uma nova NF-e</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-full bg-success/10"><TrendingUp className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">Taxa de Autorização</p><p className="text-2xl font-bold">{((notas.filter(n => n.status === 'autorizada').length / notas.length) * 100).toFixed(1)}%</p></div></div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-full bg-secondary/10"><DollarSign className="h-6 w-6 text-secondary" /></div><div><p className="text-sm text-muted-foreground">Ticket Médio</p><p className="text-2xl font-bold">{formatCurrency(totalEmitido / (notasAutorizadas || 1))}</p></div></div></CardContent></Card>
                <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-full bg-primary/10"><Hash className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Itens Faturados</p><p className="text-2xl font-bold">{notas.filter(n => n.status === 'autorizada').reduce((acc, n) => acc + n.itens.reduce((a, i) => a + i.quantidade, 0), 0)}</p></div></div></CardContent></Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics"><SefazAnalytics /></TabsContent>
            <TabsContent value="inutilizacao"><InutilizacaoNFe /></TabsContent>
            <TabsContent value="historico">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><EventosHistorico /></div>
                <div><AlertasRejeicao /></div>
              </div>
            </TabsContent>
            <TabsContent value="contingencia"><ContingenciaNFe /></TabsContent>
            <TabsContent value="monitor"><SefazMonitor /></TabsContent>
            <TabsContent value="bling"><BlingNFePanel /></TabsContent>
          </Tabs>
        </motion.div>

        {notaCancelar && (
          <CancelamentoNFe
            nota={{ id: notaCancelar.id, numero: notaCancelar.numero, chaveAcesso: notaCancelar.chaveAcesso, destinatarioNome: notaCancelar.destinatarioNome, valorTotal: notaCancelar.valorTotal }}
            open={!!notaCancelar}
            onOpenChange={() => setNotaCancelar(null)}
            onCancelar={handleCancelarNota}
          />
        )}
      </motion.div>
    </MainLayout>
  );
}
