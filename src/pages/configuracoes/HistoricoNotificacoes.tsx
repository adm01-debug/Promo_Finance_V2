import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Smartphone,
  CheckCheck,
  Loader2,
  Filter as FilterIcon,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { findCatalogEntry } from "./savedFiltersCatalog";

/** Fallback de rotas para entity_types fora do catálogo. */
const ENTITY_TYPE_ROUTES: Record<string, string> = {
  anomalias_detectadas: "/admin/insights-ia",
  conciliacao_transacoes: "/conciliacao",
};

function getModuleRoute(entityType: string | null | undefined): string | null {
  if (!entityType) return null;
  return findCatalogEntry(entityType)?.route ?? ENTITY_TYPE_ROUTES[entityType] ?? null;
}

type Channel = "inapp" | "push" | "email";

interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  channel: Channel;
  status: "sent" | "failed" | "queued";
  error_message: string | null;
  metadata:
    | (Record<string, unknown> & {
        filterName?: string;
        entityType?: string;
        url?: string | null;
        matchCount?: number;
        reason?: string;
      })
    | null;
  source_ref: string | null;
  read_at: string | null;
  created_at: string;
}

const CHANNEL_LABEL: Record<Channel, { label: string; icon: typeof Bell }> = {
  inapp: { label: "No app", icon: Bell },
  push: { label: "Push", icon: Smartphone },
  email: { label: "E-mail", icon: Mail },
};

export default function HistoricoNotificacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | Channel>("all");
  const [filterName, setFilterName] = useState<string>("all");

  const queryKey = ["notification-history", user?.id, filter];

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<NotificationRow[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase.from("notification_history" as any) as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("channel", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

  // Realtime: novas notificações entram no topo sem refresh manual
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notification-history:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_history",
          filter: `user_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ["notification-history", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("notification_history" as any)
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-history", user?.id] }),
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("notification_history" as any)
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Todas marcadas como lidas");
      qc.invalidateQueries({ queryKey: ["notification-history", user?.id] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const stats = useMemo(() => {
    const list = data ?? [];
    return {
      total: list.length,
      unread: list.filter((n) => !n.read_at).length,
      email: list.filter((n) => n.channel === "email").length,
      failed: list.filter((n) => n.status === "failed").length,
    };
  }, [data]);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Histórico de notificações</h1>
          <p className="text-sm text-muted-foreground">
            Tudo que foi enviado para você por canal (no app, push e e-mail).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || stats.unread === 0}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Marcar todas como lidas
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Não lidas" value={stats.unread} accent="text-primary" />
        <StatCard label="Por e-mail" value={stats.email} />
        <StatCard label="Falhas" value={stats.failed} accent="text-destructive" />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="inapp">No app</TabsTrigger>
          <TabsTrigger value="push">Push</TabsTrigger>
          <TabsTrigger value="email">E-mail</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entregas recentes</CardTitle>
          <CardDescription>Últimas 200 notificações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
            </div>
          )}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma notificação por aqui ainda.
            </p>
          )}
          {(data ?? []).map((n) => {
            const Icon = CHANNEL_LABEL[n.channel].icon;
            const unread = !n.read_at;
            return (
              <div
                key={n.id}
                className={
                  "flex items-start gap-3 p-3 rounded-lg border " +
                  (unread ? "bg-primary/5 border-primary/30" : "bg-card")
                }
              >
                <div className="p-2 rounded-md bg-muted">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {CHANNEL_LABEL[n.channel].label}
                    </Badge>
                    {n.status === "failed" && (
                      <Badge variant="destructive" className="text-[10px]">
                        Falhou
                      </Badge>
                    )}
                  </div>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line line-clamp-3">
                      {n.body}
                    </p>
                  )}
                  {n.error_message && (
                    <p className="text-[11px] text-destructive mt-1">
                      {n.error_message}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                {unread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => markRead.mutate(n.id)}
                  >
                    Marcar lida
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={"text-2xl font-bold " + (accent ?? "")}>{value}</p>
      </CardContent>
    </Card>
  );
}
