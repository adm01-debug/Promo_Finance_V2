import type { RefObject } from "react";
import { CheckCircle2, Loader2, SkipForward, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MIN_CONFIRMAR, MIN_FALSO_POSITIVO } from "./types";

interface Props {
  comentario: string;
  onComentarioChange: (v: string) => void;
  onComentarioTocado: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  comentarioLength: number;
  mostrarErroComentario: boolean;
  erroComentario: string | null;
  validoConfirmar: boolean;
  validoFalsoPositivo: boolean;
  isPending: boolean;
  recarregando: boolean;
  onConfirmar: () => void;
  onFalsoPositivo: () => void;
  onPular: () => void;
}

export function ReviewActionsBar({
  comentario,
  onComentarioChange,
  onComentarioTocado,
  onKeyDown,
  textareaRef,
  comentarioLength,
  mostrarErroComentario,
  erroComentario,
  validoConfirmar,
  validoFalsoPositivo,
  isPending,
  recarregando,
  onConfirmar,
  onFalsoPositivo,
  onPular,
}: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="comentario-revisao">
          Comentário de revisão{" "}
          <span className="text-muted-foreground font-normal">
            (confirmar ≥ {MIN_CONFIRMAR} · falso positivo ≥ {MIN_FALSO_POSITIVO} —{" "}
            {comentarioLength})
          </span>
        </Label>
        <Textarea
          id="comentario-revisao"
          ref={textareaRef}
          value={comentario}
          onChange={(e) => {
            onComentarioChange(e.target.value);
            onComentarioTocado();
          }}
          onBlur={onComentarioTocado}
          onKeyDown={onKeyDown}
          placeholder="Ex.: Confirmado, fornecedor X duplicou NF 1234 no dia 03/04."
          rows={3}
          maxLength={1000}
          aria-invalid={mostrarErroComentario}
          aria-describedby={mostrarErroComentario ? "comentario-revisao-erro" : undefined}
          className={
            mostrarErroComentario ? "border-destructive focus-visible:ring-destructive" : ""
          }
        />
        {mostrarErroComentario && erroComentario && (
          <p id="comentario-revisao-erro" role="alert" className="text-xs text-destructive">
            {erroComentario}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="ghost" onClick={onPular} disabled={isPending || recarregando}>
          {recarregando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SkipForward className="h-4 w-4" />
          )}{" "}
          Pular
        </Button>
        <Button
          variant="outline"
          onClick={onFalsoPositivo}
          disabled={!validoFalsoPositivo || isPending || recarregando}
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
          onClick={onConfirmar}
          disabled={!validoConfirmar || isPending || recarregando}
          title={
            !validoConfirmar
              ? `Confirmar exige mínimo ${MIN_CONFIRMAR} caracteres no comentário`
              : undefined
          }
        >
          {isPending ? (
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
    </>
  );
}
