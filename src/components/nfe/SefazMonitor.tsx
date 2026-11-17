import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  checkSefazHealth,
  getSefazHealthStatus,
  getContingencyState,
  getAutoContingencyConfig,
  SefazHealthStatus,
  ContingencyState,
} from '@/lib/sefaz-contingency';
import { SefazStatusBanner } from './sefaz-monitor/SefazStatusBanner';
import { SefazMetricsCards } from './sefaz-monitor/SefazMetricsCards';
import { SefazChartsRow } from './sefaz-monitor/SefazChartsRow';
import { SefazContingencyAlerts } from './sefaz-monitor/SefazAlertsPanel';

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
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
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
  // O status anterior fica em ref, não como dependência do callback: cada
  // verificação devolve um objeto novo, então depender de `health` recriava
  // `performHealthCheck`, que recriava o efeito, que verificava de novo — laço
  // contínuo, agora que a verificação retorna sem espera (achado do Devin e do
  // Codex na PR #423). Com a ref, o intervalo configurado volta a valer.
  const healthRef = useRef(health);

  const autoConfig = getAutoContingencyConfig();
  const semIntegracao = health.online === null;
  // `null` enquanto nenhuma verificação real aconteceu: 100% seria uptime
  // fabricado sobre zero amostras.
  const uptime = checkCount > 0 ? (successCount / checkCount) * 100 : null;

  const addAlert = useCallback(
    (type: AlertItem['type'], message: string) => {
      const newAlert: AlertItem = {
        id: `alert_${Date.now()}`,
        type,
        message,
        timestamp: new Date(),
        dismissed: false,
      };
      setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
      setLastAlertTime(new Date());
      if (showAlerts) {
        if (type === 'error') toast.error(message);
        else if (type === 'warning') toast.warning(message);
        else if (type === 'success') toast.success(message);
      }
    },
    [showAlerts]
  );

  const performHealthCheck = useCallback(async () => {
    setIsChecking(true);
    const prevHealth = healthRef.current;
    try {
      const newHealth = await checkSefazHealth();
      healthRef.current = newHealth;
      setHealth(newHealth);
      setContingencyState(getContingencyState());

      // Status desconhecido não conta como verificação nem entra na série dos
      // gráficos: sem isso, uptime e latência seriam calculados sobre nada e os
      // alertas de transição anunciariam uma queda que ninguém mediu.
      const online = newHealth.online;
      if (online === null) return;

      setCheckCount((prev) => prev + 1);
      if (online) setSuccessCount((prev) => prev + 1);

      const now = new Date();
      setHealthHistory((prev) =>
        [
          ...prev,
          {
            time: now.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            timestamp: now.getTime(),
            latency: newHealth.latency ?? 0,
            online,
            status: online ? 100 : 0,
          },
        ].slice(-30)
      );

      if (prevHealth.online === null) {
        // Primeira medição real: não há transição para anunciar.
      } else if (prevHealth.online && !online) addAlert('error', 'SEFAZ ficou indisponível');
      else if (!prevHealth.online && online) addAlert('success', 'SEFAZ voltou a ficar disponível');
      else if (online && newHealth.latency !== null && newHealth.latency > 3000)
        addAlert('warning', `Latência alta detectada: ${newHealth.latency}ms`);
      if (newHealth.consecutiveFailures >= 3)
        addAlert('error', `${newHealth.consecutiveFailures} falhas consecutivas de comunicação`);
    } catch {
      addAlert('error', 'Erro ao verificar status da SEFAZ');
    } finally {
      setIsChecking(false);
    }
  }, [addAlert]);

  useEffect(() => {
    // Enquanto não há consulta real à SEFAZ, monitorar não mede nada: o efeito
    // fica suspenso em vez de reexecutar a cada 30s para registrar desconhecido.
    if (!autoMonitor || semIntegracao) return;
    performHealthCheck();
    const interval = setInterval(performHealthCheck, autoConfig.checkIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [autoMonitor, semIntegracao, autoConfig.checkIntervalSeconds, performHealthCheck]);

  const avgLatency =
    healthHistory.length > 0
      ? Math.round(healthHistory.reduce((sum, h) => sum + h.latency, 0) / healthHistory.length)
      : 0;
  const minLatency =
    healthHistory.length > 0 ? Math.min(...healthHistory.map((h) => h.latency)) : 0;
  const maxLatency =
    healthHistory.length > 0 ? Math.max(...healthHistory.map((h) => h.latency)) : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <SefazStatusBanner
        health={health}
        contingencyState={contingencyState}
        autoMonitor={autoMonitor}
        setAutoMonitor={setAutoMonitor}
        isChecking={isChecking}
        onCheck={performHealthCheck}
      />
      <SefazMetricsCards
        health={health}
        uptime={uptime}
        avgLatency={avgLatency}
        minLatency={minLatency}
        maxLatency={maxLatency}
        maxFailuresRule={
          autoConfig.rules.find((r) => r.type === 'failure_count')?.config.maxFailures || 3
        }
      />
      <SefazChartsRow healthHistory={healthHistory} />
      <SefazContingencyAlerts
        contingencyState={contingencyState}
        autoConfig={autoConfig}
        alerts={alerts}
        showAlerts={showAlerts}
        setShowAlerts={setShowAlerts}
        onDismiss={(id) =>
          setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)))
        }
        onClearAll={() => setAlerts([])}
      />

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="py-3 px-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {semIntegracao ? (
                  // Sem integração homologada o selo verde "Monitorando" prometia
                  // vigilância que não existe (achado do Devin na PR #423).
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Indisponível
                  </Badge>
                ) : autoMonitor ? (
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
