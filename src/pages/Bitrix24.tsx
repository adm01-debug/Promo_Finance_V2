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
import { BitrixKpiCards } from '@/components/bitrix/BitrixKpis';
import { BitrixDealsTab } from '@/components/bitrix/BitrixDealsTab';
import { BitrixSyncLogsTab } from '@/components/bitrix/BitrixSyncLogsTab';
import { BitrixClientsTab } from '@/components/bitrix/BitrixClientsTab';
import { BitrixMappingTab } from '@/components/bitrix/BitrixMappingTab';
import { BitrixConfigTab } from '@/components/bitrix/BitrixConfigTab';
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
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
              isConnected ? "border-success text-success" : "border-destructive text-destructive"
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
      <BitrixKpiCards isConnected={isConnected} stats={stats} formatRelativeTime={formatRelativeTime} />

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
          <BitrixDealsTab deals={syncedDeals} isLoading={isLoading} onSync={() => syncDeals()} />
        </TabsContent>

        {/* Clientes Importados */}
        <TabsContent value="clients">
          <BitrixClientsTab
            clients={syncedClients}
            isLoading={isLoading}
            onSyncContacts={() => syncContacts()}
            onSyncCompanies={() => syncCompanies()}
          />
        </TabsContent>

        {/* Histórico de Sincronização */}
        <TabsContent value="logs">
          <BitrixSyncLogsTab logs={syncLogs} isLoading={isLoading} formatRelativeTime={formatRelativeTime} />
        </TabsContent>

        {/* Mapeamento de Campos */}
        <TabsContent value="mapping">
          <BitrixMappingTab
            fieldMappings={fieldMappings}
            isLoading={isLoading}
            onToggleMapping={toggleMapping}
          />
        </TabsContent>

        {/* Configuração */}
        <TabsContent value="config">
          <BitrixConfigTab
            isConnected={isConnected}
            autoSync={autoSync}
            syncInterval={syncInterval}
            onAutoSyncChange={setAutoSync}
            onSyncIntervalChange={setSyncInterval}
            onTestConnection={handleTestConnection}
            onSyncDeals={() => syncDeals()}
            onSyncContacts={() => syncContacts()}
            onSyncCompanies={() => syncCompanies()}
            onExportPaymentStatus={() => exportPaymentStatus()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
