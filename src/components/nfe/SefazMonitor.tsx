import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  RefreshCw,
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  Server,
  Shield,
  AlertCircle,
  Timer,
  BarChart3,
  Gauge,
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/formatters';
import {
  checkSefazHealth,
  getSefazHealthStatus,
  getContingencyState,
  getAutoContingencyConfig,
  SefazHealthStatus,
  ContingencyState,
} from '@/lib/sefaz-contingency';

interface HealthHistoryPoint {
  time: string;
  timestamp: number;
  latency: number;
  online: boolean;
  status: number;
}

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

const getStatusColor = (online: boolean, latency: number) => {
  if (!online) return 'text-destructive';
  if (latency > 3000) return 'text-warning';
  if (latency > 1500) return 'text-warning';
  return 'text-success';
};

const getStatusBg = (online: boolean, latency: number) => {
  if (!online) return 'bg-destructive/10 border-destructive/30';
  if (latency > 3000) return 'bg-warning/10 border-warning/30';
  if (latency > 1500) return 'bg-warning/10 border-warning/30';
  return 'bg-success/10 border-success/30';
};

const getUptimeColor = (uptime: number) => {
  if (uptime >= 99) return 'text-success';
  if (uptime >= 95) return 'text-warning';
  if (uptime >= 90) return 'text-warning';
  return 'text-destructive';
};

