import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeftRight,
  Settings,
  History,
  Database,
  Users,
  DollarSign,
  Building2,
  Link2,
  Unlink,
  ExternalLink,
  Filter,
  Download,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import { useBitrix24 } from '@/hooks/useBitrix24';
import { BitrixWebhookPanel } from '@/components/integracoes/BitrixWebhookPanel';
import { logger } from '@/lib/logger';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function Bitrix24() {
  const { toast } = useToast();
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState('15');
  
  const {
    isConnected,
    isSyncing,
    syncProgress,
    syncLogs,
    fieldMappings,
    syncedDeals,
    syncedClients,
    stats,
    isLoading,
    testConnection,
    syncDeals,
    syncContacts,
    syncCompanies,
    exportPaymentStatus,
    fullSync,
    toggleMapping,
  } = useBitrix24();

  const handleTestConnection = async () => {
    try {
      const result = await testConnection();
      toast({
        title: result.success ? 'Conexão bem-sucedida' : 'Falha na conexão',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao testar conexão Bitrix24:', error);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const formatRelativeTime = (dateStr: string | undefined) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sucesso': return 'bg-success/10';
      case 'erro': return 'bg-destructive/10';
      case 'parcial': return 'bg-warning/10';
      default: return 'bg-secondary/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sucesso': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'erro': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'parcial': return <AlertTriangle className="h-5 w-5 text-warning" />;
      default: return <Clock className="h-5 w-5 text-secondary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bitrix24</h1>
            <p className="text-muted-foreground">
              Integração e sincronização de dados
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            className={cn(
              isConnected ? "border-green-500 text-green-600" : "border-destructive text-destructive"
            )}
          >
            {isConnected ? (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Conectado
              </>
            ) : (
              <>
                <Unlink className="h-4 w-4 mr-2" />
                Testar Conexão
              </>
            )}
          </Button>
          <Button onClick={fullSync} disabled={isSyncing || !isConnected}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Tudo'}
          </Button>
        </div>
      </div>

      {/* Progress Bar (durante sync) */}
      {isSyncing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sincronizando dados...</span>
                  <span className="text-sm text-muted-foreground">{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  isConnected ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                )}>
                  {isConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={cn(
                    "font-semibold",
                    isConnected ? "text-green-600" : "text-red-500"
                  )}>
                    {isConnected ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Última Sync</p>
                  <p className="font-semibold">{formatRelativeTime(stats.ultimaSync)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sincronizados</p>
                  <p className="font-semibold">{stats.totalSincronizados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deals</p>
                  <p className="font-semibold">{stats.dealsImportados}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Erros Hoje</p>
                  <p className="font-semibold">{stats.errosHoje}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Tabs defaultValue="deals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deals" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Deals Importados
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="mapping" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Mapeamento
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
        </TabsList>

        {/* Deals Importados */}
        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Deals do Bitrix24</CardTitle>
                  <CardDescription>
                    Negócios sincronizados como contas a receber
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => syncDeals()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar Deals
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : syncedDeals && syncedDeals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Bitrix</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncedDeals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {deal.bitrix_deal_id}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{deal.descricao}</TableCell>
                        <TableCell>{deal.cliente_nome}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(deal.valor)}
                        </TableCell>
                        <TableCell>
                          {new Date(deal.data_vencimento).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={deal.status === 'pago' ? 'default' : 'secondary'}
                            className={deal.status === 'pago' ? 'bg-green-500' : ''}
                          >
                            {deal.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum deal sincronizado ainda</p>
                  <Button variant="outline" className="mt-4" onClick={() => syncDeals()}>
                    <Play className="h-4 w-4 mr-2" />
                    Importar Deals
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clientes Importados */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Clientes do Bitrix24</CardTitle>
                  <CardDescription>
                    Contatos e empresas sincronizados
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => syncContacts()}>
                    <Users className="h-4 w-4 mr-2" />
                    Sync Contatos
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => syncCompanies()}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Sync Empresas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : syncedClients && syncedClients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Bitrix</TableHead>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncedClients.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {cliente.bitrix_id}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{cliente.razao_social}</TableCell>
                        <TableCell>{cliente.email || '-'}</TableCell>
                        <TableCell>{cliente.telefone || '-'}</TableCell>
                        <TableCell>
                          {cliente.cidade ? `${cliente.cidade}${cliente.estado ? `/${cliente.estado}` : ''}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cliente sincronizado ainda</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button variant="outline" onClick={() => syncContacts()}>
                      <Play className="h-4 w-4 mr-2" />
                      Importar Contatos
                    </Button>
                    <Button variant="outline" onClick={() => syncCompanies()}>
                      <Play className="h-4 w-4 mr-2" />
                      Importar Empresas
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapeamento de Campos */}
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mapeamento de Campos</CardTitle>
                  <CardDescription>
                    Configure como os campos do Bitrix24 são convertidos para o sistema financeiro
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : fieldMappings && fieldMappings.length > 0 ? (
                <div className="space-y-4">
                  {['deal', 'contact', 'company'].map((entidade) => {
                    const mappingsForEntity = fieldMappings.filter(m => m.entidade === entidade);
                    if (mappingsForEntity.length === 0) return null;
                    
                    return (
                      <div key={entidade} className="space-y-2">
                        <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                          {entidade === 'deal' && <DollarSign className="h-5 w-5" />}
                          {entidade === 'contact' && <Users className="h-5 w-5" />}
                          {entidade === 'company' && <Building2 className="h-5 w-5" />}
                          {entidade === 'deal' ? 'Deals' : entidade === 'contact' ? 'Contatos' : 'Empresas'}
                        </h3>
                        {mappingsForEntity.map((mapping) => (
                          <motion.div 
                            key={mapping.id}
                            variants={itemVariants}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-lg border transition-all",
                              mapping.ativo ? "bg-card" : "bg-muted/50 opacity-60"
                            )}
                          >
                            <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <p className="text-xs text-muted-foreground mb-1">Bitrix24</p>
                                <code className="font-mono text-sm font-medium">{mapping.campo_bitrix}</code>
                              </div>
                              
                              <div className="flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                  <div className="h-px w-8 bg-border" />
                                  {mapping.transformacao ? (
                                    <Badge variant="outline" className="text-xs">
                                      {mapping.transformacao}
                                    </Badge>
                                  ) : (
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <div className="h-px w-8 bg-border" />
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                                <code className="font-mono text-sm font-medium">{mapping.campo_sistema}</code>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {mapping.obrigatorio && (
                                <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                              )}
                              <Switch 
                                checked={mapping.ativo}
                                onCheckedChange={() => toggleMapping({ id: mapping.id, ativo: !mapping.ativo })}
                                disabled={mapping.obrigatorio}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum mapeamento configurado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico de Sincronização */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Sincronização</CardTitle>
              <CardDescription>
                Logs das últimas operações de sincronização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                  </div>
                ) : syncLogs && syncLogs.length > 0 ? (
                  <div className="space-y-3">
                    {syncLogs.map((log) => (
                      <motion.div 
                        key={log.id}
                        variants={itemVariants}
                        className="flex items-start gap-4 p-4 rounded-lg border"
                      >
                        <div className={cn("p-2 rounded-lg", getStatusColor(log.status))}>
                          {getStatusIcon(log.status)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              log.tipo === 'entrada' ? 'default' :
                              log.tipo === 'saida' ? 'secondary' : 'outline'
                            }>
                              {log.tipo === 'entrada' ? 'Entrada' : 
                               log.tipo === 'saida' ? 'Saída' : 'Alteração'}
                            </Badge>
                            <span className="font-medium capitalize">{log.entidade}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(log.iniciado_em)}
                            </span>
                          </div>
                          {log.mensagem_erro && (
                            <p className="text-sm text-muted-foreground">{log.mensagem_erro}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-green-600">{log.registros_processados} registros</span>
                            {log.registros_com_erro > 0 && (
                              <span className="text-red-500">{log.registros_com_erro} erros</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma sincronização realizada ainda</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração */}
        <TabsContent value="config">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conexão OAuth 2.0</CardTitle>
                <CardDescription>
                  Status da conexão com o Bitrix24
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={cn(
                  "p-4 rounded-lg border flex items-center gap-4",
                  isConnected ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"
                )}>
                  {isConnected ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {isConnected ? 'Conectado ao Bitrix24' : 'Não conectado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isConnected 
                        ? 'OAuth 2.0 ativo e tokens válidos' 
                        : 'Verifique as credenciais OAuth'}
                    </p>
                  </div>
                </div>
                
                <Button className="w-full" onClick={handleTestConnection}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Testar Conexão
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Ações Manuais</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => syncDeals()}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Sync Deals
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => syncContacts()}>
                      <Users className="h-4 w-4 mr-2" />
                      Sync Contatos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => syncCompanies()}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Sync Empresas
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportPaymentStatus()}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Exportar Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sincronização Automática</CardTitle>
                <CardDescription>
                  Configure a frequência de sincronização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sync Automática</p>
                    <p className="text-sm text-muted-foreground">Sincronizar dados automaticamente</p>
                  </div>
                  <Switch 
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Label>Intervalo de Sincronização</Label>
                  <Select value={syncInterval} onValueChange={setSyncInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">A cada 5 minutos</SelectItem>
                      <SelectItem value="15">A cada 15 minutos</SelectItem>
                      <SelectItem value="30">A cada 30 minutos</SelectItem>
                      <SelectItem value="60">A cada 1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    * Configuração de cron job requer setup adicional no backend
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Entidades para Sincronizar</Label>
                  <div className="space-y-2">
                    {['Deals → Contas a Receber', 'Contatos → Clientes', 'Empresas → Clientes', 'Status de Pagamento'].map(entity => (
                      <div key={entity} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-sm">{entity}</span>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
