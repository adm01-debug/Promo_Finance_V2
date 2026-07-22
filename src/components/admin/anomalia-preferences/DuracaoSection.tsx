import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Clock } from "lucide-react";
import {
  TOAST_DURACAO_MIN,
  TOAST_DURACAO_MAX,
  TOAST_DURACAO_DEFAULT,
} from "@/hooks/useAnomaliaPreferences";

interface Props {
  duracao: number;
  onChange: (v: number) => void;
}

export function DuracaoSection({ duracao, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Duração do toast
        </Label>
        <Badge variant="secondary" className="font-mono">
          {duracao}s
        </Badge>
      </div>
      <Slider
        value={[duracao]}
        min={TOAST_DURACAO_MIN}
        max={TOAST_DURACAO_MAX}
        step={1}
        onValueChange={(v) => onChange(v[0] ?? TOAST_DURACAO_DEFAULT)}
      />
      <p className="text-xs text-muted-foreground">
        Entre {TOAST_DURACAO_MIN}s e {TOAST_DURACAO_MAX}s. Padrão: {TOAST_DURACAO_DEFAULT}s.
      </p>
    </div>
  );
}
