import { DeltaBadge, SeverityBadge } from "./badges";
import type { WeeklyRow } from "./types";

export function TrendTable({ rows }: { rows: WeeklyRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground border-b">
          <tr>
            <th className="text-left py-2 font-medium">Semana</th>
            <th className="text-left py-2 font-medium">Origem</th>
            <th className="text-left py-2 font-medium">Severidade</th>
            <th className="text-right py-2 font-medium">Alertas</th>
            <th className="text-right py-2 font-medium">Chaves únicas</th>
            <th className="text-right py-2 font-medium">P95 médio</th>
            <th className="text-right py-2 font-medium">Ratio máx</th>
            <th className="text-right py-2 font-medium">Δ vs anterior</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 60).map((r, idx) => (
            <tr
              key={`${r.week_start}-${r.source}-${r.severity}-${idx}`}
              className="border-b border-muted/40"
            >
              <td className="py-2 tabular-nums">
                {new Date(r.week_start).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </td>
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
  );
}
