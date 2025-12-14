import { Bell, BellOff, Send, Smartphone, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificacoesConfig() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Notificações não são suportadas neste navegador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              Use um navegador moderno como Chrome, Firefox ou Edge para receber notificações push.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações Push
              </CardTitle>
              <CardDescription>
                Receba alertas críticos diretamente no seu dispositivo
              </CardDescription>
            </div>
            <Badge variant={isSubscribed ? 'default' : 'secondary'}>
              {isSubscribed ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          {permission === 'denied' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Notificações bloqueadas. Altere as configurações do navegador para permitir.
              </span>
            </div>
          )}

          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="push-toggle" className="font-medium">
                  Ativar Notificações Push
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receba alertas mesmo quando o app estiver fechado
                </p>
              </div>
            </div>
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading || permission === 'denied'}
            />
          </div>

          {/* Notification Types Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Você receberá notificações para:</h4>
            <div className="grid gap-2">
              {[
                { label: 'Alertas Críticos', desc: 'Pagamentos muito atrasados, saldo negativo' },
                { label: 'Alertas de Alta Prioridade', desc: 'Vencimentos próximos, inadimplência' },
                { label: 'Aprovações Pendentes', desc: 'Pagamentos aguardando sua aprovação' }
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                >
                  <Bell className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Button */}
          {isSubscribed && (
            <Button
              variant="outline"
              onClick={sendTestNotification}
              className="w-full"
              disabled={isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Notificação de Teste
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
