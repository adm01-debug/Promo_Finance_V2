import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeltaBadge, SeverityBadge } from "./badges";
import type { WeeklyRow } from "./types";

interface Props {
  selectedWeek: string | null;
  onChange: (week: string | null) => void;
  weekKeys: string[];
  data: WeeklyRow[];
}

export function WeekDetailDialog({ selectedWeek, onChange, weekKeys, data }: Props) {
  const idx = selectedWeek ? weekKeys.indexOf(selectedWeek) : -1;
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < weekKeys.length - 1;
  const rows = selectedWeek ? data.filter((r) => r.week_start === selectedWeek) : [];
  const totals = rows.reduce(
    (acc, r) => {
      if (r.severity === "critical") acc.critical += r.alert_count;
      else if (r.severity === "warning") acc.warning += r.alert_count;
      else acc.info += r.alert_count;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 },
  );
  const total = totals.critical + totals.warning + totals.info;

  return (
    <Dialog open={!!selectedWeek} onOpenChange={(o) => !o && onChange(null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>
              Detalhe da semana{" "}
              {selectedWeek
                ? new Date(selectedWeek).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : ""}
            </span>
            {selectedWeek && (
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  disabled={!hasPrev}
                  onClick={() => hasPrev && onChange(weekKeys[idx - 1])}
                  title="Semana anterior (←)"
                  aria-label="Semana anterior"
                >
                  ←
                </Button>
                <span className="tabular-nums px-1">
                  {idx + 1}/{weekKeys.length}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  disabled={!hasNext}
                  onClick={() => hasNext && onChange(weekKeys[idx + 1])}
                  title="Próxima semana (→)"
                  aria-label="Próxima semana"
                >
                  →
                </Button>
              </span>
            )}
          </DialogTitle>
          {selectedWeek && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1" aria-label="Totais por severidade">
              <Badge variant="destructive" className="text-[10px] tabular-nums">
                Crítico: {totals.critical}
              </Badge>
              <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px] tabular-nums">
                Aviso: {totals.warning}
              </Badge>
              <Badge variant="secondary" className="text-[10px] tabular-nums">
                Info: {totals.info}
              </Badge>
              <Badge variant="outline" className="text-[10px] tabular-nums ml-auto">
                Total: {total}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground border-b sticky top-0 bg-background">
              <tr>
                <th className="text-left py-2 font-medium">Origem</th>
                <th className="text-left py-2 font-medium">Severidade</th>
                <th className="text-right py-2 font-medium">Alertas</th>
                <th className="text-right py-2 font-medium">Chaves</th>
                <th className="text-right py-2 font-medium">P95 médio</th>
                <th className="text-right py-2 font-medium">P95 máx</th>
                <th className="text-right py-2 font-medium">Ratio máx</th>
                <th className="text-right py-2 font-medium">Δ semana ant.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-muted/40">
                  <td className="py-2 text-muted-foreground">
                    {r.source === "pg_stat_statements" ? "pg_stat" : "telemetry"}
                  </td>
                  <td className="py-2"><SeverityBadge severity={r.severity} /></td>
                  <td className="py-2 text-right tabular-nums">{r.alert_count}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                    {r.distinct_keys}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {r.avg_current_ms != null ? `${Math.round(r.avg_current_ms)}ms` : "—"}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {r.max_current_ms != null ? `${Math.round(r.max_current_ms)}ms` : "—"}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {r.max_ratio != null ? `${Number(r.max_ratio).toFixed(2)}x` : "—"}
                  </td>
                  <td className="py-2 text-right">
                    <DeltaBadge delta={r.delta_pct_vs_prev_week} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
