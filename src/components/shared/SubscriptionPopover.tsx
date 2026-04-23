import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type SavedFilterSubscription,
  type SubscriptionFrequencia,
} from "@/hooks/useSavedFilterSubscriptions";
import { describeFrequencia } from "@/hooks/savedFilterDispatchSchedule";
import { useState, useEffect } from "react";

/**
 * Popover compacto para configurar uma assinatura de filtro salvo.
 *
 * Cobre os 4 eixos da preferência: canal in-app, canal push, cadência
 * (imediata/horária/diária) e horário preferido. Mantém o componente "burro"
 * — todas as mutations vivem no SavedFiltersBar para reaproveitar `useSavedFilterSubscriptions`.
 *
 * Por que controlado localmente: cada interação no Switch/Select é
 * confirmada via "Salvar" para evitar disparar várias updates por clique
 * (cada update reseta `next_dispatch_at` no banco).
 */
export interface SubscriptionPopoverProps {
  subscription: SavedFilterSubscription | null;
  filterName: string;
  isBusy: boolean;
  pushReady: boolean;
  onEnablePush: () => Promise<void> | void;
  onSubscribe: (input: {
    notifyInapp: boolean;
    notifyPush: boolean;
    notifyEmail: boolean;
    frequencia: SubscriptionFrequencia;
    horarioPreferido: string;
  }) => void;
  onUpdate: (input: {
    id: string;
    notifyInapp: boolean;
    notifyPush: boolean;
    notifyEmail: boolean;
    frequencia: SubscriptionFrequencia;
    horarioPreferido: string;
  }) => void;
  onUnsubscribe: (id: string) => void;
}

export function SubscriptionPopover({
  subscription,
  filterName,
  isBusy,
  pushReady,
  onEnablePush,
  onSubscribe,
  onUpdate,
  onUnsubscribe,
}: SubscriptionPopoverProps) {
  const active = !!subscription;
  const [open, setOpen] = useState(false);
  const [inapp, setInapp] = useState(subscription?.notify_inapp ?? true);
  const [push, setPush] = useState(subscription?.notify_push ?? false);
  const [email, setEmail] = useState(subscription?.notify_email ?? false);
  const [freq, setFreq] = useState<SubscriptionFrequencia>(
    subscription?.frequencia ?? "imediata",
  );
  const [horario, setHorario] = useState(
    (subscription?.horario_preferido ?? "09:00:00").slice(0, 5),
  );

  // Sincroniza estado local quando o popover (re)abre ou subscription muda
  useEffect(() => {
    if (!open) return;
    setInapp(subscription?.notify_inapp ?? true);
    setPush(subscription?.notify_push ?? false);
    setEmail(subscription?.notify_email ?? false);
    setFreq(subscription?.frequencia ?? "imediata");
    setHorario((subscription?.horario_preferido ?? "09:00:00").slice(0, 5));
  }, [open, subscription]);

  const horaCompleta = horario.length === 5 ? `${horario}:00` : horario;

  const handleSave = async () => {
    if (push && !pushReady) await onEnablePush();
    if (subscription) {
      onUpdate({
        id: subscription.id,
        notifyInapp: inapp,
        notifyPush: push,
        notifyEmail: email,
        frequencia: freq,
        horarioPreferido: horaCompleta,
      });
    } else {
      onSubscribe({
        notifyInapp: inapp,
        notifyPush: push,
        notifyEmail: email,
        frequencia: freq,
        horarioPreferido: horaCompleta,
      });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isBusy}
          className={
            (active ? "text-primary" : "opacity-50 hover:opacity-100") +
            " disabled:opacity-30 disabled:cursor-wait"
          }
          title={
            active
              ? `Notificações: ${describeFrequencia(subscription!.frequencia)}`
              : "Configurar notificações"
          }
          onClick={(e) => e.stopPropagation()}
        >
          {isBusy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : active ? (
            <Bell className="h-3 w-3" />
          ) : (
            <BellOff className="h-3 w-3" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium leading-tight">
            Notificações para "{filterName}"
          </p>
          <p className="text-xs text-muted-foreground">
            Defina canal e cadência das alertas deste filtro.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sub-inapp" className="text-xs font-normal">
            No app (toast)
          </Label>
          <Switch id="sub-inapp" checked={inapp} onCheckedChange={setInapp} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sub-push" className="text-xs font-normal">
            Push do navegador
          </Label>
          <Switch id="sub-push" checked={push} onCheckedChange={setPush} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sub-email" className="text-xs font-normal">
            E-mail
          </Label>
          <Switch id="sub-email" checked={email} onCheckedChange={setEmail} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Frequência</Label>
          <Select
            value={freq}
            onValueChange={(v) => setFreq(v as SubscriptionFrequencia)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imediata">Imediata (tempo real)</SelectItem>
              <SelectItem value="horaria">A cada 1 hora (resumo)</SelectItem>
              <SelectItem value="diaria">Diária (1x ao dia)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {freq !== "imediata" && (
          <div className="space-y-1">
            <Label htmlFor="sub-horario" className="text-xs">
              Horário preferido
            </Label>
            <Input
              id="sub-horario"
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              {freq === "diaria"
                ? "Resumo diário enviado nesse horário."
                : "Minuto da hora cheia em que o resumo é enviado."}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {active ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-7 px-2 text-xs"
              onClick={() => {
                onUnsubscribe(subscription!.id);
                setOpen(false);
              }}
            >
              Desativar
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleSave}
            disabled={!inapp && !push}
          >
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
