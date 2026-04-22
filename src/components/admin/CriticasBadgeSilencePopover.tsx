import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { BellOff, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAnomaliaPreferences,
  type Severidade,
} from "@/hooks/useAnomaliaPreferences";
import { useLogAudit } from "@/hooks/useAuditLog";

interface Props {
  count: number;
}

const DURACOES: { label: string; minutos: number }[] = [
  { label: "15 min", minutos: 15 },
  { label: "1 hora", minutos: 60 },
  { label: "4 horas", minutos: 240 },
  { label: "Hoje (até 23h59)", minutos: -1 },
];

const SEV_OPTIONS: { key: Severidade; label: string }[] = [
  { key: "critica", label: "Crítica" },
  { key: "alta", label: "Alta" },
];

/**
 * Badge clicável que abre um popover para silenciar rapidamente
 * a categoria (severidades crítica/alta) por uma duração curta,
 * sem precisar abrir o diálogo completo de preferências.
 */
export function CriticasBadgeSilencePopover({ count }: Props) {
  const { preferences, update } = useAnomaliaPreferences();
  const logAudit = useLogAudit();
  const [open, setOpen] = useState(false);
  const [pendingMin, setPendingMin] = useState<number | null>(null);

  const sevAtivas = preferences?.toast_severidades_ativas ?? [
    "critica",
    "alta",
  ];

  const silenciadoAteLabel = useMemo(() => {
    if (!preferences?.silenciar_ate) return null;
    const d = new Date(preferences.silenciar_ate);
    if (d.getTime() <= Date.now()) return null;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [preferences?.silenciar_ate]);

  const aplicarSilenciar = async (minutos: number) => {
    setPendingMin(minutos);
    try {
      const agora = new Date();
      let ate: Date;
      if (minutos < 0) {
        ate = new Date(agora);
        ate.setHours(23, 59, 59, 999);
      } else {
        ate = new Date(agora.getTime() + minutos * 60_000);
      }
      const previa = preferences?.silenciar_ate ?? null;
      await update.mutateAsync({ silenciar_ate: ate.toISOString() });

      const duracaoMin =
        minutos < 0
          ? Math.round((ate.getTime() - agora.getTime()) / 60_000)
          : minutos;

      await logAudit
        .mutateAsync({
          action: "UPDATE",
          tableName: "user_anomalia_preferences",
          recordId: preferences?.id,
          oldData: { silenciar_ate: previa },
          newData: {
            silenciar_ate: ate.toISOString(),
            duracao_minutos: duracaoMin,
            origem: "criticas_badge_quick_silence",
            severidades_alvo: sevAtivas,
          },
          details: `SILENCE_ALERTS via badge crítica/alta em ${agora.toISOString()} | até ${ate.toISOString()} (${duracaoMin} min) | severidades=[${sevAtivas.join(", ")}]`,
        })
        .catch(() => undefined);

      toast.success(`Alertas silenciados até ${ate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao silenciar");
    } finally {
      setPendingMin(null);
    }
  };

  const reativar = async () => {
    setPendingMin(0);
    try {
      const previa = preferences?.silenciar_ate ?? null;
      await update.mutateAsync({ silenciar_ate: null });
      await logAudit
        .mutateAsync({
          action: "UPDATE",
          tableName: "user_anomalia_preferences",
          recordId: preferences?.id,
          oldData: { silenciar_ate: previa },
          newData: {
            silenciar_ate: null,
            origem: "criticas_badge_quick_silence",
          },
          details: `UNSILENCE_ALERTS via badge crítica/alta em ${new Date().toISOString()}`,
        })
        .catch(() => undefined);
      toast.success("Alertas reativados");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao reativar");
    } finally {
      setPendingMin(null);
    }
  };

  const toggleSeveridade = async (sev: Severidade) => {
    const atual = new Set(sevAtivas);
    if (atual.has(sev)) atual.delete(sev);
    else atual.add(sev);
    const next = Array.from(atual) as Severidade[];
    if (next.length === 0) {
      toast.error("Mantenha ao menos 1 severidade ativa");
      return;
    }
    try {
      await update.mutateAsync({ toast_severidades_ativas: next });
      toast.success(
        atual.has(sev)
          ? `Notificações de ${sev} reativadas`
          : `Notificações de ${sev} silenciadas`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Silenciar alertas críticos/altos"
          className="inline-flex"
        >
          <Badge
            variant="destructive"
            className="ml-1 cursor-pointer hover:opacity-90 transition-opacity"
            aria-live="polite"
          >
            {count} crítica{count > 1 ? "s" : ""}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="px-3 py-2.5 border-b">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <BellOff className="h-3.5 w-3.5" /> Silenciar rapidamente
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pausa toasts e contadores por um período curto.
          </p>
          {silenciadoAteLabel && (
            <p className="text-xs text-warning mt-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Silenciado até {silenciadoAteLabel}
            </p>
          )}
        </div>

        <div className="p-2 grid grid-cols-2 gap-1.5">
          {DURACOES.map((d) => (
            <Button
              key={d.minutos}
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={update.isPending && pendingMin === d.minutos}
              onClick={() => aplicarSilenciar(d.minutos)}
            >
              {update.isPending && pendingMin === d.minutos ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              {d.label}
            </Button>
          ))}
        </div>

        {silenciadoAteLabel && (
          <div className="px-2 pb-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full h-8 text-xs"
              disabled={update.isPending && pendingMin === 0}
              onClick={reativar}
            >
              {update.isPending && pendingMin === 0 ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Reativar agora
            </Button>
          </div>
        )}

        <Separator />

        <div className="p-2.5 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Categorias notificadas
          </p>
          {SEV_OPTIONS.map((s) => {
            const ativa = sevAtivas.includes(s.key);
            return (
              <Button
                key={s.key}
                size="sm"
                variant={ativa ? "secondary" : "ghost"}
                className="w-full h-8 justify-between text-xs"
                onClick={() => toggleSeveridade(s.key)}
                disabled={update.isPending}
              >
                <span>{s.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {ativa ? "Notificando" : "Silenciada"}
                </span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
