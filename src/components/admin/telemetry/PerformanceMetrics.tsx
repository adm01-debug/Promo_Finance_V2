import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gauge, Zap, Layout, MousePointer2, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function PerformanceMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["frontend-performance-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('frontend_performance_logs')
        .select('metric_name, value')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const summary: Record<string, { total: number; count: number }> = {};
      data.forEach((m) => {
        if (!summary[m.metric_name]) summary[m.metric_name] = { total: 0, count: 0 };
        summary[m.metric_name].total += m.value;
        summary[m.metric_name].count += 1;
      });

      return Object.entries(summary).map(([name, s]) => ({
        metric_name: name,
        avg_value: s.total / s.count,
        count: s.count,
      }));
    },
    refetchInterval: 60000,
  });

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'LCP': return <Layout className="h-4 w-4" />;
      case 'FID': return <MousePointer2 className="h-4 w-4" />;
      case 'CLS': return <Zap className="h-4 w-4" />;
      case 'TTFB': return <Timer className="h-4 w-4" />;
      default: return <Gauge className="h-4 w-4" />;
    }
  };

  const getMetricRating = (name: string, value: number) => {
    if (name === 'LCP') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    if (name === 'FID') return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    if (name === 'CLS') return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    if (name === 'FCP') return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    if (name === 'TTFB') return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    return 'neutral';
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') return value.toFixed(3);
    if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
    return `${Math.round(value)}ms`;
  };

  if (isLoading) return <Skeleton className="h-[200px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" /> Core Web Vitals (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics?.map((m) => {
            const rating = getMetricRating(m.metric_name, m.avg_value);
            return (
              <div key={m.metric_name} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  {getMetricIcon(m.metric_name)}
                  {m.metric_name}
                </div>
                <div className="text-xl font-bold">{formatValue(m.metric_name, m.avg_value)}</div>
                <Badge 
                  variant={rating === 'good' ? 'outline' : rating === 'poor' ? 'destructive' : 'secondary'}
                  className="w-fit text-[10px] px-1 h-4"
                >
                  {rating === 'good' ? 'Bom' : rating === 'poor' ? 'Pobre' : 'Melhorar'}
                </Badge>
              </div>
            );
          })}
          {(!metrics || metrics.length === 0) && (
            <p className="text-xs text-muted-foreground col-span-full py-4 text-center">
              Aguardando coleta de dados de performance...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Activity } from "lucide-react";
