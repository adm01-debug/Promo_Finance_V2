import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * ChartContainer - Wrapper component for Recharts that applies a consistent
 * color palette based on CSS variables (--ch1..5) derived from the design system.
 *
 * Palette (CVD-validated, derived from existing theme colors):
 * --ch1: Primary accent (purple)
 * --ch2: Success/positive (green)
 * --ch3: Warning/caution (yellow)
 * --ch4: Error/negative (red)
 * --ch5: Info/neutral (blue)
 */
export function ChartContainer({ children, className }: ChartContainerProps) {
  return (
    <div
      className={cn("chart-container", className)}
      style={
        {
          // Chart color palette (CVD-safe, derived from theme)
          "--ch1": "var(--acc)",
          "--ch2": "var(--ok)",
          "--ch3": "var(--warn)",
          "--ch4": "var(--bad)",
          "--ch5": "var(--info)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

// Helper to get chart colors for Recharts
export const chartColors = [
  "var(--ch1)",
  "var(--ch2)",
  "var(--ch3)",
  "var(--ch4)",
  "var(--ch5)",
];

// Color mapping for categorical data
export function getChartColor(index: number): string {
  return chartColors[index % chartColors.length];
}