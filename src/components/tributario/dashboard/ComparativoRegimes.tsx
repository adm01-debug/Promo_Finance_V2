import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { ResultadoDecisao } from '@/lib/tributario';

interface Props {
  resultado: ResultadoDecisao | null | undefined;
}

export function ComparativoRegimes({ resultado }: Props) {
  const cenarios = resultado?.cenarios ?? [];
  const data = cenarios
    .filter((c) => c.elegivel)
    .map((c) => ({
      regime: c.regime,
      label: c.nome,
      valor: c.totalTributos,
    }));

  const melhor = resultado?.recomendado?.regime;

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Comparativo de Regimes</CardTitle>
        <CardDescription>Carga tributária estimada por regime</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Sem dados para simular</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.regime} fill={d.regime === melhor ? 'hsl(var(--success))' : 'hsl(var(--primary))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
