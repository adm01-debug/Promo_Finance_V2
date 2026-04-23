import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  ListChecks,
  ExternalLink,
  Loader2,
  Sparkles,
  ScrollText,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  usePendingAnomaliasQueue,
  useRevisarAnomalia,
  AnomaliaJaRevisadaError,
  type Anomalia,
} from "@/hooks/useAnomaliasDetectadas";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIPO_LABEL: Record<Anomalia["tipo_anomalia"], string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

function severidadeBadge(s: Anomalia["severidade"]) {
  if (s === "critica" || s === "alta") return "destructive";
  if (s === "media") return "secondary";
  return "outline";
}

function tempoDecorrido(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(ms / 86_400_000);
  if (dias >= 1) return `há ${dias} dia${dias > 1 ? "s" : ""}`;
  const horas = Math.floor(ms / 3_600_000);
  if (horas >= 1) return `há ${horas}h`;
  const min = Math.floor(ms / 60_000);
  return `há ${min}min`;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /**
   * Filtra a fila por severidade antes do snapshot. "todas" inclui todas.
   * Default: "todas".
   */
  severidadeFilter?: Anomalia["severidade"] | "todas";
}

export function AnomaliasReviewQueue({
  open,
  onOpenChange,
  severidadeFilter = "todas",
}: Props) {
  const { data: fila = [], isLoading } = usePendingAnomaliasQueue();
  const revisar = useRevisarAnomalia();
  const sincronizar = useSincronizarAnomaliaBitrix();

  const [snapshot, setSnapshot] = useState<Anomalia[]>([]);
  const [index, setIndex] = useState(0);
  const [comentario, setComentario] = useState("");
  const [comentarioTocado, setComentarioTocado] = useState(false);
  const [stats, setStats] = useState({ confirmadas: 0, rejeitadas: 0, puladas: 0 });
  const [recarregando, setRecarregando] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  type ConflitoBanner = {
    anomaliaId: string;
    severidade: Anomalia["severidade"];
    tipoLabel: string;
    descricao: string;
    statusLabel: string;
    acaoLabel: string;
    autorNome: string;
    autorEmail: string | null;
    resolvidaEm: string | null;
    motivo: "ja_resolvida" | "removida";
  };
  const [conflito, setConflito] = useState<ConflitoBanner | null>(null);

  /**
   * Resolve um rótulo legível para o autor (full_name → email mascarado → fallback).
   */
  async function resolverAutor(userId: string | null) {
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
  }

  /**
   * Mostra um toast detalhado quando outro revisor já resolveu a anomalia.
   * Inclui: identificação da anomalia (tipo + severidade + descrição truncada),
   * quem resolveu (nome/email), a ação tomada, quando, e atalho para a auditoria.
   */
  async function notificarConflito(original: Anomalia, fresca: Anomalia) {
    const { nome, email } = await resolverAutor(fresca.resolvida_por);
    const acao =
      fresca.status === "confirmada"
        ? "confirmou como problema real"
        : "marcou como falso positivo";
    const quando = fresca.resolvida_em
      ? ` (${tempoDecorrido(fresca.resolvida_em)})`
      : "";
    const descCurta =
      original.descricao.length > 80
        ? `${original.descricao.slice(0, 80)}…`
        : original.descricao;
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
  }

  function notificarRemovida(original: Anomalia) {
    const tipoLabel = TIPO_LABEL[original.tipo_anomalia];
    const descCurta =
      original.descricao.length > 80
        ? `${original.descricao.slice(0, 80)}…`
        : original.descricao;
    setConflito({
      anomaliaId: original.id,
      severidade: original.severidade,
      tipoLabel,
      descricao: descCurta,
      statusLabel: "Removida",
      acaoLabel: "removeu do sistema",
      autorNome: "outro revisor",
      autorEmail: null,
      resolvidaEm: null,
      motivo: "removida",
    });
  }

  /**
   * Recarrega do backend a anomalia em uma posição da fila para garantir
   * que ela ainda está pendente (evita revisar dados desatualizados por
   * concorrência). Se já foi resolvida, avança automaticamente para a próxima.
   */
  async function recarregarPosicao(novoIndex: number) {
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

        if (error) {
          // erro de leitura — segue com o snapshot existente
          break;
        }

        if (!data) {
          // anomalia removida — pula
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
          // já foi resolvida por outro revisor — avisa de forma detalhada e pula
          await notificarConflito(candidato, fresca);
          setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
          cursor += 1;
          continue;
        }

        // ainda pendente — atualiza o snapshot com a versão fresca
        setSnapshot((prev) => {
          const copia = [...prev];
          copia[cursor] = fresca;
          return copia;
        });
        setIndex(cursor);
        return;
      }
      // esgotou a fila
      setIndex(snapshot.length);
    } finally {
      setRecarregando(false);
    }
  }

  // Snapshot da fila ao abrir (evita reordenação durante revisão)
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
    }
  }, [open, isLoading, severidadeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const atual = snapshot[index];
  const total = snapshot.length;
  const finalizado = total > 0 && index >= total;
  const comentarioTrim = comentario.trim();
  const MIN_CONFIRMAR = 10;
  const MIN_FALSO_POSITIVO = 15;
  const validoConfirmar = comentarioTrim.length >= MIN_CONFIRMAR;
  const validoFalsoPositivo = comentarioTrim.length >= MIN_FALSO_POSITIVO;
  // Mantido para compatibilidade com handlers genéricos (pular, atalho de teclado, etc.)
  const comentarioValido = validoConfirmar;
  function mensagemErro(min: number, label: string): string | null {
    if (comentarioTrim.length >= min) return null;
    if (comentarioTrim.length === 0) return `Informe um comentário para ${label} (mínimo ${min} caracteres).`;
    const faltam = min - comentarioTrim.length;
    return `Faltam ${faltam} caractere${faltam === 1 ? "" : "s"} para ${label} (mínimo ${min}).`;
  }
  const erroConfirmar = mensagemErro(MIN_CONFIRMAR, "confirmar o problema");
  const erroFalsoPositivo = mensagemErro(MIN_FALSO_POSITIVO, "marcar como falso positivo");
  // Erro principal mostrado abaixo do textarea: prioriza o requisito mais brando ainda não atendido.
  const erroComentario = erroConfirmar ?? erroFalsoPositivo;
  const mostrarErroComentario = comentarioTocado && !!erroComentario;

  // Foco no textarea quando troca de anomalia
  useEffect(() => {
    if (atual && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [atual?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dadosFormatados = useMemo(() => {
    if (!atual) return "";
    try {
      return JSON.stringify(atual.dados ?? {}, null, 2);
    } catch {
      return "—";
    }
  }, [atual]);

  // Contagem de pendentes por severidade a partir da posição atual (inclusive),
  // para refletir o que ainda há à frente na revisão.
  const contagemPorSeveridade = useMemo(() => {
    const base: Record<Anomalia["severidade"], number> = {
      critica: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    };
    for (let i = index; i < snapshot.length; i++) {
      const sev = snapshot[i].severidade;
      if (sev in base) base[sev] += 1;
    }
    return base;
  }, [snapshot, index]);

  // Total por severidade no snapshot (não muda durante a sessão de revisão)
  // e quantas já foram revisadas (passaram do index atual).
  const progressoPorSeveridade = useMemo(() => {
    const total: Record<Anomalia["severidade"], number> = {
      critica: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    };
    const revisado: Record<Anomalia["severidade"], number> = {
      critica: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    };
    snapshot.forEach((a, i) => {
      if (a.severidade in total) {
        total[a.severidade] += 1;
        if (i < index) revisado[a.severidade] += 1;
      }
    });
    return { total, revisado };
  }, [snapshot, index]);

  function pularParaSeveridade(sev: Anomalia["severidade"]) {
    // Procura a partir da posição atual; se não achar, busca do início da fila.
    let alvo = snapshot.findIndex((a, i) => i >= index && a.severidade === sev);
    if (alvo === -1) {
      alvo = snapshot.findIndex((a) => a.severidade === sev);
    }
    if (alvo === -1) {
      toast.info(`Sem anomalias ${sev} na fila atual`);
      return;
    }
    if (alvo === index) return;
    setComentario("");
    setComentarioTocado(false);
    void recarregarPosicao(alvo);
  }

  function avancar() {
    setComentario("");
    setComentarioTocado(false);
    void recarregarPosicao(index + 1);
  }

  async function handleAcao(status: "confirmada" | "falso_positivo") {
    if (!atual) return;
    const minRequerido = status === "confirmada" ? MIN_CONFIRMAR : MIN_FALSO_POSITIVO;
    if (comentarioTrim.length < minRequerido) {
      setComentarioTocado(true);
      return;
    }
    try {
      await revisar.mutateAsync({
        id: atual.id,
        status,
        observacoes: comentarioTrim,
      });
      sincronizar.mutate({ anomaliaId: atual.id, evento: status });
      setStats((s) => ({
        ...s,
        confirmadas: status === "confirmada" ? s.confirmadas + 1 : s.confirmadas,
        rejeitadas: status === "falso_positivo" ? s.rejeitadas + 1 : s.rejeitadas,
      }));
      toast.success(
        status === "confirmada" ? "Confirmada como problema real" : "Marcada como falso positivo"
      );
      avancar();
    } catch (err) {
      if (err instanceof AnomaliaJaRevisadaError) {
        // Busca a versão fresca para mostrar quem resolveu, quando e qual ação
        try {
          const { data } = await supabase
            .from("anomalias_detectadas")
            .select("*")
            .eq("id", atual.id)
            .maybeSingle();
          if (data) {
            await notificarConflito(atual, data as Anomalia);
          } else {
            toast.warning(
              `Anomalia [${atual.severidade.toUpperCase()} · ${TIPO_LABEL[atual.tipo_anomalia]}] foi removida`,
              { description: "Avançando para a próxima da fila." },
            );
          }
        } catch {
          toast.warning("Outro revisor já resolveu esta anomalia", {
            description: "Avançando para a próxima da fila.",
          });
        }
        setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
        avancar();
        return;
      }
      // demais erros: mutation já notifica via toast.error
    }
  }

  async function handlePular() {
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
        // sem conseguir validar — pula localmente
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
        // já resolvida por outro revisor — avisa e avança automaticamente
        await notificarConflito(atual, fresca);
        setStats((s) => ({ ...s, puladas: s.puladas + 1 }));
        await recarregarPosicao(index + 1);
        return;
      }

      // ainda pendente — atualiza snapshot e contabiliza pulo manual
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
  }

  function handleKey(e: React.KeyboardEvent) {
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
      handleAcao("confirmada");
    }
  }

  // Atalhos globais enquanto o modal está aberto.
  // Uso Alt+letra para não interferir com digitação no textarea (C, F, S são letras comuns).
  // Após qualquer ação, devolvemos o foco ao textarea para o próximo item.
  useEffect(() => {
    if (!open || !atual) return;
    function onKey(e: KeyboardEvent) {
      // Ignora se algum modificador "destrutivo" estiver junto (Ctrl/Meta) — preserva atalhos do SO
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key !== "c" && key !== "f" && key !== "s") return;
      e.preventDefault();
      if (revisar.isPending || recarregando) return;

      if (key === "s") {
        handlePular();
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
      // Mantém o foco no textarea para o próximo item da fila
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, atual?.id, validoConfirmar, validoFalsoPositivo, comentarioTrim, revisar.isPending, recarregando]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Revisão em fila
          </DialogTitle>
          <DialogDescription>
            Revise cada anomalia pendente. Comentário obrigatório (mínimo 10 caracteres) antes de
            confirmar ou rejeitar.
          </DialogDescription>
          <div className="pt-1">
            <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs">
              <Link
                to="/audit-logs?table=anomalias_detectadas&action=APPROVE"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ScrollText className="h-3 w-3 mr-1" />
                Ver log de auditoria das revisões (confirmações e rejeições)
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Sparkles className="h-10 w-10 mx-auto text-success" />
            <p className="font-medium">Nenhuma anomalia pendente</p>
            <p className="text-sm text-muted-foreground">Tudo em dia. ✓</p>
          </div>
        ) : finalizado ? (
          <div className="py-8 text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto text-success" />
            <div>
              <p className="text-lg font-semibold">Fila concluída</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.confirmadas} confirmadas · {stats.rejeitadas} rejeitadas ·{" "}
                {stats.puladas} puladas
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        ) : atual ? (
          <div className="space-y-4">
            <div className="space-y-1.5" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Revisando <span className="capitalize">{atual.severidade}</span>{" "}
                  <span className="tabular-nums">
                    {progressoPorSeveridade.revisado[atual.severidade] + 1}/
                    {progressoPorSeveridade.total[atual.severidade]}
                  </span>
                  {(["critica", "alta", "media", "baixa"] as const)
                    .filter((s) => s !== atual.severidade && progressoPorSeveridade.total[s] > 0)
                    .map((s) => (
                      <span key={s} className="ml-1">
                        · <span className="capitalize">{s}</span>{" "}
                        <span className="tabular-nums">
                          {progressoPorSeveridade.revisado[s]}/{progressoPorSeveridade.total[s]}
                        </span>
                      </span>
                    ))}
                </span>
                <span>
                  ✓ {stats.confirmadas} · ✗ {stats.rejeitadas} · ⤳ {stats.puladas}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Posição geral: {index + 1} de {total}
                </span>
              </div>
              <Progress value={((index + 1) / total) * 100} className="h-1.5" />
            </div>

            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Pular para severidade"
            >
              <span className="text-xs text-muted-foreground mr-1">Pular para:</span>
              {(["critica", "alta", "media", "baixa"] as const).map((sev) => {
                const count = contagemPorSeveridade[sev];
                const ativo = atual?.severidade === sev;
                const desabilitado = count === 0 || recarregando;
                return (
                  <Button
                    key={sev}
                    type="button"
                    size="sm"
                    variant={ativo ? severidadeBadge(sev) : "outline"}
                    className="h-7 px-2 text-xs capitalize gap-1"
                    onClick={() => pularParaSeveridade(sev)}
                    disabled={desabilitado}
                    title={
                      count === 0
                        ? `Sem anomalias ${sev} restantes`
                        : `Ir para a próxima ${sev} (${count} restante${count === 1 ? "" : "s"})`
                    }
                    aria-pressed={ativo}
                  >
                    {sev}
                    <Badge
                      variant="secondary"
                      className="h-4 px-1 text-[10px] tabular-nums"
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={severidadeBadge(atual.severidade)}>{atual.severidade}</Badge>
                <Badge variant="outline" className="text-xs">
                  {TIPO_LABEL[atual.tipo_anomalia]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {tempoDecorrido(atual.detectada_em)}
                </span>
              </div>
              <p className="text-sm">{atual.descricao}</p>
              {atual.observacoes && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                  {atual.observacoes}
                </p>
              )}

              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Ver dados brutos
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-[11px] overflow-x-auto max-h-48">
                  {dadosFormatados}
                </pre>
              </details>

              <Button asChild variant="link" size="sm" className="px-0 h-auto">
                <Link to={`/admin/insights-ia/anomalia/${atual.id}`} target="_blank">
                  Abrir drill-down completo <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comentario-revisao">
                Comentário de revisão{" "}
                <span className="text-muted-foreground font-normal">
                  (confirmar ≥ {MIN_CONFIRMAR} · falso positivo ≥ {MIN_FALSO_POSITIVO} —{" "}
                  {comentarioTrim.length})
                </span>
              </Label>
              <Textarea
                id="comentario-revisao"
                ref={textareaRef}
                value={comentario}
                onChange={(e) => {
                  setComentario(e.target.value);
                  if (!comentarioTocado) setComentarioTocado(true);
                }}
                onBlur={() => setComentarioTocado(true)}
                onKeyDown={handleKey}
                placeholder="Ex.: Confirmado, fornecedor X duplicou NF 1234 no dia 03/04."
                rows={3}
                maxLength={1000}
                aria-invalid={mostrarErroComentario}
                aria-describedby={mostrarErroComentario ? "comentario-revisao-erro" : undefined}
                className={mostrarErroComentario ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {mostrarErroComentario && (
                <p
                  id="comentario-revisao-erro"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {erroComentario}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="ghost"
                onClick={handlePular}
                disabled={revisar.isPending || recarregando}
              >
                {recarregando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SkipForward className="h-4 w-4" />
                )}{" "}
                Pular
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAcao("falso_positivo")}
                disabled={!validoFalsoPositivo || revisar.isPending || recarregando}
                title={
                  !validoFalsoPositivo
                    ? `Falso positivo exige mínimo ${MIN_FALSO_POSITIVO} caracteres no comentário`
                    : undefined
                }
              >
                <XCircle className="h-4 w-4" /> Falso positivo
              </Button>
              <Button
                variant="success"
                onClick={() => handleAcao("confirmada")}
                disabled={!validoConfirmar || revisar.isPending || recarregando}
                title={
                  !validoConfirmar
                    ? `Confirmar exige mínimo ${MIN_CONFIRMAR} caracteres no comentário`
                    : undefined
                }
              >
                {revisar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}{" "}
                Confirmar problema
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-right">
              Atalhos:{" "}
              <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">Alt+C</kbd>{" "}
              confirmar ·{" "}
              <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">Alt+F</kbd>{" "}
              falso positivo ·{" "}
              <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">Alt+S</kbd>{" "}
              pular ·{" "}
              <kbd className="px-1 py-0.5 rounded border bg-muted font-mono text-[10px]">
                Ctrl/Cmd+Enter
              </kbd>{" "}
              confirmar
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