export function SefazMonitor() {
  const [health, setHealth] = useState<SefazHealthStatus>(getSefazHealthStatus());
  const [contingencyState, setContingencyState] = useState<ContingencyState>(getContingencyState());
  const [isChecking, setIsChecking] = useState(false);
  const [autoMonitor, setAutoMonitor] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [healthHistory, setHealthHistory] = useState<HealthHistoryPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [checkCount, setCheckCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [lastAlertTime, setLastAlertTime] = useState<Date | null>(null);

  const autoConfig = getAutoContingencyConfig();

  const uptime = checkCount > 0 ? (successCount / checkCount) * 100 : 100;

  const addAlert = useCallback((type: AlertItem['type'], message: string) => {
    const newAlert: AlertItem = {
      id: `alert_${Date.now()}`,
      type,
      message,
      timestamp: new Date(),
      dismissed: false,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 20));
    setLastAlertTime(new Date());

    if (showAlerts) {
      if (type === 'error') toast.error(message);
      else if (type === 'warning') toast.warning(message);
      else if (type === 'success') toast.success(message);
    }
  }, [showAlerts]);

  const performHealthCheck = useCallback(async () => {
    setIsChecking(true);
    const prevHealth = health;
    
    try {
      const newHealth = await checkSefazHealth();
      setHealth(newHealth);
      setContingencyState(getContingencyState());
      setCheckCount(prev => prev + 1);
      
      if (newHealth.online) {
        setSuccessCount(prev => prev + 1);
      }

      const now = new Date();
      const historyPoint: HealthHistoryPoint = {
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: now.getTime(),
        latency: newHealth.latency,
        online: newHealth.online,
        status: newHealth.online ? 100 : 0,
      };
      setHealthHistory(prev => [...prev, historyPoint].slice(-30));

      if (prevHealth.online && !newHealth.online) {
        addAlert('error', 'SEFAZ ficou indisponível');
      } else if (!prevHealth.online && newHealth.online) {
        addAlert('success', 'SEFAZ voltou a ficar disponível');
      } else if (newHealth.online && newHealth.latency > 3000) {
        addAlert('warning', `Latência alta detectada: ${newHealth.latency}ms`);
      }

      if (newHealth.consecutiveFailures >= 3) {
        addAlert('error', `${newHealth.consecutiveFailures} falhas consecutivas de comunicação`);
      }

    } catch (error: unknown) {
      addAlert('error', 'Erro ao verificar status da SEFAZ');
    } finally {
      setIsChecking(false);
    }
  }, [health, addAlert]);

  useEffect(() => {
    if (!autoMonitor) return;
    performHealthCheck();
    const interval = setInterval(() => {
      performHealthCheck();
    }, autoConfig.checkIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [autoMonitor, autoConfig.checkIntervalSeconds, performHealthCheck]);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const isContingencyActive = contingencyState.mode !== 'normal';

  const avgLatency = healthHistory.length > 0 
    ? Math.round(healthHistory.reduce((sum, h) => sum + h.latency, 0) / healthHistory.length)
    : 0;

  const minLatency = healthHistory.length > 0 
    ? Math.min(...healthHistory.map(h => h.latency))
    : 0;
  const maxLatency = healthHistory.length > 0 
    ? Math.max(...healthHistory.map(h => h.latency))
    : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Real-time Status Banner */}
      <motion.div variants={itemVariants}>
        <Card className={`border-2 ${getStatusBg(health.online, health.latency)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <motion.div
                  variants={pulseVariants}
                  animate={health.online ? "pulse" : undefined}
                  className={`relative p-4 rounded-2xl ${
                    health.online 
                      ? 'bg-success/20' 
                      : 'bg-destructive/20'
                  }`}
                >
                  {health.online ? (
                    <Wifi className="h-10 w-10 text-success" />
                  ) : (
                    <WifiOff className="h-10 w-10 text-destructive" />
                  )}
                  
                  {health.online && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-success/50"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  )}
                </motion.div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">
                      SEFAZ {health.online ? 'Online' : 'Offline'}
                    </h2>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(health.online, health.latency)}
                    >
                      {health.online 
                        ? health.latency > 3000 ? 'Lento' : health.latency > 1500 ? 'Normal' : 'Rápido'
                        : 'Indisponível'
                      }
                    </Badge>
                    {isContingencyActive && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Contingência Ativa
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Última verificação: {formatDateTime(health.lastCheck.toISOString())}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="auto-monitor"
                    checked={autoMonitor} 
                    onCheckedChange={setAutoMonitor} 
                  />
                  <Label htmlFor="auto-monitor" className="text-sm">
                    Auto
                  </Label>
                </div>
                <Button 
                  variant="outline" 
                  onClick={performHealthCheck}
                  disabled={isChecking}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                  Verificar Agora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latência Atual</p>
                <p className={`text-3xl font-bold ${getStatusColor(health.online, health.latency)}`}>
                  {health.latency}
                  <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                </p>
              </div>
              <div className={`p-3 rounded-xl ${health.latency > 2000 ? 'bg-warning/10' : 'bg-success/10'}`}>
                <Timer className={`h-6 w-6 ${health.latency > 2000 ? 'text-warning' : 'text-success'}`} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Min: {minLatency}ms</span>
              <span>•</span>
              <span>Max: {maxLatency}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className={`text-3xl font-bold ${getUptimeColor(uptime)}`}>
                  {uptime.toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Gauge className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={uptime} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falhas Consecutivas</p>
                <p className={`text-3xl font-bold ${health.consecutiveFailures > 0 ? 'text-destructive' : 'text-success'}`}>
                  {health.consecutiveFailures}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${health.consecutiveFailures > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                {health.consecutiveFailures > 0 ? (
                  <XCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Limite para contingência: {autoConfig.rules.find(r => r.type === 'failure_count')?.config.maxFailures || 3}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latência Média</p>
                <p className="text-3xl font-bold">
                  {avgLatency}
                  <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {avgLatency < health.averageResponseTime ? (
                <>
                  <TrendingDown className="h-3 w-3 text-success" />
                  <span className="text-success">Melhorando</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-warning" />
                  <span className="text-warning">Aumentando</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Histórico de Latência
            </CardTitle>
            <CardDescription>
              Últimas {healthHistory.length} verificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {healthHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthHistory}>
                    <defs>
                      <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10 }} 
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `${value}ms`}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}ms`, 'Latência']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="latency" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#latencyGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Aguardando dados de monitoramento...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Status em Tempo Real
            </CardTitle>
            <CardDescription>
              Disponibilidade recente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {healthHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthHistory}>
                    <defs>
                      <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => value === 100 ? 'ON' : 'OFF'}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value === 100 ? 'Online' : 'Offline', 'Status']}
                    />
                    <Area 
                      type="stepAfter" 
                      dataKey="status" 
                      stroke="hsl(var(--success))" 
                      fill="url(#statusGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Aguardando dados de monitoramento...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contingency & Alerts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contingency State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Estado da Contingência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Modo Atual</p>
                <p className="text-sm text-muted-foreground">
                  {contingencyState.mode === 'normal' ? 'Operação Normal' :
                   contingencyState.mode === 'SVCAN' ? 'SVC-AN' :
                   contingencyState.mode === 'SVCRS' ? 'SVC-RS' :
                   contingencyState.mode === 'DPEC' ? 'EPEC' : 'Offline'}
                </p>
              </div>
              <Badge variant={contingencyState.mode === 'normal' ? 'default' : 'destructive'}>
                {contingencyState.mode === 'normal' ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Normal</>
                ) : (
                  <><AlertTriangle className="h-3 w-3 mr-1" /> Contingência</>
                )}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ativação automática</span>
                <Badge variant="outline">
                  {autoConfig.enabled ? 'Habilitada' : 'Desabilitada'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intervalo de verificação</span>
                <span>{autoConfig.checkIntervalSeconds}s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Regras configuradas</span>
                <span>{autoConfig.rules.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-warning" />
                Alertas em Tempo Real
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {activeAlerts.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-alerts"
                checked={showAlerts}
                onCheckedChange={setShowAlerts}
              />
              <Label htmlFor="show-alerts" className="text-xs">
                {showAlerts ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
              </Label>
              {alerts.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllAlerts}>
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum alerta registrado</p>
                </div>
              ) : (
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: alert.dismissed ? 0.5 : 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        alert.type === 'error' ? 'bg-destructive/10' :
                        alert.type === 'warning' ? 'bg-warning/10' :
                        alert.type === 'success' ? 'bg-success/10' :
                        'bg-primary/10'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${
                        alert.type === 'error' ? 'bg-destructive/20' :
                        alert.type === 'warning' ? 'bg-warning/20' :
                        alert.type === 'success' ? 'bg-success/20' :
                        'bg-primary/20'
                      }`}>
                        {alert.type === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                        {alert.type === 'success' && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {alert.type === 'info' && <AlertCircle className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {alert.timestamp.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                      {!alert.dismissed && (
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Auto Monitoring Status Bar */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="py-3 px-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {autoMonitor ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Monitorando
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Pausado
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {checkCount} verificações realizadas
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Alertas: {alerts.length}</span>
                {lastAlertTime && (
                  <span>Último: {lastAlertTime.toLocaleTimeString('pt-BR')}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
