import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { maskIp } from '@/lib/ip-mask';
import type { SecurityAlert } from '@/hooks/useSecurityAlerts';

interface SecurityAlertsTabProps {
  alerts: SecurityAlert[];
  maskIpsEnabled: boolean;
  onResolve: (id: string) => void;
}

export function SecurityAlertsTab({ alerts, maskIpsEnabled, onResolve }: SecurityAlertsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Segurança</CardTitle>
        <CardDescription>Notificações em tempo real sobre atividades suspeitas</CardDescription>
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
                className={`p-4 rounded-lg border ${alert.resolved ? 'bg-muted/30 border-border' : alert.severity === 'critical' ? 'bg-destructive/10 border-destructive/50' : alert.severity === 'high' ? 'bg-streak/10 border-streak/50' : 'bg-warning/10 border-warning/50'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`h-5 w-5 mt-0.5 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'high' ? 'text-streak' : 'text-warning'}`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{alert.title}</p>
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'destructive'
                              : alert.severity === 'high'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        {alert.resolved && (
                          <Badge variant="outline" className="text-success">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      {alert.description && (
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {alert.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {maskIp(alert.ip_address, maskIpsEnabled)}
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
                    <Button variant="ghost" size="sm" onClick={() => onResolve(alert.id)}>
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
  );
}
