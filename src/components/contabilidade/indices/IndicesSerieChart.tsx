import { useMemo } from 'react';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Indicador } from '@/lib/contabil/indices';
import type { PontoSerie } from '@/hooks/useIndicesContabeis';

interface Props {
  pontos: PontoSerie[];
  disponiveis: Indicador[];
  selecionados: string[];
  onToggle: (chave: string) => void;
  isLoading?: boolean;
}

const CORES = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export function IndicesSerieChart({ pontos, disponiveis, selecionados, onToggle, isLoading }: Props) {
  const dados = useMemo(
    () =>
      pontos.map((p) => {
        const linha: Record<string, string | number | null> = { label: p.label };
        for (const chave of selecionados) {
          linha[chave] = p.indices.find((i) => i.chave === chave)?.valor ?? null;
        }
        return linha;
      }),
    [pontos, selecionados],
  );

  const rotulo = (chave: string) => disponiveis.find((i) => i.chave === chave)?.rotulo ?? chave;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {disponiveis.map((i) => {
          const ativo = selecionados.includes(i.chave);
          return (
            <button key={i.chave} type="button" onClick={() => onToggle(i.chave)} aria-pressed={ativo}>
              <Badge
                variant={ativo ? 'default' : 'outline'}
                className={cn('cursor-pointer rounded-full text-[11px]', !ativo && 'text-muted-foreground')}
              >
                {i.rotulo}
              </Badge>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <Skeleton className="h-[280px] w-full rounded-2xl" />
      ) : dados.length === 0 || selecionados.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Selecione ao menos um indicador e um período com movimento para ver a série.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                color: 'hsl(var(--foreground))',
              }}
            />
            <Legend formatter={(v) => rotulo(String(v))} />
            {selecionados.slice(0, 3).map((chave, idx) => (
              <Line
                key={chave}
                type="monotone"
                dataKey={chave}
                name={chave}
                stroke={CORES[idx % CORES.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
