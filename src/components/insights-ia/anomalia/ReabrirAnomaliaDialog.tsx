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
import { useReabrirAnomalia } from "@/hooks/useAnomaliasDetectadas";

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
  const reabrir = useReabrirAnomalia();

  const motivoTrim = motivo.trim();
  const valido = motivoTrim.length >= 10;

  async function handleConfirmar() {
    if (!valido) return;
    try {
      await reabrir.mutateAsync({ id: anomaliaId, motivo: motivoTrim });
      setOpen(false);
      setMotivo("");
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
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Cliente confirmou que o lançamento estava errado e há novo dado contábil."
            rows={4}
            maxLength={1000}
            autoFocus
          />
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
