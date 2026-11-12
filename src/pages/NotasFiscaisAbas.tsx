import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Eye,
  Search,
  Copy,
  FileCode,
  Ban,
  Calendar,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Hash,
  BarChart3,
  History,
  Shield,
  Activity,
  ExternalLink,
  FileX as FileXIcon,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { statusConfig } from '@/components/nfe/nfe-types';
import type { NotaFiscal } from '@/components/nfe/nfe-types';
import { NFePreview } from '@/components/nfe/NFePreview';
import { EventosHistorico } from '@/components/nfe/EventosHistorico';
import { AlertasRejeicao } from '@/components/nfe/AlertasRejeicao';
import { SefazAnalytics } from '@/components/nfe/SefazAnalytics';
import { InutilizacaoNFe } from '@/components/nfe/InutilizacaoNFe';
import { ContingenciaNFe } from '@/components/nfe/ContingenciaNFe';
import { SefazMonitor } from '@/components/nfe/SefazMonitor';
import { BlingNFePanel } from '@/components/nfe/BlingNFePanel';

interface NotasFiscaisAbasProps {
  searchTerm: string;
  setSearchTerm: import('react').Dispatch<import('react').SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: import('react').Dispatch<import('react').SetStateAction<string>>;
  filteredNotas: NotaFiscal[];
  setNotaCancelar: import('react').Dispatch<import('react').SetStateAction<NotaFiscal>>;
  notas: NotaFiscal[];
  totalEmitido: number;
  notasAutorizadas: number;
}

export function NotasFiscaisAbas({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filteredNotas,
  setNotaCancelar,
  notas,
  totalEmitido,
  notasAutorizadas,
}: NotasFiscaisAbasProps) {
  return (
    <Tabs defaultValue="notas" className="space-y-4">
      <TabsList>
        <TabsTrigger value="notas" className="gap-2">
          <FileText className="h-4 w-4" /> Notas Fiscais
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2">
          <BarChart3 className="h-4 w-4" /> Analytics
        </TabsTrigger>
        <TabsTrigger value="inutilizacao" className="gap-2">
          <FileXIcon className="h-4 w-4" /> Inutilização
        </TabsTrigger>
        <TabsTrigger value="historico" className="gap-2">
          <History className="h-4 w-4" /> Histórico SEFAZ
        </TabsTrigger>
        <TabsTrigger value="contingencia" className="gap-2">
          <Shield className="h-4 w-4" /> Contingência
        </TabsTrigger>
        <TabsTrigger value="monitor" className="gap-2">
          <Activity className="h-4 w-4" /> Monitor
        </TabsTrigger>
        <TabsTrigger value="bling" className="gap-2">
          <ExternalLink className="h-4 w-4" /> Bling ERP
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notas" className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, destinatário ou chave de acesso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="autorizada">Autorizada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="denegada">Denegada</SelectItem>
                  <SelectItem value="inutilizada">Inutilizada</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="gap-2"
                disabled
                title="Integração SEFAZ ainda não homologada"
              >
                <RefreshCw className="h-4 w-4" /> Consulta SEFAZ indisponível
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Notas Fiscais Emitidas
            </CardTitle>
            <CardDescription>{filteredNotas.length} nota(s) encontrada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredNotas.map((nota, index) => {
                  const StatusIcon = statusConfig[nota.status].icon;
                  return (
                    <motion.div
                      key={nota.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-3 rounded-full bg-primary/10 shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">NF-e #{nota.numero}</span>
                              <span className="text-muted-foreground text-sm">
                                Série {nota.serie}
                              </span>
                              <Badge variant="outline" className={statusConfig[nota.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[nota.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {nota.destinatarioNome}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                              {nota.chaveAcesso}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg">{formatCurrency(nota.valorTotal)}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                            <Calendar className="h-3 w-3" />
                            {formatDate(nota.dataEmissao)}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5" /> NF-e #{nota.numero}
                                </DialogTitle>
                              </DialogHeader>
                              <NFePreview nfe={nota} />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(nota.chaveAcesso);
                              toast.success('Chave de acesso copiada!');
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toast.success('XML baixado!')}
                          >
                            <FileCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toast.success('DANFE gerado!')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {nota.status === 'autorizada' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setNotaCancelar(nota)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Cancelar NF-e"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Autorização</p>
                  <p className="text-2xl font-bold">
                    {(
                      (notas.filter((n) => n.status === 'autorizada').length / notas.length) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-secondary/10">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalEmitido / (notasAutorizadas || 1))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Hash className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Itens Faturados</p>
                  <p className="text-2xl font-bold">
                    {notas
                      .filter((n) => n.status === 'autorizada')
                      .reduce((acc, n) => acc + n.itens.reduce((a, i) => a + i.quantidade, 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="analytics">
        <SefazAnalytics />
      </TabsContent>
      <TabsContent value="inutilizacao">
        <InutilizacaoNFe />
      </TabsContent>
      <TabsContent value="historico">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EventosHistorico />
          </div>
          <div>
            <AlertasRejeicao />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="contingencia">
        <ContingenciaNFe />
      </TabsContent>
      <TabsContent value="monitor">
        <SefazMonitor />
      </TabsContent>
      <TabsContent value="bling">
        <BlingNFePanel />
      </TabsContent>
    </Tabs>
  );
}
