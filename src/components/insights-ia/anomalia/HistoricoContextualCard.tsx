import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import type { PontoHistorico } from "@/hooks/useAnomaliaDetalhe";

export function HistoricoContextualCard({ pontos }: { pontos: PontoHistorico[] }) {
  return (
    <Card className="border-l-4 border-l-info">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <TrendingUp className="h-4 w-4 text-info" /> Histórico contextual (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pontos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sem dados históricos disponíveis para este tipo de entidade.
          </p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pontos}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) =>
                    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
