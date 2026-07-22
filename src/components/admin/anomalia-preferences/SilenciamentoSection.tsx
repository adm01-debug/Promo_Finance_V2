import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { TIPOS } from "./constants";

interface CentroCusto {
  id: string;
  nome: string;
}

interface Props {
  centrosCusto: CentroCusto[];
  ccs: string[];
  tipos: string[];
  onCcsChange: (v: string[]) => void;
  onTiposChange: (v: string[]) => void;
}

export function SilenciamentoSection({
  centrosCusto,
  ccs,
  tipos,
  onCcsChange,
  onTiposChange,
}: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Centros de custo silenciados</Label>
        {ccs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ccs.map((id) => {
              const cc = centrosCusto.find((c) => c.id === id);
              return (
                <Badge key={id} variant="secondary" className="gap-1">
                  {cc?.nome ?? id.slice(0, 8)}
                  <button
                    type="button"
                    onClick={() => onCcsChange(ccs.filter((x) => x !== id))}
                    className="hover:text-destructive"
                    aria-label="Remover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
        <ScrollArea className="h-32 rounded-md border p-2">
          <div className="space-y-1.5">
            {centrosCusto.map((cc) => (
              <label key={cc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={ccs.includes(cc.id)}
                  onChange={(e) =>
                    onCcsChange(
                      e.target.checked ? [...ccs, cc.id] : ccs.filter((x) => x !== cc.id),
                    )
                  }
                />
                {cc.nome}
              </label>
            ))}
            {centrosCusto.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum centro de custo ativo.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-1.5">
        <Label>Tipos de anomalia silenciados</Label>
        <div className="space-y-1.5 rounded-md border p-2">
          {TIPOS.map((t) => (
            <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={tipos.includes(t.value)}
                onChange={(e) =>
                  onTiposChange(
                    e.target.checked
                      ? [...tipos, t.value]
                      : tipos.filter((x) => x !== t.value),
                  )
                }
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
