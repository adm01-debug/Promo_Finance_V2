import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useHealthScoreOperacional } from "@/hooks/useHealthScoreOperacional";

interface Props {
  empresaId?: string | null;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-success/10";
  if (score >= 60) return "bg-warning/10";
  return "bg-destructive/10";
}

const DIMENSOES: Array<{ key: keyof Awaited<ReturnType<typeof useHealthScoreOperacional>>["data"] & string; label: string; peso: number }> = [
  { key: "score_tributario" as never, label: "Tributário", peso: 25 },
  { key: "score_financeiro" as never, label: "Financeiro", peso: 25 },
  { key: "score_operacional" as never, label: "Operacional", peso: 15 },
  { key: "score_lgpd" as never, label: "LGPD", peso: 10 },
  { key: "score_cadastros" as never, label: "Cadastros", peso: 10 },
  { key: "score_engajamento" as never, label: "Engajamento", peso: 15 },
];

export function HealthScoreCard({ empresaId }: Props) {
  const { data, isLoading, recalcular } = useHealthScoreOperacional(empresaId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Health Score Operacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Nenhum snapshot ainda. Calcule agora para ver a saúde 360° da operação.
          </p>
          <Button onClick={() => recalcular.mutate()} disabled={recalcular.isPending}>
            <RefreshCw className="h-4 w-4 mr-2" /> Calcular agora
          </Button>
        </CardContent>
      </Card>
    );
  }

  const total = Number(data.score_total);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> Health Score Operacional
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => recalcular.mutate()}
          disabled={recalcular.isPending}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${recalcular.isPending ? "animate-spin" : ""}`} />
          Recalcular
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-6 rounded-xl ${scoreBg(total)} flex items-center justify-between`}>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Score 360°
            </p>
            <p className={`text-5xl font-bold ${scoreColor(total)}`}>
              {total.toFixed(0)}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
          </div>
          {data.tendencia_pct !== null && (
            <Badge variant={Number(data.tendencia_pct) >= 0 ? "default" : "destructive"}>
              {Number(data.tendencia_pct) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Number(data.tendencia_pct).toFixed(1)}% (7d)
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DIMENSOES.map((d) => {
            const v = Number((data as unknown as Record<string, number>)[d.key] ?? 0);
            return (
              <div key={d.key} className="p-2 rounded-md border bg-card">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="text-[10px] text-muted-foreground/70">{d.peso}%</span>
                </div>
                <p className={`text-lg font-bold ${scoreColor(v)}`}>{v.toFixed(0)}</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      v >= 80
                        ? "bg-success"
                        : v >= 60
                          ? "bg-warning"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${v}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {data.insights_md && (
          <div className="p-3 rounded-md border bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Insights da IA
            </p>
            <pre className="text-xs whitespace-pre-wrap font-sans text-foreground/90">
              {data.insights_md}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
