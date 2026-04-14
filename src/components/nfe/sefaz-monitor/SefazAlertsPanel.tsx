import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, XCircle, AlertTriangle, CheckCircle2, AlertCircle, Server } from 'lucide-react';
import type { ContingencyState } from '@/lib/sefaz-contingency';
import type { AutoContingencyConfig } from '@/lib/sefaz-contingency';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

interface Props {
  contingencyState: ContingencyState;
  autoConfig: AutoContingencyConfig;
  alerts: AlertItem[];
  showAlerts: boolean;
  setShowAlerts: (v: boolean) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function SefazContingencyAlerts({ contingencyState, autoConfig, alerts, showAlerts, setShowAlerts, onDismiss, onClearAll }: Props) {
  const activeAlerts = alerts.filter(a => !a.dismissed);

  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Server className="h-5 w-5 text-primary" />Estado da Contingência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Modo Atual</p>
              <p className="text-sm text-muted-foreground">
                {contingencyState.mode === 'normal' ? 'Operação Normal' : contingencyState.mode === 'SVCAN' ? 'SVC-AN' : contingencyState.mode === 'SVCRS' ? 'SVC-RS' : contingencyState.mode === 'DPEC' ? 'EPEC' : 'Offline'}
              </p>
            </div>
            <Badge variant={contingencyState.mode === 'normal' ? 'default' : 'destructive'}>
              {contingencyState.mode === 'normal' ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Normal</> : <><AlertTriangle className="h-3 w-3 mr-1" /> Contingência</>}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ativação automática</span><Badge variant="outline">{autoConfig.enabled ? 'Habilitada' : 'Desabilitada'}</Badge></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Intervalo de verificação</span><span>{autoConfig.checkIntervalSeconds}s</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Regras configuradas</span><span>{autoConfig.rules.length}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />Alertas em Tempo Real
              {activeAlerts.length > 0 && <Badge variant="destructive" className="ml-2">{activeAlerts.length}</Badge>}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-alerts" checked={showAlerts} onCheckedChange={setShowAlerts} />
            <Label htmlFor="show-alerts" className="text-xs">{showAlerts ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}</Label>
            {alerts.length > 0 && <Button variant="ghost" size="sm" onClick={onClearAll}>Limpar</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Nenhum alerta registrado</p></div>
            ) : (
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: alert.dismissed ? 0.5 : 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                    className={`flex items-start gap-3 p-3 rounded-lg ${alert.type === 'error' ? 'bg-destructive/10' : alert.type === 'warning' ? 'bg-warning/10' : alert.type === 'success' ? 'bg-success/10' : 'bg-primary/10'}`}>
                    <div className={`p-1 rounded-full ${alert.type === 'error' ? 'bg-destructive/20' : alert.type === 'warning' ? 'bg-warning/20' : alert.type === 'success' ? 'bg-success/20' : 'bg-primary/20'}`}>
                      {alert.type === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                      {alert.type === 'success' && <CheckCircle2 className="h-4 w-4 text-success" />}
                      {alert.type === 'info' && <AlertCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.timestamp.toLocaleTimeString('pt-BR')}</p>
                    </div>
                    {!alert.dismissed && <button onClick={() => onDismiss(alert.id)} className="text-muted-foreground hover:text-foreground"><XCircle className="h-4 w-4" /></button>}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
