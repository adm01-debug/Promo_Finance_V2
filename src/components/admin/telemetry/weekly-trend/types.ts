export interface WeeklyRow {
  week_start: string;
  source: string;
  severity: string;
  alert_count: number;
  distinct_keys: number;
  avg_current_ms: number | null;
  max_current_ms: number | null;
  avg_ratio: number | null;
  max_ratio: number | null;
  total_samples: number | null;
  delta_pct_vs_prev_week: number | null;
  refreshed_at: string;
}

export interface ChartDatum {
  week: string;
  weekKey: string;
  critical: number;
  warning: number;
  info: number;
}

export interface SparklineDatum {
  source: string;
  series: { week: string; count: number }[];
  total: number;
  last: number;
  delta: number | null;
}
