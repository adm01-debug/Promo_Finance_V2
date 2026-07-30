import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useReabrirAnomalia } from "@/hooks/useAnomaliasDetectadas";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";

interface Props {
  anomaliaId: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function ReabrirAnomaliaDialog({
  anomaliaId,
  size = "sm",
  variant = "outline",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [tocado, setTocado] = useState(false);
  const reabrir = useReabrirAnomalia();
  const sincronizar = useSincronizarAnomaliaBitrix();

  const motivoTrim = motivo.trim();
  const valido = motivoTrim.length >= 10;
  const erroMotivo = !valido
    ? motivoTrim.length === 0
      ? "Informe o motivo da reabertura."
      : `Faltam ${10 - motivoTrim.length} caractere${10 - motivoTrim.length === 1 ? "" : "s"} para atingir o mínimo de 10.`
    : null;
  const mostrarErro = tocado && !!erroMotivo;

  async function handleConfirmar() {
    if (!valido) return;
    try {
      await reabrir.mutateAsync({ id: anomaliaId, motivo: motivoTrim });
      sincronizar.mutate({ anomaliaId, evento: "reaberta" });
      setOpen(false);
      setMotivo("");
      setTocado(false);
    } catch {
      // toast já é exibido pelo hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          <RotateCcw className="h-3 w-3 mr-1" /> Reabrir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reabrir anomalia</DialogTitle>
          <DialogDescription>
            A anomalia voltará para o status <strong>investigando</strong>.
            Descreva o novo contexto que justifica a reabertura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="motivo-reabertura">
            Motivo{" "}
            <span className="text-muted-foreground font-normal">
              (mínimo 10 caracteres — {motivoTrim.length})
            </span>
          </Label>
          <Textarea
            id="motivo-reabertura"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              if (!tocado) setTocado(true);
            }}
            onBlur={() => setTocado(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!valido) {
                  setTocado(true);
                  const faltam = Math.max(0, 10 - motivoTrim.length);
                  toast.warning("Motivo muito curto para reabrir", {
                    description:
                      motivoTrim.length === 0
                        ? "Informe um motivo com no mínimo 10 caracteres antes de usar Ctrl/Cmd+Enter."
                        : `Faltam ${faltam} caractere${faltam === 1 ? "" : "s"} para atingir o mínimo de 10.`,
                  });
                  return;
                }
                void handleConfirmar();
              }
            }}
            placeholder="Ex.: Cliente confirmou que o lançamento estava errado e há novo dado contábil."
            rows={4}
            maxLength={1000}
            autoFocus
            aria-invalid={mostrarErro}
            aria-describedby={mostrarErro ? "motivo-reabertura-erro" : undefined}
            className={mostrarErro ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {mostrarErro && (
            <p
              id="motivo-reabertura-erro"
              role="alert"
              className="text-xs text-destructive"
            >
              {erroMotivo}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={reabrir.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={!valido || reabrir.isPending}
          >
            {reabrir.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}{" "}
            Reabrir para investigação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
