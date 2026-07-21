import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="text-muted-foreground text-[10px]">—</span>;
  if (delta > 0) {
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] gap-1">
        <TrendingUp className="h-3 w-3" /> +{delta.toFixed(1)}%
      </Badge>
    );
  }
  if (delta < 0) {
    return (
      <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-[10px] gap-1">
        <TrendingDown className="h-3 w-3" /> {delta.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] gap-1">
      <Minus className="h-3 w-3" /> 0%
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "critical")
    return <Badge variant="destructive" className="text-[10px]">Crítico</Badge>;
  if (severity === "warning")
    return (
      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px]">
        Aviso
      </Badge>
    );
  return <Badge variant="secondary" className="text-[10px]">Info</Badge>;
}
