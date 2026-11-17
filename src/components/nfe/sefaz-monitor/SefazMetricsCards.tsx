import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Timer,
  Gauge,
  XCircle,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { SefazHealthStatus } from '@/lib/sefaz-contingency';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// `online === null` / `latency === null`: nada foi medido, cor neutra.
const getStatusColor = (online: boolean | null, latency: number | null) => {
  if (online === null) return 'text-muted-foreground';
  if (!online) return 'text-destructive';
  if (latency !== null && latency > 1500) return 'text-warning';
  return 'text-success';
};

const getUptimeColor = (uptime: number) => {
  if (uptime >= 99) return 'text-success';
  if (uptime >= 95) return 'text-warning';
  return 'text-destructive';
};

interface Props {
  health: SefazHealthStatus;
  /** `null` enquanto nenhuma verificação real aconteceu. */
  uptime: number | null;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  maxFailuresRule: number;
}

export function SefazMetricsCards({
  health,
  uptime,
  avgLatency,
  minLatency,
  maxLatency,
  maxFailuresRule,
}: Props) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Latência Atual</p>
              <p className={`text-3xl font-bold ${getStatusColor(health.online, health.latency)}`}>
                {health.latency === null ? (
                  '—'
                ) : (
                  <>
                    {health.latency}
                    <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                  </>
                )}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl ${
                health.latency === null
                  ? 'bg-muted'
                  : health.latency > 2000
                    ? 'bg-warning/10'
                    : 'bg-success/10'
              }`}
            >
              <Timer
                className={`h-6 w-6 ${
                  health.latency === null
                    ? 'text-muted-foreground'
                    : health.latency > 2000
                      ? 'text-warning'
                      : 'text-success'
                }`}
              />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {health.latency === null ? (
              <span>Sem medição: integração SEFAZ não homologada</span>
            ) : (
              <>
                <span>Min: {minLatency}ms</span>
                <span>•</span>
                <span>Max: {maxLatency}ms</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p
                className={`text-3xl font-bold ${
                  uptime === null ? 'text-muted-foreground' : getUptimeColor(uptime)
                }`}
              >
                {uptime === null ? (
                  '—'
                ) : (
                  <>
                    {uptime.toFixed(1)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
                  </>
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <Gauge className="h-6 w-6 text-primary" />
            </div>
          </div>
          <Progress value={uptime ?? 0} className="mt-2 h-1.5" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Falhas Consecutivas</p>
              <p
                className={`text-3xl font-bold ${health.consecutiveFailures > 0 ? 'text-destructive' : 'text-success'}`}
              >
                {health.consecutiveFailures}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl ${health.consecutiveFailures > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}
            >
              {health.consecutiveFailures > 0 ? (
                <XCircle className="h-6 w-6 text-destructive" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-success" />
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {health.online === null
              ? 'Regra inativa: integração SEFAZ não homologada'
              : `Limite para contingência: ${maxFailuresRule}`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Latência Média</p>
              <p className="text-3xl font-bold">
                {health.latency === null && avgLatency === 0 ? (
                  '—'
                ) : (
                  <>
                    {avgLatency}
                    <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
                  </>
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {health.latency === null && avgLatency === 0 ? (
              <span className="text-muted-foreground">Sem série de medições</span>
            ) : avgLatency < health.averageResponseTime ? (
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
  );
}
