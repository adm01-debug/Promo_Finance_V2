import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, getChartColor } from "./ChartContainer";

/**
 * Example usage of re-themed Recharts with ChartContainer
 *
 * Usage example:
 * ```tsx
 * <ChartContainer>
 *   <ResponsiveContainer width="100%" height={300}>
 *     <BarChart data={data}>
 *       <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
 *       <XAxis dataKey="name" stroke="var(--t1)" />
 *       <YAxis stroke="var(--t1)" />
 *       <Tooltip
 *         contentStyle={{
 *           backgroundColor: "var(--bg-2)",
 *           border: "1px solid var(--line)",
 *           borderRadius: "8px",
 *         }}
 *       />
 *       <Bar dataKey="value" fill={getChartColor(0)} />
 *     </BarChart>
 *   </ResponsiveContainer>
 * </ChartContainer>
 * ```
 */

// Sample data for demonstration
const sampleData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 800 },
  { name: "May", value: 500 },
];

export function RechartsExample() {
  return (
    <ChartContainer>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sampleData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="name" stroke="var(--t1)" />
          <YAxis stroke="var(--t1)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="value" fill={getChartColor(0)} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}