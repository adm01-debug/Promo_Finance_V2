import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRateLimitLogs } from '@/hooks/useRateLimitLogs';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, Globe, Loader2, Search, Trash2, Bell } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BlockedIPsTab } from './rate-limit/BlockedIPsTab';
import { maskIp, matchesIpFilter } from '@/lib/ip-mask';
import { useIpMaskPreference } from '@/hooks/useIpMaskPreference';
import { IpMaskToggle } from '@/components/admin/IpMaskToggle';
import { BlockIpDialog } from './rate-limit/BlockIpDialog';
import { SecurityAlertsTab } from './rate-limit/SecurityAlertsTab';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'hsl(var(--chart-2))',
  medium: 'hsl(var(--chart-3))',
  high: 'hsl(var(--chart-4))',
  critical: 'hsl(var(--destructive))',
};

export function RateLimitDashboard() {
  const { enabled: maskIpsEnabled } = useIpMaskPreference();
  const { logs, blockedIPs, stats, isLoading, blockIP, unblockIP, clearOldLogs } =
    useRateLimitLogs();
  const { alerts, unresolvedCount, resolveAlert } = useSecurityAlerts();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [newBlockIP, setNewBlockIP] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [newBlockPermanent, setNewBlockPermanent] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlockIP = async () => {
    if (!newBlockIP.trim()) {
      toast.error('Informe o endereço IP');
      return;
    }
    setIsBlocking(true);
    try {
      await blockIP(newBlockIP.trim(), newBlockReason, newBlockPermanent);
      toast.success('IP bloqueado com sucesso');
      setShowBlockDialog(false);
      setNewBlockIP('');
      setNewBlockReason('');
      setNewBlockPermanent(false);
    } catch (error: unknown) {
      logger.error('Erro ao bloquear IP:', error);
      toast.error('Erro ao bloquear IP');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await unblockIP(id);
      toast.success('IP desbloqueado');
    } catch (error: unknown) {
      logger.error('Erro ao desbloquear IP:', error);
      toast.error('Erro ao desbloquear IP');
    }
  };
  const handleClearOldLogs = async () => {
    try {
      await clearOldLogs(30);
      toast.success('Logs antigos removidos');
    } catch (error: unknown) {
      logger.error('Erro ao limpar logs:', error);
      toast.error('Erro ao limpar logs');
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      matchesIpFilter(log.ip_address, searchTerm) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const severityData = Object.entries(
    alerts.reduce(
      (acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([name, value]) => ({ name, value }));

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requisições</p>
                <p className="text-2xl font-bold">{stats?.totalRequests.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
                <p className="text-2xl font-bold">{stats?.blockedRequests || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <Globe className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IPs Únicos</p>
                <p className="text-2xl font-bold">{stats?.uniqueIPs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alertas Pendentes</p>
                <p className="text-2xl font-bold">{unresolvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="blocked">IPs Bloqueados</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unresolvedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.topEndpoints.slice(0, 5) || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="endpoint"
                        type="category"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alertas por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {severityData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={SEVERITY_COLORS[entry.name] || 'hsl(var(--muted))'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blocked" className="mt-4">
          <BlockedIPsTab
            blockedIPs={blockedIPs}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onBlockNew={() => setShowBlockDialog(true)}
            onUnblock={handleUnblock}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle>Logs de Rate Limit</CardTitle>
                  <CardDescription>Histórico de requisições e limites atingidos</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <IpMaskToggle />
                  <Button variant="outline" onClick={handleClearOldLogs}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Antigos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por IP ou endpoint..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {maskIpsEnabled && (
                  <p className="text-xs text-muted-foreground pl-1">
                    A busca casa com o IP original — você pode pesquisar por{' '}
                    <span className="font-mono">192.168.1.42</span> mesmo com mascaramento ativo.
                  </p>
                )}
              </div>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Requisições</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.slice(0, 100).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {maskIp(log.ip_address, maskIpsEnabled)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.endpoint}</TableCell>
                        <TableCell>{log.request_count}</TableCell>
                        <TableCell>
                          {log.blocked ? (
                            <Badge variant="destructive">Bloqueado</Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <SecurityAlertsTab
            alerts={alerts}
            maskIpsEnabled={maskIpsEnabled}
            onResolve={resolveAlert}
          />
        </TabsContent>
      </Tabs>

      <BlockIpDialog
        open={showBlockDialog}
        ip={newBlockIP}
        reason={newBlockReason}
        permanent={newBlockPermanent}
        isSubmitting={isBlocking}
        onOpenChange={setShowBlockDialog}
        onIpChange={setNewBlockIP}
        onReasonChange={setNewBlockReason}
        onPermanentChange={setNewBlockPermanent}
        onSubmit={handleBlockIP}
      />
    </div>
  );
}
