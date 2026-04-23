import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  ANOMALIA_DRAWER_EVENT,
  dispatchOpenAnomaliaDrawer,
} from "@/lib/anomalia-routes";
import {
  useAnomaliaPreferences,
  shouldNotify,
  type ToastAcaoKey,
} from "@/hooks/useAnomaliaPreferences";

const TIPO_LABEL: Record<string, string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

interface AcaoToast {
  label: string;
  onClick: () => void | Promise<void>;
}

/**
 * Subscribes to realtime INSERT events on anomalias_detectadas.
 * Toast severities, duration and actions are driven by user preferences.
 */
export function useRealtimeAnomalias() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { preferences } = useAnomaliaPreferences();
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("anomalias-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anomalias_detectadas" },
        async (payload) => {
          const a = payload.new as {
            id: string;
            severidade?: string;
            tipo_anomalia?: string;
            descricao?: string;
            centro_custo_id?: string | null;
          };

          if (!a?.id || seenIds.current.has(a.id)) return;
          seenIds.current.add(a.id);

          queryClient.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
          queryClient.invalidateQueries({
            queryKey: ["anomalias-detectadas", "pending-queue"],
          });
          queryClient.invalidateQueries({
            queryKey: ["anomalias-criticas-count"],
          });

          const prefs = prefsRef.current;
          if (!shouldNotify(prefs, a)) return;

          // Busca nome do centro de custo associado (quando houver) para enriquecer o toast
          let centroCustoNome: string | null = null;
          if (a.centro_custo_id) {
            const { data: cc } = await supabase
              .from("centros_custo")
              .select("nome, codigo")
              .eq("id", a.centro_custo_id)
              .maybeSingle();
            if (cc) centroCustoNome = `${cc.codigo} — ${cc.nome}`;
          }

          const isCritical = a.severidade === "critica";
          const tipoLabel = TIPO_LABEL[a.tipo_anomalia ?? ""] ?? "Nova anomalia";
          const titulo = `${isCritical ? "🚨 Crítica" : "⚠️ " + (a.severidade ?? "Anomalia")} — ${tipoLabel}`;
          const fn = isCritical ? toast.error : toast.warning;
          const descricaoToast = centroCustoNome
            ? `${a.descricao ?? ""}${a.descricao ? " · " : ""}Centro de custo: ${centroCustoNome}`
            : a.descricao;

          // Monta as ações habilitadas pelo usuário (na ordem desejada)
          const acoesOrdem: ToastAcaoKey[] = [
            "drill_down",
            "abrir_pagina",
            "copiar_id",
            "marcar_lida",
          ];
          const acoesAtivas = prefs?.toast_acoes ?? {
            drill_down: true,
            abrir_pagina: true,
            copiar_id: false,
            marcar_lida: false,
          };
          const acoes: AcaoToast[] = acoesOrdem
            .filter((k) => acoesAtivas[k])
            .map((k) => {
              switch (k) {
                case "drill_down":
                  return {
                    label: "Ver detalhes",
                    onClick: () => dispatchOpenAnomaliaDrawer(a.id),
                  };
                case "abrir_pagina":
                  return {
                    label: "Abrir página",
                    onClick: () =>
                      window.location.assign(
                        `/admin/insights-ia/anomalia/${a.id}`,
                      ),
                  };
                case "copiar_id":
                  return {
                    label: "Copiar ID",
                    onClick: async () => {
                      try {
                        await navigator.clipboard.writeText(a.id);
                        toast.success("ID copiado");
                      } catch {
                        toast.error("Não foi possível copiar");
                      }
                    },
                  };
                case "marcar_lida":
                  return {
                    label: "Marcar lida",
                    onClick: async () => {
                      const { error } = await supabase
                        .from("anomalias_detectadas")
                        .update({ status: "investigando" })
                        .eq("id", a.id)
                        .eq("status", "nova");
                      if (error) toast.error("Falha ao marcar como lida");
                      else toast.success("Marcada como lida");
                      queryClient.invalidateQueries({
                        queryKey: ["anomalias-detectadas"],
                      });
                    },
                  };
              }
            });

          const duracaoSeg = prefs?.toast_duracao_segundos ?? 12;
          const duracaoMs = duracaoSeg * 1000;
          const opts: Parameters<typeof fn>[1] = {
            description: descricaoToast,
            duration: duracaoMs,
          };
          if (acoes[0]) opts.action = acoes[0];
          if (acoes[1]) opts.cancel = acoes[1];

          fn(titulo, opts);

          // Para 3ª/4ª ações habilitadas, mostra um toast secundário com link
          // (sonner suporta só 1 action + 1 cancel por toast).
          if (acoes.length > 2) {
            for (let i = 2; i < acoes.length; i += 1) {
              toast(acoes[i].label, {
                description: `Ação extra para “${tipoLabel}”`,
                duration: duracaoMs,
                action: { label: acoes[i].label, onClick: acoes[i].onClick },
              });
            }
          }

          // Persiste evento no histórico de toasts (best-effort, não bloqueia UI)
          const acoesDisponiveis = acoesOrdem.filter((k) => acoesAtivas[k]);
          supabase
            .from("anomalia_toast_eventos")
            .insert({
              user_id: user.id,
              anomalia_id: a.id,
              severidade: a.severidade ?? "baixa",
              tipo_anomalia: a.tipo_anomalia ?? null,
              titulo,
              descricao: descricaoToast ?? null,
              centro_custo_id: a.centro_custo_id ?? null,
              centro_custo_nome: centroCustoNome,
              acoes_disponiveis: acoesDisponiveis,
              duracao_segundos: duracaoSeg,
            })
            .then(({ error }) => {
              if (error) {
                // Silencioso: não polui a UI por falha de logging
                console.warn("[anomalia-toast-eventos] insert falhou", error);
              }
            });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);
}

export { ANOMALIA_DRAWER_EVENT };
