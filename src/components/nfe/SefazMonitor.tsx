import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  checkSefazHealth, getSefazHealthStatus, getContingencyState, getAutoContingencyConfig,
  SefazHealthStatus, ContingencyState,
} from '@/lib/sefaz-contingency';
import { SefazStatusBanner } from './sefaz-monitor/SefazStatusBanner';
import { SefazMetricsCards } from './sefaz-monitor/SefazMetricsCards';
import { SefazChartsRow } from './sefaz-monitor/SefazChartsRow';
import { SefazContingencyAlerts } from './sefaz-monitor/SefazAlertsPanel';

interface HealthHistoryPoint { time: string; timestamp: number; latency: number; online: boolean; status: number; }
interface AlertItem { id: string; type: 'warning' | 'error' | 'success' | 'info'; message: string; timestamp: Date; dismissed: boolean; }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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
    const newAlert: AlertItem = { id: `alert_${Date.now()}`, type, message, timestamp: new Date(), dismissed: false };
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
      if (newHealth.online) setSuccessCount(prev => prev + 1);

      const now = new Date();
      setHealthHistory(prev => [...prev, {
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: now.getTime(), latency: newHealth.latency, online: newHealth.online, status: newHealth.online ? 100 : 0,
      }].slice(-30));

      if (prevHealth.online && !newHealth.online) addAlert('error', 'SEFAZ ficou indisponível');
      else if (!prevHealth.online && newHealth.online) addAlert('success', 'SEFAZ voltou a ficar disponível');
      else if (newHealth.online && newHealth.latency > 3000) addAlert('warning', `Latência alta detectada: ${newHealth.latency}ms`);
      if (newHealth.consecutiveFailures >= 3) addAlert('error', `${newHealth.consecutiveFailures} falhas consecutivas de comunicação`);
    } catch { addAlert('error', 'Erro ao verificar status da SEFAZ'); }
    finally { setIsChecking(false); }
  }, [health, addAlert]);

  useEffect(() => {
    if (!autoMonitor) return;
    performHealthCheck();
    const interval = setInterval(performHealthCheck, autoConfig.checkIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [autoMonitor, autoConfig.checkIntervalSeconds, performHealthCheck]);

  const avgLatency = healthHistory.length > 0 ? Math.round(healthHistory.reduce((sum, h) => sum + h.latency, 0) / healthHistory.length) : 0;
  const minLatency = healthHistory.length > 0 ? Math.min(...healthHistory.map(h => h.latency)) : 0;
  const maxLatency = healthHistory.length > 0 ? Math.max(...healthHistory.map(h => h.latency)) : 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <SefazStatusBanner health={health} contingencyState={contingencyState} autoMonitor={autoMonitor} setAutoMonitor={setAutoMonitor} isChecking={isChecking} onCheck={performHealthCheck} />
      <SefazMetricsCards health={health} uptime={uptime} avgLatency={avgLatency} minLatency={minLatency} maxLatency={maxLatency} maxFailuresRule={autoConfig.rules.find(r => r.type === 'failure_count')?.config.maxFailures || 3} />
      <SefazChartsRow healthHistory={healthHistory} />
      <SefazContingencyAlerts contingencyState={contingencyState} autoConfig={autoConfig} alerts={alerts} showAlerts={showAlerts} setShowAlerts={setShowAlerts} onDismiss={(id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))} onClearAll={() => setAlerts([])} />

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="py-3 px-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {autoMonitor ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20"><Activity className="h-3 w-3 mr-1 animate-pulse" />Monitorando</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Pausado</Badge>
                )}
                <span className="text-muted-foreground">{checkCount} verificações realizadas</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Alertas: {alerts.length}</span>
                {lastAlertTime && <span>Último: {lastAlertTime.toLocaleTimeString('pt-BR')}</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
