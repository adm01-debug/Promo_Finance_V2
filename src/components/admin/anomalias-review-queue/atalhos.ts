import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { MIN_CONFIRMAR, MIN_FALSO_POSITIVO } from "./types";
import type { Anomalia } from "./types";

interface AtalhosDeps {
  open: boolean;
  atual: Anomalia | undefined;
  comentarioValido: boolean;
  validoConfirmar: boolean;
  validoFalsoPositivo: boolean;
  comentarioTrim: string;
  revisarIsPending: boolean;
  recarregando: boolean;
  handleAcao: (status: "confirmada" | "falso_positivo") => void;
  handlePular: () => void;
  setComentarioTocado: (v: boolean) => void;
  textareaRef: { current: HTMLTextAreaElement | null };
}

/** Ctrl/Cmd+Enter para confirmar + atalhos globais Alt+C/F/S da fila de revisão. */
export function useAtalhosTeclado({
  open,
  atual,
  comentarioValido,
  validoConfirmar,
  validoFalsoPositivo,
  comentarioTrim,
  revisarIsPending,
  recarregando,
  handleAcao,
  handlePular,
  setComentarioTocado,
  textareaRef,
}: AtalhosDeps) {
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
    [comentarioValido, comentarioTrim, handleAcao, setComentarioTocado, textareaRef],
  );

  // Atalhos globais (Alt+C/F/S)
  useEffect(() => {
    if (!open || !atual) return;
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const key = e.key.toLowerCase();
      if (key !== "c" && key !== "f" && key !== "s") return;
      e.preventDefault();
      if (revisarIsPending || recarregando) return;

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
    revisarIsPending,
    recarregando,
    handleAcao,
    handlePular,
  ]);

  return { handleKey };
}
