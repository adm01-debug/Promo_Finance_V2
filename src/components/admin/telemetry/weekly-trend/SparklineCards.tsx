import { ResponsiveContainer, LineChart as ReLineChart, Line } from "recharts";
import type { SparklineDatum } from "./types";

export function SparklineCards({ items }: { items: SparklineDatum[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
      {items.map((s) => {
        const label = s.source === "pg_stat_statements" ? "pg_stat" : "telemetry";
        const deltaColor =
          s.delta == null
            ? "text-muted-foreground"
            : s.delta > 0
              ? "text-destructive"
              : s.delta < 0
                ? "text-green-600"
                : "text-muted-foreground";
        return (
          <div
            key={s.source}
            className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </span>
                <span className={`text-[10px] tabular-nums ${deltaColor}`}>
                  {s.delta == null ? "—" : `${s.delta > 0 ? "+" : ""}${s.delta.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold tabular-nums">{s.last}</span>
                <span className="text-[10px] text-muted-foreground">últ. semana</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  total {s.total}
                </span>
              </div>
            </div>
            <div className="h-10 w-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={s.series} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
