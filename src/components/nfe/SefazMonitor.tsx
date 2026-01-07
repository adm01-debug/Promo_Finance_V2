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
  if (!online) return 'text-red-500';
  if (latency > 3000) return 'text-amber-500';
  if (latency > 1500) return 'text-yellow-500';
  return 'text-emerald-500';
};

const getStatusBg = (online: boolean, latency: number) => {
  if (!online) return 'bg-red-500/10 border-red-500/30';
  if (latency > 3000) return 'bg-amber-500/10 border-amber-500/30';
  if (latency > 1500) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-emerald-500/10 border-emerald-500/30';
};

const getUptimeColor = (uptime: number) => {
  if (uptime >= 99) return 'text-emerald-500';
  if (uptime >= 95) return 'text-yellow-500';
  if (uptime >= 90) return 'text-amber-500';
  return 'text-red-500';
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

  // Calculate uptime percentage
  const uptime = checkCount > 0 ? (successCount / checkCount) * 100 : 100;

  // Add alert
  const addAlert = useCallback((type: AlertItem['type'], message: string) => {
    const newAlert: AlertItem = {
      id: `alert_${Date.now()}`,
      type,
      message,
      timestamp: new Date(),
      dismissed: false,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 20)); // Keep last 20 alerts
    setLastAlertTime(new Date());

    // Show toast for important alerts
    if (showAlerts) {
      if (type === 'error') toast.error(message);
      else if (type === 'warning') toast.warning(message);
      else if (type === 'success') toast.success(message);
    }
  }, [showAlerts]);

  // Perform health check
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

      // Add to history
      const now = new Date();
      const historyPoint: HealthHistoryPoint = {
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: now.getTime(),
        latency: newHealth.latency,
        online: newHealth.online,
        status: newHealth.online ? 100 : 0,
      };
      setHealthHistory(prev => [...prev, historyPoint].slice(-30)); // Keep last 30 points

      // Generate alerts based on status changes
      if (prevHealth.online && !newHealth.online) {
        addAlert('error', 'SEFAZ ficou indisponível');
      } else if (!prevHealth.online && newHealth.online) {
        addAlert('success', 'SEFAZ voltou a ficar disponível');
      } else if (newHealth.online && newHealth.latency > 3000) {
        addAlert('warning', `Latência alta detectada: ${newHealth.latency}ms`);
      }

      // Alert for consecutive failures
      if (newHealth.consecutiveFailures >= 3) {
        addAlert('error', `${newHealth.consecutiveFailures} falhas consecutivas de comunicação`);
      }

    } catch (error) {
      addAlert('error', 'Erro ao verificar status da SEFAZ');
    } finally {
      setIsChecking(false);
    }
  }, [health, addAlert]);

  // Auto monitoring
  useEffect(() => {
    if (!autoMonitor) return;

    // Initial check
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

  // Calculate average latency
  const avgLatency = healthHistory.length > 0 
    ? Math.round(healthHistory.reduce((sum, h) => sum + h.latency, 0) / healthHistory.length)
    : 0;

  // Calculate min/max latency
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
                {/* Status Indicator with Pulse */}
                <motion.div
                  variants={pulseVariants}
                  animate={health.online ? "pulse" : undefined}
                  className={`relative p-4 rounded-2xl ${
                    health.online 
                      ? 'bg-emerald-500/20' 
                      : 'bg-red-500/20'
                  }`}
                >
                  {health.online ? (
                    <Wifi className="h-10 w-10 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-10 w-10 text-red-500" />
                  )}
                  
                  {/* Animated ring */}
                  {health.online && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-emerald-500/50"
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
        {/* Latency */}
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
              <div className={`p-3 rounded-xl ${health.latency > 2000 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                <Timer className={`h-6 w-6 ${health.latency > 2000 ? 'text-amber-500' : 'text-emerald-500'}`} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Min: {minLatency}ms</span>
              <span>•</span>
              <span>Max: {maxLatency}ms</span>
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
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

        {/* Consecutive Failures */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falhas Consecutivas</p>
                <p className={`text-3xl font-bold ${health.consecutiveFailures > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {health.consecutiveFailures}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${health.consecutiveFailures > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                {health.consecutiveFailures > 0 ? (
                  <XCircle className="h-6 w-6 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Limite para contingência: {autoConfig.rules.find(r => r.type === 'failure_count')?.config.maxFailures || 3}
            </p>
          </CardContent>
        </Card>

        {/* Average Response Time */}
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
              <div className="p-3 rounded-xl bg-blue-500/10">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {avgLatency < health.averageResponseTime ? (
                <>
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500">Melhorando</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-500">Aumentando</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Chart */}
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

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Timeline de Disponibilidade
            </CardTitle>
            <CardDescription>
              Status ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {healthHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthHistory}>
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
                    <Line 
                      type="stepAfter" 
                      dataKey="status" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={4} 
                            fill={payload.online ? '#22c55e' : '#ef4444'}
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </LineChart>
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

      {/* Alerts Panel */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                Alertas em Tempo Real
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {activeAlerts.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Notificações de eventos importantes
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch 
                  id="show-alerts"
                  checked={showAlerts} 
                  onCheckedChange={setShowAlerts} 
                />
                <Label htmlFor="show-alerts" className="text-sm">
                  {showAlerts ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Label>
              </div>
              {alerts.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllAlerts}>
                  Limpar Todos
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <AnimatePresence>
                {activeAlerts.length > 0 ? (
                  activeAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        alert.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
                        alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                        alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                        'bg-blue-500/10 border-blue-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${
                          alert.type === 'error' ? 'bg-red-500/20' :
                          alert.type === 'warning' ? 'bg-amber-500/20' :
                          alert.type === 'success' ? 'bg-emerald-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                          {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          {alert.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          {alert.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(alert.timestamp.toISOString())}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum alerta ativo</p>
                    <p className="text-sm">O sistema está funcionando normalmente</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Info */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Intervalo: {autoConfig.checkIntervalSeconds}s</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Verificações: {checkCount}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Regras ativas: {autoConfig.rules.filter(r => r.enabled).length}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {autoMonitor ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Monitorando
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted">
                    Pausado
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
