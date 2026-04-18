// ============================================
// COMPONENT: PushNotificationsBanner (P10)
// ============================================
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWebPushSubscription } from "@/hooks/useWebPushSubscription";

export function PushNotificationsBanner() {
  const { supported, subscribed, loading, subscribe, unsubscribe } = useWebPushSubscription();

  if (!supported) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          {subscribed
            ? <Bell className="h-5 w-5 text-primary" />
            : <BellOff className="h-5 w-5 text-muted-foreground" />}
          <div>
            <div className="text-sm font-medium">
              {subscribed ? "Notificações push ativas" : "Ative notificações push"}
            </div>
            <div className="text-xs text-muted-foreground">
              Receba alertas críticos em tempo real, mesmo com a aba fechada.
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant={subscribed ? "outline" : "default"}
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {subscribed ? "Desativar" : "Ativar"}
        </Button>
      </CardContent>
    </Card>
  );
}
