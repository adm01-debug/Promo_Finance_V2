import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning';
  title: string;
  description: string;
}

interface Props {
  alerts: SecurityAlert[];
  onDismiss: (id: string) => void;
}

export function AuditSecurityAlerts({ alerts, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={alert.type === 'critical' ? 'error' : 'default'} className="relative">
          <div className="flex items-start gap-3">
            {alert.type === 'critical' ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <div className="flex-1">
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </div>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => onDismiss(alert.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
