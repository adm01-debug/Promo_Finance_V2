import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  usePendingAnomaliasQueueInfinite,
  useRevisarAnomalia,
  AnomaliaJaRevisadaError,
} from "@/hooks/useAnomaliasDetectadas";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";
import { supabase } from "@/integrations/supabase/client";
import { TIPO_LABEL, tempoDecorrido, truncarDescricao } from "./helpers";
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

  const resolverAutor = useCallback(async (userId: string | null) => {
    if (!userId) return { nome: "outro revisor", email: null as string | null };
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle();
      const nome = (prof?.full_name as string | null)?.trim() || null;
      const email = (prof?.email as string | null)?.trim() || null;
      return { nome: nome || email || "outro revisor", email };
    } catch {
      return { nome: "outro revisor", email: null };
    }
  }, []);

  const notificarConflito = useCallback(
    async (original: Anomalia, fresca: Anomalia) => {
      const { nome, email } = await resolverAutor(fresca.resolvida_por);
      const acao =
        fresca.status === "confirmada"
          ? "confirmou como problema real"
          : "marcou como falso positivo";
      const quando = fresca.resolvida_em ? ` (${tempoDecorrido(fresca.resolvida_em)})` : "";
      const descCurta = truncarDescricao(original.descricao);
      const tipoLabel = TIPO_LABEL[original.tipo_anomalia];
      const titulo = `${nome} já revisou esta anomalia${quando}`;
      const linhaAnomalia = `[${original.severidade.toUpperCase()} · ${tipoLabel}] ${descCurta}`;
      const linhaAcao = `Ação: ${acao}.${email && nome !== email ? ` Contato: ${email}.` : ""} Avançando para a próxima.`;

      setConflito({
        anomaliaId: original.id,
        severidade: original.severidade,
        tipoLabel,
        descricao: descCurta,
        statusLabel: fresca.status === "confirmada" ? "Confirmada" : "Falso positivo",
        acaoLabel: acao,
        autorNome: nome,
        autorEmail: email,
        resolvidaEm: fresca.resolvida_em ?? null,
        motivo: "ja_resolvida",
      });

      toast.warning(titulo, {
        description: `${linhaAnomalia}\n${linhaAcao}`,
        duration: 8000,
        action: {
          label: "Ver no log",
          onClick: () => {
            window.open(
              `/audit-logs?table=anomalias_detectadas&record=${original.id}`,
              "_blank",
              "noopener,noreferrer",
            );
          },
        },
      });
    },
    [resolverAutor],
  );

  const notificarRemovida = useCallback((original: Anomalia) => {
    const tipoLabel = TIPO_LABEL[original.tipo_anomalia];
    setConflito({
      anomaliaId: original.id,
      severidade: original.severidade,
      tipoLabel,
      descricao: truncarDescricao(original.descricao),
      statusLabel: "Removida",
      acaoLabel: "removeu do sistema",
      autorNome: "outro revisor",
      autorEmail: null,
      resolvidaEm: null,
      motivo: "removida",
    });
  }, []);

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

  function mensagemErro(min: number, label: string): string | null {
    if (comentarioTrim.length >= min) return null;
    if (comentarioTrim.length === 0)
      return `Informe um comentário para ${label} (mínimo ${min} caracteres).`;
    const faltam = min - comentarioTrim.length;
    return `Faltam ${faltam} caractere${faltam === 1 ? "" : "s"} para ${label} (mínimo ${min}).`;
  }
  const erroConfirmar = mensagemErro(MIN_CONFIRMAR, "confirmar o problema");
  const erroFalsoPositivo = mensagemErro(MIN_FALSO_POSITIVO, "marcar como falso positivo");
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

  /**
   * Classifica um erro como transitório (rede, timeout ou códigos PostgREST
   * 08xxx/53xxx/57P03 — connection/resource/shutdown). Não retenta erros
   * de validação (ex.: comentário curto) nem conflito de concorrência.
   */
  const isTransient = useCallback((err: unknown): boolean => {
    if (err instanceof AnomaliaJaRevisadaError) return false;
    const msg = (err as { message?: string } | null)?.message?.toLowerCase() ?? "";
    const code = (err as { code?: string } | null)?.code ?? "";
    if (/network|failed to fetch|timeout|timed out|econnreset|fetch failed/.test(msg)) return true;
    if (/^08/.test(code) || /^53/.test(code) || code === "57P03") return true;
    return false;
  }, []);

  const withRetry = useCallback(
    async <T,>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          if (!isTransient(err) || i === attempts - 1) throw err;
          // Backoff exponencial: 300ms, 900ms
          await new Promise((r) => setTimeout(r, 300 * Math.pow(3, i)));
        }
      }
      throw lastErr;
    },
    [isTransient],
  );

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

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!comentarioValido) {
          setComentarioTocado(true);
          const faltam = Math.max(0, MIN_CONFIRMAR - comentarioTrim.length);
          toast.warning("Comentário muito curto para confirmar", {
            description:
              comentarioTrim.length === 0
                ? `Informe um comentário com no mínimo ${MIN_CONFIRMAR} caracteres antes de usar Ctrl/Cmd+Enter.`
                : `Faltam ${faltam} caractere${faltam === 1 ? "" : "s"} para atingir o mínimo de ${MIN_CONFIRMAR}.`,
          });
          textareaRef.current?.focus();
          return;
        }
        void handleAcao("confirmada");
      }
    },
    [comentarioValido, comentarioTrim, handleAcao],
  );

  // Atalhos globais (Alt+C/F/S)
  useEffect(() => {
    if (!open || !atual) return;
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key !== "c" && key !== "f" && key !== "s") return;
      e.preventDefault();
      if (revisar.isPending || recarregando) return;

      if (key === "s") {
        void handlePular();
      } else if (key === "c") {
        if (!validoConfirmar) {
          setComentarioTocado(true);
          const faltam = Math.max(0, MIN_CONFIRMAR - comentarioTrim.length);
          toast.warning("Comentário muito curto para confirmar", {
            description: `Faltam ${faltam} caractere${faltam === 1 ? "" : "s"} para o mínimo de ${MIN_CONFIRMAR}.`,
          });
          textareaRef.current?.focus();
          return;
        }
        void handleAcao("confirmada");
      } else if (key === "f") {
        if (!validoFalsoPositivo) {
          setComentarioTocado(true);
          const faltam = Math.max(0, MIN_FALSO_POSITIVO - comentarioTrim.length);
          toast.warning("Comentário muito curto para falso positivo", {
            description: `Faltam ${faltam} caractere${faltam === 1 ? "" : "s"} para o mínimo de ${MIN_FALSO_POSITIVO}.`,
          });
          textareaRef.current?.focus();
          return;
        }
        void handleAcao("falso_positivo");
      }
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    atual?.id,
    validoConfirmar,
    validoFalsoPositivo,
    comentarioTrim,
    revisar.isPending,
    recarregando,
    handleAcao,
    handlePular,
  ]);

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
