import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import type { SefazHealthStatus, ContingencyState } from '@/lib/sefaz-contingency';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const pulseVariants = { pulse: { scale: [1, 1.05, 1], opacity: [1, 0.8, 1], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const } } };

const getStatusColor = (online: boolean, latency: number) => {
  if (!online) return 'text-destructive';
  if (latency > 1500) return 'text-warning';
  return 'text-success';
};

const getStatusBg = (online: boolean, latency: number) => {
  if (!online) return 'bg-destructive/10 border-destructive/30';
  if (latency > 1500) return 'bg-warning/10 border-warning/30';
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

export function SefazStatusBanner({ health, contingencyState, autoMonitor, setAutoMonitor, isChecking, onCheck }: Props) {
  const isContingencyActive = contingencyState.mode !== 'normal';

  return (
    <motion.div variants={itemVariants}>
      <Card className={`border-2 ${getStatusBg(health.online, health.latency)}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div variants={pulseVariants} animate={health.online ? "pulse" : undefined}
                className={`relative p-4 rounded-2xl ${health.online ? 'bg-success/20' : 'bg-destructive/20'}`}>
                {health.online ? <Wifi className="h-10 w-10 text-success" /> : <WifiOff className="h-10 w-10 text-destructive" />}
                {health.online && (
                  <motion.div className="absolute inset-0 rounded-2xl border-2 border-success/50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
                )}
              </motion.div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">SEFAZ {health.online ? 'Online' : 'Offline'}</h2>
                  <Badge variant="outline" className={getStatusColor(health.online, health.latency)}>
                    {health.online ? health.latency > 3000 ? 'Lento' : health.latency > 1500 ? 'Normal' : 'Rápido' : 'Indisponível'}
                  </Badge>
                  {isContingencyActive && (
                    <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Contingência Ativa</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">Última verificação: {formatDateTime(health.lastCheck.toISOString())}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="auto-monitor" checked={autoMonitor} onCheckedChange={setAutoMonitor} />
                <Label htmlFor="auto-monitor" className="text-sm">Auto</Label>
              </div>
              <Button variant="outline" onClick={onCheck} disabled={isChecking} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />Verificar Agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
