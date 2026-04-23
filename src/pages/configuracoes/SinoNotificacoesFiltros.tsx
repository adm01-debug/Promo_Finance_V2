import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Loader2,
  Radio,
  ChevronLeft,
  Inbox,
  Smartphone,
  Mail,
  Filter,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useSavedFilterSubscriptions,
  type SavedFilterSubscription,
} from "@/hooks/useSavedFilterSubscriptions";
import { useWebPushSubscription } from "@/hooks/useWebPushSubscription";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { findCatalogEntry } from "./savedFiltersCatalog";
import { describeFrequencia } from "@/hooks/savedFilterDispatchSchedule";
import { cn } from "@/lib/utils";

/**
 * Entity types que possuem dispatcher de tempo real registrado em
 * `useSavedFilterAlerts*`. Mantém em sincronia com os hooks instanciados
 * em src/pages/* (Conciliacao + AnomaliasDetectadasPanel).
 */
const REALTIME_ENABLED_ENTITY_TYPES = new Set([
  "anomalias_detectadas",
  "conciliacao_transacoes",
]);

interface SavedFilterRowMin {
  id: string;
  name: string;
  entity_type: string;
  is_default: boolean;
  is_shared: boolean;
  updated_at: string;
}

/** Rótulos amigáveis para entity_types que não vivem no catálogo. */
const ENTITY_TYPE_LABELS: Record<string, { label: string; area: string; route?: string }> = {
  anomalias_detectadas: {
    label: "Anomalias detectadas",
    area: "IA / Insights",
    route: "/admin/insights-ia",
  },
  conciliacao_transacoes: {
    label: "Conciliação bancária",
    area: "Financeiro",
    route: "/conciliacao",
  },
};

function getEntityMeta(entityType: string) {
  const fromCatalog = findCatalogEntry(entityType);
  if (fromCatalog) {
    return {
      label: fromCatalog.label,
      area: fromCatalog.area,
      route: fromCatalog.route,
    };
  }
  return (
    ENTITY_TYPE_LABELS[entityType] ?? {
      label: entityType,
      area: "Outros",
      route: undefined,
    }
  );
}

export default function SinoNotificacoesFiltros() {
  const { user } = useAuth();
  const {
    subscriptions,
    byFilterId,
    isLoading: subsLoading,
    subscribe,
    updateChannels,
    unsubscribe,
  } = useSavedFilterSubscriptions();
  const { supported: pushSupported, subscribed: pushReady, subscribe: enablePush } =
    useWebPushSubscription();

  // Lista TODOS os filtros salvos visíveis ao usuário, agrupados por entity_type
  const filtersQuery = useQuery({
    queryKey: ["sino-saved-filters", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filters" as any)
        .select("id,name,entity_type,is_default,is_shared,updated_at")
        .order("entity_type", { ascending: true })
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SavedFilterRowMin[];
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, SavedFilterRowMin[]>();
    (filtersQuery.data ?? []).forEach((f) => {
      const list = map.get(f.entity_type) ?? [];
      list.push(f);
      map.set(f.entity_type, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) =>
      getEntityMeta(a).label.localeCompare(getEntityMeta(b).label),
    );
  }, [filtersQuery.data]);

  const totals = useMemo(() => {
    const subs = subscriptions ?? [];
    return {
      total: subs.length,
      inapp: subs.filter((s) => s.notify_inapp).length,
      push: subs.filter((s) => s.notify_push).length,
      email: subs.filter((s) => s.notify_email).length,
    };
  }, [subscriptions]);

  const isLoading = subsLoading || filtersQuery.isLoading;

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 -ml-2 text-xs">
            <Link to="/configuracoes">
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Configurações
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Sino dos filtros salvos
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Para cada filtro salvo, escolha por onde quer ser avisado quando
            entrarem novos registros e veja se o tempo real está ativo no preset.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/configuracoes/notificacoes/historico">
            <Inbox className="h-4 w-4 mr-2" />
            Histórico
          </Link>
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Assinaturas ativas</p>
              <p className="text-2xl font-bold">{totals.total}</p>
            </div>
            <Filter className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">No app</p>
              <p className="text-2xl font-bold">{totals.inapp}</p>
            </div>
            <Bell className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Push</p>
              <p className="text-2xl font-bold">{totals.push}</p>
            </div>
            <Smartphone className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="text-2xl font-bold">{totals.email}</p>
            </div>
            <Mail className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
      </div>

      {/* Aviso push */}
      {!pushSupported && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-3 text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-warning" />
            Este navegador não suporta push. As assinaturas funcionarão apenas
            no app e por e-mail.
          </CardContent>
        </Card>
      )}
      {pushSupported && !pushReady && totals.push > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-3 text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              Você tem {totals.push} assinatura(s) com push, mas o navegador não está pronto.
            </span>
            <Button size="sm" variant="outline" onClick={() => enablePush()}>
              Ativar push
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grupos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Você ainda não tem filtros salvos. Crie um preset em qualquer módulo
            para configurar notificações por aqui.
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
          className="space-y-4"
        >
          {grouped.map(([entityType, filters]) => {
            const meta = getEntityMeta(entityType);
            const realtimeOn = REALTIME_ENABLED_ENTITY_TYPES.has(entityType);
            return (
              <motion.div
                key={entityType}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {meta.label}
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-1.5 text-[10px] gap-1",
                              realtimeOn
                                ? "border-success/40 bg-success/5 text-success"
                                : "border-muted-foreground/30 text-muted-foreground",
                            )}
                          >
                            <Radio
                              className={cn(
                                "h-2.5 w-2.5",
                                realtimeOn && "animate-pulse",
                              )}
                            />
                            {realtimeOn ? "Tempo real ativo" : "Sem tempo real"}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {meta.area} · {filters.length} filtro(s)
                        </CardDescription>
                      </div>
                      {meta.route && (
                        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                          <Link to={meta.route}>Abrir módulo</Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {!realtimeOn && (
                      <p className="text-[11px] text-muted-foreground/80 italic">
                        Este módulo ainda não dispara alertas de novos registros.
                        As preferências ficam salvas e serão aplicadas assim que
                        o tempo real for habilitado.
                      </p>
                    )}
                    {filters.map((f) => {
                      const sub = byFilterId.get(f.id);
                      return (
                        <SubscriptionRow
                          key={f.id}
                          filter={f}
                          subscription={sub ?? null}
                          realtimeOn={realtimeOn}
                          pushReady={pushReady}
                          pushSupported={pushSupported}
                          onToggleInapp={(checked) => {
                            if (sub) {
                              updateChannels.mutate({
                                id: sub.id,
                                notifyInapp: checked,
                              });
                            } else {
                              subscribe.mutate({
                                savedFilterId: f.id,
                                notifyInapp: checked,
                                notifyPush: false,
                              });
                            }
                          }}
                          onTogglePush={async (checked) => {
                            if (checked && !pushReady) await enablePush();
                            if (sub) {
                              updateChannels.mutate({
                                id: sub.id,
                                notifyPush: checked,
                              });
                            } else {
                              subscribe.mutate({
                                savedFilterId: f.id,
                                notifyInapp: true,
                                notifyPush: checked,
                              });
                            }
                          }}
                          onUnsubscribe={(id) => unsubscribe.mutate(id)}
                          isBusy={
                            subscribe.isPending ||
                            updateChannels.isPending ||
                            unsubscribe.isPending
                          }
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

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

function SubscriptionRow({
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
