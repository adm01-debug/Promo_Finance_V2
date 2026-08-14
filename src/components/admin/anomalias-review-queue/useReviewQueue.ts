import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  usePendingAnomaliasQueueInfinite,
  useRevisarAnomalia,
  AnomaliaJaRevisadaError,
} from "@/hooks/useAnomaliasDetectadas";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";
import { supabase } from "@/integrations/supabase/client";
import { TIPO_LABEL, mensagemErro } from "./helpers";
import { useConflitoNotifier } from "./conflito";
import { useRetry } from "./retry";
import { useAtalhosTeclado } from "./atalhos";
import {
  MIN_CONFIRMAR,
  MIN_FALSO_POSITIVO,
  SEVERIDADES,
  type Anomalia,
  type ConflitoBanner,
  type ProgressoPorSeveridade,
  type ReviewStats,
} from "./types";

interface Options {
  open: boolean;
  severidadeFilter: Anomalia["severidade"] | "todas";
}

export function useReviewQueue({ open, severidadeFilter }: Options) {
  const {
    items: fila,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePendingAnomaliasQueueInfinite(100);
  const revisar = useRevisarAnomalia();
  const sincronizar = useSincronizarAnomaliaBitrix();

  const [snapshot, setSnapshot] = useState<Anomalia[]>([]);
  const [index, setIndex] = useState(0);
  const [comentario, setComentario] = useState("");
  const [comentarioTocado, setComentarioTocado] = useState(false);
  const [stats, setStats] = useState<ReviewStats>({ confirmadas: 0, rejeitadas: 0, puladas: 0 });
  const [recarregando, setRecarregando] = useState(false);
  const [transicionando, setTransicionando] = useState(false);
  const [conflito, setConflito] = useState<ConflitoBanner | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Idempotência: ids com mutação em andamento (bloqueia submits duplicados)
  const inFlightIds = useRef<Set<string>>(new Set());
  // Idempotência: ids já sincronizados com Bitrix nesta sessão do modal
  const bitrixSincronizados = useRef<Set<string>>(new Set());

  // Reset dos guards ao (re)abrir o modal — evita estado preso após fechar durante mutação
  useEffect(() => {
    if (open) {
      inFlightIds.current.clear();
      bitrixSincronizados.current.clear();
    }
  }, [open]);

  const { notificarConflito, notificarRemovida } = useConflitoNotifier(setConflito);

  const recarregarPosicao = useCallback(
    async (novoIndex: number) => {
      if (novoIndex >= snapshot.length) {
        setIndex(novoIndex);
        return;
      }
      setRecarregando(true);
      try {
        let cursor = novoIndex;
        while (cursor < snapshot.length) {
          const candidato = snapshot[cursor];
          const { data, error } = await supabase
            .from("anomalias_detectadas")
            .select("*")
            .eq("id", candidato.id)
            .maybeSingle();

          if (error) break;

          if (!data) {
            toast.warning("Anomalia removida do sistema", {
              description: "Pulando para a próxima da fila.",
            });
            notificarRemovida(candidato);
            setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
            cursor += 1;
            continue;
          }

          const fresca = data as Anomalia;
          if (fresca.status !== "nova" && fresca.status !== "investigando") {
            await notificarConflito(candidato, fresca);
            setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
            cursor += 1;
            continue;
          }

          setSnapshot((prev) => {
            const copia = [...prev];
            copia[cursor] = fresca;
            return copia;
          });
          setIndex(cursor);
          return;
        }
        setIndex(snapshot.length);
      } finally {
        setRecarregando(false);
      }
    },
    [snapshot, notificarConflito, notificarRemovida],
  );

  // Snapshot inicial ao abrir
  useEffect(() => {
    if (open && !isLoading) {
      const filtrada =
        severidadeFilter === "todas"
          ? fila
          : fila.filter((a) => a.severidade === severidadeFilter);
      setSnapshot(filtrada);
      setIndex(0);
      setComentario("");
      setComentarioTocado(false);
      setStats({ confirmadas: 0, rejeitadas: 0, puladas: 0 });
      setConflito(null);
      setTransicionando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoading, severidadeFilter]);

  // Anexa páginas novas preservando updates locais
  useEffect(() => {
    if (!open) return;
    setSnapshot((prev) => {
      if (!fila.length) return prev;
      const filtrada =
        severidadeFilter === "todas"
          ? fila
          : fila.filter((a) => a.severidade === severidadeFilter);
      if (filtrada.length <= prev.length) return prev;
      const existentes = new Set(prev.map((a) => a.id));
      const novos = filtrada.filter((a) => !existentes.has(a.id));
      if (novos.length === 0) return prev;
      return [...prev, ...novos];
    });
  }, [fila, open, severidadeFilter]);

  // Pré-carrega próxima página
  useEffect(() => {
    if (!open || !hasNextPage || isFetchingNextPage) return;
    if (snapshot.length - index <= 20) {
      void fetchNextPage();
    }
  }, [open, index, snapshot.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const atual = snapshot[index];
  const total = snapshot.length;
  const finalizado = total > 0 && index >= total;
  const comentarioTrim = comentario.trim();
  const validoConfirmar = comentarioTrim.length >= MIN_CONFIRMAR;
  const validoFalsoPositivo = comentarioTrim.length >= MIN_FALSO_POSITIVO;
  const comentarioValido = validoConfirmar;

  const erroConfirmar = mensagemErro(comentarioTrim, MIN_CONFIRMAR, "confirmar o problema");
  const erroFalsoPositivo = mensagemErro(comentarioTrim, MIN_FALSO_POSITIVO, "marcar como falso positivo");
  const erroComentario = erroConfirmar ?? erroFalsoPositivo;
  const mostrarErroComentario = comentarioTocado && !!erroComentario;

  // Foco no textarea quando troca de anomalia
  useEffect(() => {
    if (atual && textareaRef.current) {
      textareaRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual?.id]);

  const dadosFormatados = useMemo(() => {
    if (!atual) return "";
    try {
      return JSON.stringify(atual.dados ?? {}, null, 2);
    } catch {
      return "—";
    }
  }, [atual]);

  const { contagemPorSeveridade, progressoPorSeveridade } = useMemo(() => {
    const total: Record<Anomalia["severidade"], number> = { critica: 0, alta: 0, media: 0, baixa: 0 };
    const revisado: Record<Anomalia["severidade"], number> = { critica: 0, alta: 0, media: 0, baixa: 0 };
    const restante: Record<Anomalia["severidade"], number> = { critica: 0, alta: 0, media: 0, baixa: 0 };
    for (let i = 0; i < snapshot.length; i++) {
      const sev = snapshot[i].severidade;
      if (!(sev in total)) continue;
      total[sev] += 1;
      if (i < index) revisado[sev] += 1;
      else restante[sev] += 1;
    }
    return {
      contagemPorSeveridade: restante,
      progressoPorSeveridade: { total, revisado } as ProgressoPorSeveridade,
    };
  }, [snapshot, index]);

  const pularParaSeveridade = useCallback(
    (sev: Anomalia["severidade"]) => {
      let alvo = snapshot.findIndex((a, i) => i >= index && a.severidade === sev);
      if (alvo === -1) alvo = snapshot.findIndex((a) => a.severidade === sev);
      if (alvo === -1) {
        toast.info(`Sem anomalias ${sev} na fila atual`);
        return;
      }
      if (alvo === index) return;
      setComentario("");
      setComentarioTocado(false);
      void recarregarPosicao(alvo);
    },
    [snapshot, index, recarregarPosicao],
  );

  const avancar = useCallback(async () => {
    setTransicionando(true);
    setComentario("");
    setComentarioTocado(false);
    try {
      await recarregarPosicao(index + 1);
    } finally {
      setTransicionando(false);
    }
  }, [index, recarregarPosicao]);

  const { withRetry } = useRetry();

  const handleAcao = useCallback(
    async (status: "confirmada" | "falso_positivo") => {
      if (!atual) return;
      // Idempotência: bloqueia re-entrada para o mesmo id (double-click, teclas rápidas)
      if (inFlightIds.current.has(atual.id)) return;
      // Concorrência local: não permitir novo submit enquanto outro está em andamento
      if (revisar.isPending || transicionando || recarregando) return;

      const minRequerido = status === "confirmada" ? MIN_CONFIRMAR : MIN_FALSO_POSITIVO;
      if (comentarioTrim.length < minRequerido) {
        setComentarioTocado(true);
        return;
      }

      const alvo = atual; // captura estável do id/severidade para closure segura
      const obs = comentarioTrim;
      inFlightIds.current.add(alvo.id);
      try {
        await withRetry(() =>
          revisar.mutateAsync({ id: alvo.id, status, observacoes: obs }),
        );
        setTransicionando(true);
        // Idempotência: só sincroniza Bitrix uma vez por id nesta sessão
        if (!bitrixSincronizados.current.has(alvo.id)) {
          bitrixSincronizados.current.add(alvo.id);
          sincronizar.mutate({ anomaliaId: alvo.id, evento: status });
        }
        setStats((s) => ({
          ...s,
          confirmadas: status === "confirmada" ? s.confirmadas + 1 : s.confirmadas,
          rejeitadas: status === "falso_positivo" ? s.rejeitadas + 1 : s.rejeitadas,
        }));
        toast.success(
          status === "confirmada"
            ? "Confirmada como problema real"
            : "Marcada como falso positivo",
        );
        await avancar();
      } catch (err) {
        if (err instanceof AnomaliaJaRevisadaError) {
          setTransicionando(true);
          try {
            const { data } = await supabase
              .from("anomalias_detectadas")
              .select("*")
              .eq("id", alvo.id)
              .maybeSingle();
            if (data) {
              await notificarConflito(alvo, data as Anomalia);
            } else {
              toast.warning(
                `Anomalia [${alvo.severidade.toUpperCase()} · ${TIPO_LABEL[alvo.tipo_anomalia]}] foi removida`,
                { description: "Avançando para a próxima da fila." },
              );
            }
          } catch {
            toast.warning("Outro revisor já resolveu esta anomalia", {
              description: "Avançando para a próxima da fila.",
            });
          }
          setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
          await avancar();
          return;
        }
        // Falha de persistência definitiva: NÃO avança, NÃO atualiza stats.
        // Estado local intacto para permitir nova tentativa manual.
        const detalhe = (err as { message?: string } | null)?.message ?? "Erro desconhecido";
        toast.error("Falha ao registrar revisão", {
          description: `${detalhe} — o item permanece na fila.`,
          duration: 8000,
          action: {
            label: "Tentar novamente",
            onClick: () => {
              void handleAcao(status);
            },
          },
        });
      } finally {
        inFlightIds.current.delete(alvo.id);
      }
    },
    [
      atual,
      comentarioTrim,
      revisar,
      transicionando,
      recarregando,
      sincronizar,
      avancar,
      notificarConflito,
      withRetry,
    ],
  );

  const handlePular = useCallback(async () => {
    if (!atual || recarregando) return;
    setComentario("");
    setComentarioTocado(false);
    setRecarregando(true);
    try {
      const { data, error } = await supabase
        .from("anomalias_detectadas")
        .select("*")
        .eq("id", atual.id)
        .maybeSingle();

      if (error) {
        setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
        await recarregarPosicao(index + 1);
        return;
      }

      if (!data) {
        toast.warning("Anomalia removida do sistema", {
          description: "Pulando para a próxima da fila.",
        });
        setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
        await recarregarPosicao(index + 1);
        return;
      }

      const fresca = data as Anomalia;
      if (fresca.status !== "nova" && fresca.status !== "investigando") {
        await notificarConflito(atual, fresca);
        setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
        await recarregarPosicao(index + 1);
        return;
      }

      setSnapshot((prev) => {
        const copia = [...prev];
        copia[index] = fresca;
        return copia;
      });
      setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
      await recarregarPosicao(index + 1);
    } finally {
      setRecarregando(false);
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [atual, recarregando, index, recarregarPosicao, notificarConflito]);

  const { handleKey } = useAtalhosTeclado({
    open,
    atual,
    comentarioValido,
    validoConfirmar,
    validoFalsoPositivo,
    comentarioTrim,
    revisarIsPending: revisar.isPending,
    recarregando,
    handleAcao,
    handlePular,
    setComentarioTocado,
    textareaRef,
  });

  const outrasSeveridades = useMemo(() => {
    if (!atual) return [] as Anomalia["severidade"][];
    return SEVERIDADES.filter(
      (s) => s !== atual.severidade && progressoPorSeveridade.total[s] > 0,
    );
  }, [atual, progressoPorSeveridade]);

  return {
    // estado de fila
    atual,
    total,
    index,
    finalizado,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    transicionando,
    // estatísticas
    stats,
    contagemPorSeveridade,
    progressoPorSeveridade,
    outrasSeveridades,
    // conflito
    conflito,
    dismissConflito: useCallback(() => setConflito(null), []),
    // comentário
    comentario,
    setComentario,
    setComentarioTocado,
    comentarioTrim,
    validoConfirmar,
    validoFalsoPositivo,
    mostrarErroComentario,
    erroComentario,
    // ações
    handleAcao,
    handlePular,
    handleKey,
    pularParaSeveridade,
    // refs / flags
    textareaRef,
    isPending: revisar.isPending,
    recarregando,
    dadosFormatados,
  };
}

export type ReviewQueueHandle = ReturnType<typeof useReviewQueue>;
