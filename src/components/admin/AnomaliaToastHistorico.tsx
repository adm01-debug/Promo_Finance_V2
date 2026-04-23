import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, History, Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dispatchOpenAnomaliaDrawer } from "@/lib/anomalia-routes";
import { useAuth } from "@/hooks/useAuth";

interface ToastEvento {
  id: string;
  anomalia_id: string;
  severidade: string;
  tipo_anomalia: string | null;
  titulo: string;
  descricao: string | null;
  centro_custo_nome: string | null;
  acoes_disponiveis: string[];
  duracao_segundos: number;
  dispatched_at: string;
}

const ACAO_LABEL: Record<string, string> = {
  drill_down: "Drill-down",
  abrir_pagina: "Abrir página",
  copiar_id: "Copiar ID",
  marcar_lida: "Marcar lida",
};

const SEV_VARIANT: Record<
  string,
  "destructive" | "secondary" | "outline"
> = {
  critica: "destructive",
  alta: "destructive",
  media: "secondary",
  baixa: "outline",
};

function relativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.floor(h / 24);
  return `${d} d atrás`;
}

/**
 * Histórico dos toasts disparados para o usuário atual.
 * Mostra severidade, ações que estavam disponíveis no momento do toast
 * e por quanto tempo ele ficou visível.
 */
export function AnomaliaToastHistorico() {
  const { user } = useAuth();

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["anomalia-toast-eventos", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<ToastEvento[]> => {
      const { data, error } = await supabase
        .from("anomalia_toast_eventos")
        .select(
          "id, anomalia_id, severidade, tipo_anomalia, titulo, descricao, centro_custo_nome, acoes_disponiveis, duracao_segundos, dispatched_at",
        )
        .order("dispatched_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ToastEvento[];
    },
  });

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Histórico de toasts</span>
        <span className="text-[11px] text-muted-foreground">
          Últimos 50 toasts disparados — severidade, ações disponíveis e
          duração.
        </span>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-3 text-center">
          Carregando…
        </p>
      ) : eventos.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-3 text-center border border-dashed rounded">
          Nenhum toast disparado ainda — quando uma nova anomalia chegar e suas
          preferências permitirem, aparecerá aqui.
        </p>
      ) : (
        <ScrollArea className="h-64 rounded border">
          <ul className="divide-y">
            {eventos.map((ev) => (
              <li key={ev.id} className="p-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant={SEV_VARIANT[ev.severidade] ?? "outline"}
                        className="text-[10px] capitalize"
                      >
                        {ev.severidade}
                      </Badge>
                      <span className="text-xs font-semibold truncate">
                        {ev.titulo}
                      </span>
                    </div>
                    {ev.descricao && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {ev.descricao}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 shrink-0"
                    onClick={() => dispatchOpenAnomaliaDrawer(ev.anomalia_id)}
                    title="Abrir drawer da anomalia"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {relativo(ev.dispatched_at)}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    visível por {ev.duracao_segundos}s
                  </span>
                  {ev.centro_custo_nome && (
                    <>
                      <span>·</span>
                      <span className="truncate">{ev.centro_custo_nome}</span>
                    </>
                  )}
                </div>
                {ev.acoes_disponiveis.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {ev.acoes_disponiveis.map((a) => (
                      <Badge
                        key={a}
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {ACAO_LABEL[a] ?? a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">
                    Sem ações configuradas no momento do disparo
                  </p>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
