import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  SEVERIDADES_DISPONIVEIS,
  type SavedFilterSubscription,
  type SeveridadeAlerta,
  type SubscriptionFrequencia,
} from "@/hooks/useSavedFilterSubscriptions";
import { describeFrequencia } from "@/hooks/savedFilterDispatchSchedule";
import { useState, useEffect } from "react";

/**
 * Popover compacto para configurar uma assinatura de filtro salvo.
 *
 * Cobre os 6 eixos da preferência: canais (in-app/push/e-mail), cadência
 * (imediata/horária/diária), horário preferido, severidades consideradas
 * críticas e tipos de evento que disparam alerta. Mantém o componente
 * "burro" — todas as mutations vivem no SavedFiltersBar para reaproveitar
 * `useSavedFilterSubscriptions`.
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
  /**
   * Quando informado, exibe a seção "Tipos de evento" com checkboxes.
   * Cada item: { value: chave persistida, label: legível }. Vazio/undefined
   * remove a seção (compat para módulos sem catálogo de tipos).
   */
  tiposEventosOpcoes?: ReadonlyArray<{ value: string; label: string }>;
  onEnablePush: () => Promise<void> | void;
  onSubscribe: (input: {
    notifyInapp: boolean;
    notifyPush: boolean;
    notifyEmail: boolean;
    frequencia: SubscriptionFrequencia;
    horarioPreferido: string;
    severidadesCriticas: SeveridadeAlerta[];
    tiposEventosAtivos: string[];
    rateLimitMax: number;
    rateLimitWindowMin: number;
  }) => void;
  onUpdate: (input: {
    id: string;
    notifyInapp: boolean;
    notifyPush: boolean;
    notifyEmail: boolean;
    frequencia: SubscriptionFrequencia;
    horarioPreferido: string;
    severidadesCriticas: SeveridadeAlerta[];
    tiposEventosAtivos: string[];
    rateLimitMax: number;
    rateLimitWindowMin: number;
  }) => void;
  onUnsubscribe: (id: string) => void;
}

const SEVERIDADE_LABEL: Record<SeveridadeAlerta, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export function SubscriptionPopover({
  subscription,
  filterName,
  isBusy,
  pushReady,
  tiposEventosOpcoes,
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
  const [sevsCriticas, setSevsCriticas] = useState<SeveridadeAlerta[]>(
    subscription?.severidades_criticas ?? ["critica"],
  );
  const [tiposAtivos, setTiposAtivos] = useState<string[]>(
    subscription?.tipos_eventos_ativos ?? [],
  );
  const [rateLimitMax, setRateLimitMax] = useState<number>(
    subscription?.rate_limit_max ?? 5,
  );
  const [rateLimitWindow, setRateLimitWindow] = useState<number>(
    subscription?.rate_limit_window_min ?? 10,
  );

  // Sincroniza estado local quando o popover (re)abre ou subscription muda
  useEffect(() => {
    if (!open) return;
    setInapp(subscription?.notify_inapp ?? true);
    setPush(subscription?.notify_push ?? false);
    setEmail(subscription?.notify_email ?? false);
    setFreq(subscription?.frequencia ?? "imediata");
    setHorario((subscription?.horario_preferido ?? "09:00:00").slice(0, 5));
    setSevsCriticas(subscription?.severidades_criticas ?? ["critica"]);
    setTiposAtivos(subscription?.tipos_eventos_ativos ?? []);
    setRateLimitMax(subscription?.rate_limit_max ?? 5);
    setRateLimitWindow(subscription?.rate_limit_window_min ?? 10);
  }, [open, subscription]);

  const horaCompleta = horario.length === 5 ? `${horario}:00` : horario;

  const toggleSev = (sev: SeveridadeAlerta, checked: boolean) => {
    setSevsCriticas((prev) =>
      checked ? Array.from(new Set([...prev, sev])) : prev.filter((s) => s !== sev),
    );
  };
  const toggleTipo = (tipo: string, checked: boolean) => {
    setTiposAtivos((prev) =>
      checked ? Array.from(new Set([...prev, tipo])) : prev.filter((t) => t !== tipo),
    );
  };

  const handleSave = async () => {
    if (push && !pushReady) await onEnablePush();
    // Clamp defensivo — espelha o trigger do banco para evitar erro 4xx.
    const safeMax = Math.min(100, Math.max(1, Math.round(rateLimitMax) || 5));
    const safeWindow = Math.min(
      1440,
      Math.max(1, Math.round(rateLimitWindow) || 10),
    );
    const payload = {
      notifyInapp: inapp,
      notifyPush: push,
      notifyEmail: email,
      frequencia: freq,
      horarioPreferido: horaCompleta,
      severidadesCriticas: sevsCriticas,
      tiposEventosAtivos: tiposAtivos,
      rateLimitMax: safeMax,
      rateLimitWindowMin: safeWindow,
    };
    if (subscription) {
      onUpdate({ id: subscription.id, ...payload });
    } else {
      onSubscribe(payload);
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
        className="w-80 max-h-[80vh] overflow-y-auto space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium leading-tight">
            Notificações para "{filterName}"
          </p>
          <p className="text-xs text-muted-foreground">
            Defina canais, regras e cadência das alertas deste filtro.
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

        <div className="space-y-1 border-t pt-3">
          <Label className="text-xs font-medium">Severidades críticas</Label>
          <p className="text-[10px] text-muted-foreground">
            Marcadas em vermelho e priorizadas no push.
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {SEVERIDADES_DISPONIVEIS.map((sev) => (
              <label
                key={sev}
                className="flex items-center gap-2 text-xs cursor-pointer"
              >
                <Checkbox
                  checked={sevsCriticas.includes(sev)}
                  onChange={(e) => toggleSev(sev, e.target.checked)}
                />
                {SEVERIDADE_LABEL[sev]}
              </label>
            ))}
          </div>
        </div>

        {tiposEventosOpcoes && tiposEventosOpcoes.length > 0 && (
          <div className="space-y-1 border-t pt-3">
            <Label className="text-xs font-medium">Tipos de evento</Label>
            <p className="text-[10px] text-muted-foreground">
              Apenas os tipos selecionados disparam alerta. Nenhum = todos.
            </p>
            <div className="space-y-1.5 pt-1">
              {tiposEventosOpcoes.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Checkbox
                    checked={tiposAtivos.includes(opt.value)}
                    onChange={(e) => toggleTipo(opt.value, e.target.checked)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1 border-t pt-3">
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

        <div className="space-y-1 border-t pt-3">
          <Label className="text-xs font-medium">Anti-spam (rajadas)</Label>
          <p className="text-[10px] text-muted-foreground">
            Em modo imediato, no máx. <b>{rateLimitMax}</b> notificações em{" "}
            <b>{rateLimitWindow}</b> min. Excedente vira 1 resumo agrupado.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-0.5">
              <Label htmlFor="sub-rate-max" className="text-[10px]">
                Máx. por janela
              </Label>
              <Input
                id="sub-rate-max"
                type="number"
                min={1}
                max={100}
                value={rateLimitMax}
                onChange={(e) => setRateLimitMax(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="sub-rate-window" className="text-[10px]">
                Janela (min)
              </Label>
              <Input
                id="sub-rate-window"
                type="number"
                min={1}
                max={1440}
                value={rateLimitWindow}
                onChange={(e) => setRateLimitWindow(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

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
            disabled={!inapp && !push && !email}
          >
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
