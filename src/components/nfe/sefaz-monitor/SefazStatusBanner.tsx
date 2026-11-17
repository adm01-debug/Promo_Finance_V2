import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import type { SefazHealthStatus, ContingencyState } from '@/lib/sefaz-contingency';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

// `online === null` é o status desconhecido (integração não homologada): cor e
// moldura neutras, para não afirmar nem disponibilidade nem queda.
const getStatusColor = (online: boolean | null, latency: number | null) => {
  if (online === null) return 'text-muted-foreground';
  if (!online) return 'text-destructive';
  if (latency !== null && latency > 1500) return 'text-warning';
  return 'text-success';
};

const getStatusBg = (online: boolean | null, latency: number | null) => {
  if (online === null) return 'bg-muted/40 border-muted';
  if (!online) return 'bg-destructive/10 border-destructive/30';
  if (latency !== null && latency > 1500) return 'bg-warning/10 border-warning/30';
  return 'bg-success/10 border-success/30';
};

interface Props {
  health: SefazHealthStatus;
  contingencyState: ContingencyState;
  autoMonitor: boolean;
  setAutoMonitor: (v: boolean) => void;
  isChecking: boolean;
  onCheck: () => void;
}

export function SefazStatusBanner({
  health,
  contingencyState,
  autoMonitor,
  setAutoMonitor,
  isChecking,
  onCheck,
}: Props) {
  const isContingencyActive = contingencyState.mode !== 'normal';
  const semIntegracao = health.online === null;

  return (
    <motion.div variants={itemVariants}>
      <Card className={`border-2 ${getStatusBg(health.online, health.latency)}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                variants={pulseVariants}
                animate={health.online === true ? 'pulse' : undefined}
                className={`relative p-4 rounded-2xl ${
                  health.online === null
                    ? 'bg-muted'
                    : health.online
                      ? 'bg-success/20'
                      : 'bg-destructive/20'
                }`}
              >
                {health.online === null ? (
                  <HelpCircle className="h-10 w-10 text-muted-foreground" />
                ) : health.online ? (
                  <Wifi className="h-10 w-10 text-success" />
                ) : (
                  <WifiOff className="h-10 w-10 text-destructive" />
                )}
                {health.online === true && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-success/50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </motion.div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {health.online === null
                      ? 'SEFAZ — status não verificado'
                      : `SEFAZ ${health.online ? 'Online' : 'Offline'}`}
                  </h2>
                  <Badge
                    variant="outline"
                    className={getStatusColor(health.online, health.latency)}
                  >
                    {health.online === null
                      ? 'Sem integração homologada'
                      : health.online
                        ? health.latency !== null && health.latency > 3000
                          ? 'Lento'
                          : health.latency !== null && health.latency > 1500
                            ? 'Normal'
                            : 'Rápido'
                        : 'Indisponível'}
                  </Badge>
                  {isContingencyActive && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Contingência Ativa
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  Última verificação:{' '}
                  {health.lastCheck
                    ? formatDateTime(health.lastCheck.toISOString())
                    : 'nunca verificada'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Enquanto não há consulta real à SEFAZ, monitorar e "verificar
                  agora" não medem nada: ficam desabilitados com o motivo à
                  mostra, no mesmo padrão adotado para cancelamento e
                  inutilização de NF-e. */}
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-monitor"
                  checked={semIntegracao ? false : autoMonitor}
                  onCheckedChange={setAutoMonitor}
                  disabled={semIntegracao}
                />
                <Label htmlFor="auto-monitor" className="text-sm">
                  Auto
                </Label>
              </div>
              <Button
                variant="outline"
                onClick={onCheck}
                disabled={isChecking || semIntegracao}
                title={
                  semIntegracao
                    ? 'Integração SEFAZ ainda não homologada: não há status para verificar.'
                    : undefined
                }
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                {semIntegracao ? 'Verificação indisponível' : 'Verificar Agora'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
