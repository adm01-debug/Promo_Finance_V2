import { forwardRef } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import type { ChartDatum } from "./types";

interface Props {
  data: ChartDatum[];
  baseline: number;
  onSelectWeek: (weekKey: string) => void;
}

export const TrendBarChart = forwardRef<HTMLDivElement, Props>(
  ({ data, baseline, onSelectWeek }, ref) => (
    <div className="h-56 mb-4" ref={ref}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          onClick={(e: { activePayload?: Array<{ payload?: ChartDatum }> }) => {
            const payload = e?.activePayload?.[0]?.payload;
            if (payload?.weekKey) onSelectWeek(payload.weekKey);
          }}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.4} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="critical" name="Crítico" stackId="a" fill="hsl(var(--destructive))" />
          <Bar dataKey="warning" name="Aviso" stackId="a" fill="hsl(45 93% 47%)" />
          <Bar dataKey="info" name="Info" stackId="a" fill="hsl(var(--muted-foreground))" />
          {baseline > 0 && (
            <ReferenceLine
              y={baseline}
              stroke="hsl(var(--primary))"
              strokeDasharray="4 4"
              label={{
                value: `média ${baseline.toFixed(1)}`,
                position: "insideTopRight",
                fill: "hsl(var(--primary))",
                fontSize: 10,
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  ),
);
TrendBarChart.displayName = "TrendBarChart";
