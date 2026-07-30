import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Activity } from 'lucide-react';
import { useMetricasAprendizadoIA } from '@/hooks/useMetricasAprendizadoIA';
import { useMemo } from 'react';

const CONFIANCA_COLORS = {
  alta: 'hsl(var(--success))',
  media: 'hsl(var(--warning))',
  baixa: 'hsl(var(--destructive))',
};

const TIPO_LABEL: Record<string, string> = {
  movimentacao_outlier: 'Mov. atípica',
  pagamento_duplicado: 'Pag. duplicado',
  conta_pagar_alta: 'CP alta',
  conciliacao_atrasada: 'Concil. atrasada',
  mudanca_regime_brusca: 'Var. regime',
};

export function AprendizadoMetricasTab() {
  const { data, isLoading } = useMetricasAprendizadoIA();

  const heatmapAgg = useMemo(() => {
    if (!data?.heatmap) return [];
    const map = new Map<string, number>();
    for (const h of data.heatmap) {
      map.set(h.tipo, (map.get(h.tipo) ?? 0) + h.total);
    }
    return Array.from(map.entries())
      .map(([tipo, total]) => ({ tipo: TIPO_LABEL[tipo] ?? tipo, total }))
      .sort((a, b) => b.total - a.total);
  }, [data?.heatmap]);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Taxa de Acerto da IA</CardTitle>
              <CardDescription>Evolução semanal (últimos 90 dias)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.serieAcerto.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Sem dados suficientes
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.serieAcerto}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => `${v}%`}
                />
                <Line
                  type="monotone"
                  dataKey="taxa"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Distribuição por Confiança</CardTitle>
              <CardDescription>Histórico de matches IA</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.distribuicaoConfianca.every((d) => d.total === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Sem dados ainda
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.distribuicaoConfianca}
                  dataKey="total"
                  nameKey="confianca"
                  innerRadius={50}
                  outerRadius={85}
                  label={(e) => `${e.confianca}: ${e.total}`}
                >
                  {data.distribuicaoConfianca.map((entry) => (
                    <Cell key={entry.confianca} fill={CONFIANCA_COLORS[entry.confianca]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Top Regras Aprendidas</CardTitle>
              <CardDescription>Mais aplicadas (top 10)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.regras.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhuma regra aprendida ainda
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.regras} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="vezes_aplicada" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Anomalias por Tipo</CardTitle>
              <CardDescription>Total nos últimos 90 dias</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {heatmapAgg.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Sem anomalias detectadas
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={heatmapAgg}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="tipo" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="total" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
