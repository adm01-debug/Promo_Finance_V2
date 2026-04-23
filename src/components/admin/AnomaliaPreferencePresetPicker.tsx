import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check } from "lucide-react";
import {
  ANOMALIA_PREFERENCE_PRESETS,
  presetMatches,
  type AnomaliaPreferencePreset,
} from "./anomaliaPreferencePresets";
import type {
  Severidade,
  ToastAcoes,
  DrawerAcoes,
} from "@/hooks/useAnomaliaPreferences";

interface Props {
  current: {
    severidades: Severidade[];
    duracao: number;
    toastAcoes: ToastAcoes;
    drawerAcoes: DrawerAcoes;
  };
  onApply: (preset: AnomaliaPreferencePreset) => void;
}

/**
 * Lista de presets aplicáveis em 1 clique. Marca visualmente o preset
 * que corresponde ao estado atual (sem precisar salvar).
 */
export function AnomaliaPreferencePresetPicker({ current, onApply }: Props) {
  const ativoId = useMemo(
    () =>
      ANOMALIA_PREFERENCE_PRESETS.find((p) => presetMatches(p, current))?.id ??
      null,
    [current],
  );

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Presets rápidos</span>
        <span className="text-[11px] text-muted-foreground">
          Aplica severidades, duração e ações em 1 clique. Não toca em soneca,
          centros de custo ou tipos.
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {ANOMALIA_PREFERENCE_PRESETS.map((preset) => {
          const ativo = ativoId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApply(preset)}
              className={`text-left rounded-md border p-2.5 transition-colors hover:border-primary/60 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-ring ${
                ativo ? "border-primary bg-primary/5" : ""
              }`}
              aria-pressed={ativo}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold">{preset.nome}</span>
                {ativo && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] gap-1 px-1.5"
                  >
                    <Check className="h-3 w-3" /> ativo
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-3 mb-1.5">
                {preset.descricao}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">
                  {preset.severidades.length} sev.
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {preset.duracao}s
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {Object.values(preset.toastAcoes).filter(Boolean).length}{" "}
                  ações toast
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
