// ============================================
// CHART: Evolução mensal (faturamento ou folha)
// Reutilizado por FaturamentoTab e FolhaTab
// ============================================

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export interface EvolucaoPoint {
  ano: number;
  mes: number;
  valor: number;
}

interface Props {
  titulo: string;
  descricao?: string;
  pontos: EvolucaoPoint[];
  corHsl?: string; // ex: 'var(--primary)'
}

export function EvolucaoChart({ titulo, descricao, pontos, corHsl = 'var(--primary)' }: Props) {
  const data = useMemo(() => {
    // Ordena cronologicamente (antigo → recente) para leitura natural do gráfico
    return [...pontos]
      .sort((a, b) => (a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes))
      .slice(-24) // últimos 24 meses
      .map((p) => ({
        label: `${MESES_CURTOS[p.mes - 1]}/${String(p.ano).slice(2)}`,
        valor: p.valor,
      }));
  }, [pontos]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full" role="img" aria-label={`Gráfico de evolução: ${titulo}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${titulo}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`hsl(${corHsl})`} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={`hsl(${corHsl})`} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
                  return String(v);
                }}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [formatCurrency(v), 'Valor']}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke={`hsl(${corHsl})`}
                strokeWidth={2}
                fill={`url(#grad-${titulo})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
