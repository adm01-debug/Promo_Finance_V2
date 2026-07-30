import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";
import type { Severidade } from "@/hooks/useAnomaliaPreferences";
import { SEVERIDADES } from "./constants";

interface Props {
  severidadesAtivas: Severidade[];
  onToggle: (sev: Severidade, on: boolean) => void;
}

export function SeveridadesSection({ severidadesAtivas, onToggle }: Props) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        Severidades que disparam toast
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {SEVERIDADES.map((sev) => {
          const checked = severidadesAtivas.includes(sev.value);
          return (
            <label
              key={sev.value}
              className={`flex items-start gap-2 rounded-md border p-2.5 cursor-pointer transition-colors ${
                checked ? "bg-primary/5 border-primary/40" : ""
              }`}
            >
              <Checkbox
                checked={checked}
                onChange={(e) => onToggle(sev.value, e.target.checked)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{sev.label}</div>
                <div className="text-xs text-muted-foreground">{sev.hint}</div>
              </div>
            </label>
          );
        })}
      </div>
      {severidadesAtivas.length === 0 && (
        <p className="text-xs text-destructive">Selecione ao menos 1 severidade.</p>
      )}
    </div>
  );
}
