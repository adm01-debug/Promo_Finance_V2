import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { useReabrirAnomaliasLote } from "@/hooks/useAnomaliasDetectadas";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";

const motivoSchema = z
  .string()
  .trim()
  .min(10, { message: "O motivo deve ter pelo menos 10 caracteres." })
  .max(1000, { message: "O motivo deve ter no máximo 1000 caracteres." });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ids: string[];
  onConcluido?: () => void;
}

export function ReabrirAnomaliasLoteDialog({
  open,
  onOpenChange,
  ids,
  onConcluido,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const [tocado, setTocado] = useState(false);
  const reabrirLote = useReabrirAnomaliasLote();
  const sincronizar = useSincronizarAnomaliaBitrix();

  useEffect(() => {
    if (!open) {
      setMotivo("");
      setTocado(false);
    }
  }, [open]);

  const motivoTrim = motivo.trim();
  const parsed = motivoSchema.safeParse(motivo);
  const erroMotivo = parsed.success ? null : parsed.error.issues[0]?.message ?? null;
  const mostrarErro = tocado && !!erroMotivo;
  const valido = parsed.success && ids.length > 0;

  async function handleConfirmar() {
    if (!valido) return;
    try {
      const res = await reabrirLote.mutateAsync({ ids, motivo: motivoTrim });
      res.ids_reabertos.forEach((anomaliaId) =>
        sincronizar.mutate({ anomaliaId, evento: "reaberta" }),
      );
      onConcluido?.();
      onOpenChange(false);
    } catch {
      // toast já é exibido pelo hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reabrir {ids.length} anomalia{ids.length === 1 ? "" : "s"} em lote
          </DialogTitle>
          <DialogDescription>
            Todas as anomalias selecionadas voltarão para o status{" "}
            <strong>investigando</strong> com o mesmo motivo registrado abaixo.
            Apenas anomalias em <em>confirmada</em> ou <em>falso positivo</em>{" "}
            serão reabertas — as demais serão ignoradas.
          </DialogDescription>
        </DialogHeader>

        {ids.length > 50 && (
          <Alert variant="error">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Lote grande ({ids.length} itens). Confirme antes de prosseguir.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="motivo-reabertura-lote">
            Motivo único do grupo{" "}
            <span className="text-muted-foreground font-normal">
              (mínimo 10 caracteres — {motivoTrim.length})
            </span>
          </Label>
          <Textarea
            id="motivo-reabertura-lote"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Auditoria identificou nova evidência que invalida a classificação anterior."
            rows={4}
            maxLength={1000}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={reabrirLote.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={!valido || reabrirLote.isPending}
          >
            {reabrirLote.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-1" />
            )}
            Reabrir {ids.length} para investigação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
