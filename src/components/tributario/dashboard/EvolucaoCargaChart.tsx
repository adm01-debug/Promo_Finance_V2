import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import type { SerieMensal } from '@/hooks/useDashboardTributario';

interface Props {
  serie: SerieMensal[];
  mediaIdeal?: number;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function EvolucaoCargaChart({ serie, mediaIdeal }: Props) {
  const data = serie.map((s) => ({
    label: `${MESES[s.mes - 1]}/${String(s.ano).slice(2)}`,
    total: Number(s.total_tributos),
    cbs: Number(s.cbs),
    ibs: Number(s.ibs),
  }));

  return (
    <Card className="col-span-full lg:col-span-2 backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Evolução da Carga Tributária</CardTitle>
        <CardDescription>Tributos pagos mês a mês — CBS + IBS + residuais</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(v: number) => formatCurrency(v)}
            />
            <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#totalGrad)" strokeWidth={2} />
            {mediaIdeal && mediaIdeal > 0 && (
              <ReferenceLine y={mediaIdeal} stroke="hsl(var(--success))" strokeDasharray="4 4" label={{ value: 'Ideal', position: 'right', fontSize: 10 }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
