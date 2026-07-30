/**
 * Etapa Q — Gráfico de linhas sobrepostas do score de conformidade por empresa.
 * Componente de apresentação: todo o cálculo vem de `montarComparativoTemporal`.
 */
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, LineChart as LineChartIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  montarComparativoTemporal,
  exportarComparativoTemporalCsv,
  type SerieEmpresa,
} from '@/lib/tributario/obrigacoes';

export interface ComparativoTemporalChartProps {
  /** Séries por empresa, já carregadas do banco. */
  readonly series: readonly SerieEmpresa[];
  readonly isLoading?: boolean;
  readonly className?: string;
}

const JANELAS = [6, 12, 24] as const;

/** Gráfico comparativo temporal com janela ajustável e exportação CSV. */
export function ComparativoTemporalChart({
  series,
  isLoading = false,
  className,
}: ComparativoTemporalChartProps) {
  const [janela, setJanela] = useState<number>(12);
  const [mostrarMedia, setMostrarMedia] = useState(true);

  const comparativo = useMemo(
    () => montarComparativoTemporal(series, janela),
    [series, janela],
  );

  const baixarCsv = () => {
    const conteudo = exportarComparativoTemporalCsv(comparativo);
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conformidade-temporal-${janela}m.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChartIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            Evolução comparativa do score
          </CardTitle>
          <CardDescription>
            Linhas sobrepostas por empresa. Lacunas indicam competências sem snapshot — a linha é
            interrompida em vez de assumir score zero.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(janela)} onValueChange={(v) => setJanela(Number(v))}>
            <SelectTrigger className="w-[150px]" aria-label="Janela de competências">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JANELAS.map((j) => (
                <SelectItem key={j} value={String(j)}>
                  Últimos {j} meses
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarMedia((v) => !v)}
            aria-pressed={mostrarMedia}
          >
            {mostrarMedia ? 'Ocultar média' : 'Mostrar média'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={baixarCsv}
            disabled={comparativo.vazio}
            aria-label="Exportar série comparativa em CSV"
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : comparativo.vazio ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Ainda não há snapshots de conformidade suficientes para comparar as empresas.
          </p>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparativo.dados as never[]} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="rotulo"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  domain={comparativo.dominioY as unknown as [number, number]}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: 12,
                  }}
                  formatter={(valor: number | null, nome: string) => [
                    valor === null || valor === undefined ? 'sem dados' : `${Number(valor).toFixed(1)} pts`,
                    nome,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {comparativo.series.map((serie) => (
                  <Line
                    key={serie.chave}
                    type="monotone"
                    dataKey={serie.chave}
                    name={serie.nome}
                    stroke={serie.cor}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
                {mostrarMedia && (
                  <Line
                    type="monotone"
                    dataKey="media"
                    name="Média do grupo"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ComparativoTemporalChart;
