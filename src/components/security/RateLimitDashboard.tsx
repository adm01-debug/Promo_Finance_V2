import { useState } from 'react';
import { motion } from 'framer-motion';
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
import {
  Shield,
  AlertTriangle,
  Ban,
  Activity,
  Globe,
  Clock,
  Loader2,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Bell,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'hsl(var(--chart-2))',
  medium: 'hsl(var(--chart-3))',
  high: 'hsl(var(--chart-4))',
  critical: 'hsl(var(--destructive))',
};

export function RateLimitDashboard() {
  const { logs, blockedIPs, stats, isLoading, blockIP, unblockIP, clearOldLogs } = useRateLimitLogs();
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

  const filteredLogs = logs.filter(log =>
    log.ip_address.includes(searchTerm) ||
    log.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBlockedIPs = blockedIPs.filter(ip =>
    !ip.unblocked_at && (
      ip.ip_address.includes(searchTerm) ||
      (ip.reason?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const severityData = Object.entries(
    alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

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
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
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
                      <YAxis dataKey="endpoint" type="category" width={120} tick={{ fontSize: 12 }} />
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
                          <Cell key={index} fill={SEVERITY_COLORS[entry.name] || 'hsl(var(--muted))'} />
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IPs Bloqueados</CardTitle>
                  <CardDescription>
                    Gerencie os endereços IP bloqueados no sistema
                  </CardDescription>
                </div>
                <Button onClick={() => setShowBlockDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Bloquear IP
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar IP ou motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredBlockedIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum IP bloqueado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Bloqueado em</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBlockedIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono">{ip.ip_address}</TableCell>
                        <TableCell>{ip.reason || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(ip.blocked_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ip.permanent ? 'destructive' : 'secondary'}>
                            {ip.permanent ? 'Permanente' : 'Temporário'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnblock(ip.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Desbloquear
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logs de Rate Limit</CardTitle>
                  <CardDescription>
                    Histórico de requisições e limites atingidos
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handleClearOldLogs}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Antigos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por IP ou endpoint..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
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
                        <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.endpoint}</TableCell>
                        <TableCell>{log.requests_count}</TableCell>
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
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Segurança</CardTitle>
              <CardDescription>
                Notificações em tempo real sobre atividades suspeitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum alerta de segurança</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 20).map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${
                        alert.resolved
                          ? 'bg-muted/30 border-border'
                          : alert.severity === 'critical'
                          ? 'bg-destructive/10 border-destructive/50'
                          : alert.severity === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500/50'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={`h-5 w-5 mt-0.5 ${
                              alert.severity === 'critical'
                                ? 'text-destructive'
                                : alert.severity === 'high'
                                ? 'text-orange-500'
                                : 'text-yellow-500'
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{alert.title}</p>
                              <Badge
                                variant={
                                  alert.severity === 'critical' ? 'destructive' :
                                  alert.severity === 'high' ? 'default' : 'secondary'
                                }
                              >
                                {alert.severity}
                              </Badge>
                              {alert.resolved && (
                                <Badge variant="outline" className="text-green-600">
                                  Resolvido
                                </Badge>
                              )}
                            </div>
                            {alert.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {alert.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {alert.ip_address && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {alert.ip_address}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(alert.created_at), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block IP Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Endereço IP</DialogTitle>
            <DialogDescription>
              Bloqueie um endereço IP para impedir acesso ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip">Endereço IP</Label>
              <Input
                id="ip"
                placeholder="Ex: 192.168.1.1"
                value={newBlockIP}
                onChange={(e) => setNewBlockIP(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                placeholder="Motivo do bloqueio"
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="permanent"
                checked={newBlockPermanent}
                onCheckedChange={setNewBlockPermanent}
              />
              <Label htmlFor="permanent">Bloqueio permanente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlockIP} disabled={isBlocking}>
              {isBlocking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
