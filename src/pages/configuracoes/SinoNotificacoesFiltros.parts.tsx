// Sub-componente SubscriptionRow da página SinoNotificacoesFiltros — extraído para zerar max-lines.
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { describeFrequencia } from "@/hooks/savedFilterDispatchSchedule";
import { cn } from "@/lib/utils";
import type { SavedFilterSubscription } from "@/hooks/useSavedFilterSubscriptions";
import type { SavedFilterRowMin } from "./SinoNotificacoesFiltros.helpers";

interface SubscriptionRowProps {
  filter: SavedFilterRowMin;
  subscription: SavedFilterSubscription | null;
  realtimeOn: boolean;
  pushReady: boolean;
  pushSupported: boolean;
  isBusy: boolean;
  onToggleInapp: (checked: boolean) => void;
  onTogglePush: (checked: boolean) => Promise<void> | void;
  onUnsubscribe: (id: string) => void;
}

export function SubscriptionRow({
  filter,
  subscription,
  realtimeOn,
  pushReady,
  pushSupported,
  isBusy,
  onToggleInapp,
  onTogglePush,
  onUnsubscribe,
}: SubscriptionRowProps) {
  const active = !!subscription;
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        active ? "border-primary/30 bg-primary/[0.02]" : "border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {active ? (
              <Bell className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <BellOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <p className="text-sm font-medium truncate">{filter.name}</p>
            {filter.is_default && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                Padrão
              </Badge>
            )}
            {filter.is_shared && (
              <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                Compartilhado
              </Badge>
            )}
          </div>
          {active && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {describeFrequencia(subscription!.frequencia)}
              {subscription!.frequencia !== "imediata" &&
                ` · ${subscription!.horario_preferido.slice(0, 5)}`}
              {subscription!.notify_email && " · e-mail"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label
              htmlFor={`inapp-${filter.id}`}
              className="text-[11px] font-normal text-muted-foreground cursor-pointer"
            >
              No app
            </Label>
            <Switch
              id={`inapp-${filter.id}`}
              checked={subscription?.notify_inapp ?? false}
              onCheckedChange={onToggleInapp}
              disabled={isBusy}
            />
          </div>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <Label
              htmlFor={`push-${filter.id}`}
              className={cn(
                "text-[11px] font-normal cursor-pointer",
                pushSupported ? "text-muted-foreground" : "text-muted-foreground/40",
              )}
            >
              Push
            </Label>
            <Switch
              id={`push-${filter.id}`}
              checked={subscription?.notify_push ?? false}
              onCheckedChange={(c) => void onTogglePush(c)}
              disabled={isBusy || !pushSupported}
            />
          </div>
          {active && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                onClick={() => onUnsubscribe(subscription!.id)}
                disabled={isBusy}
              >
                Remover
              </Button>
            </>
          )}
        </div>
      </div>
      {active && subscription!.notify_push && !pushReady && (
        <p className="text-[10px] text-warning mt-2">
          ⚠️ Push habilitado nesta assinatura, mas o navegador não autorizou
          notificações. Use o botão "Ativar push" no topo.
        </p>
      )}
      {active && !realtimeOn && (
        <p className="text-[10px] text-muted-foreground/70 mt-2 italic">
          Preferência salva. Tempo real será aplicado quando este módulo
          ganhar suporte.
        </p>
      )}
    </div>
  );
}
