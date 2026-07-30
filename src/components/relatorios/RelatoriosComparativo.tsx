import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ComparativoItem { mes: string; atual: number; anterior: number }

export function RelatoriosComparativo({ data }: { data?: ComparativoItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo de Períodos</CardTitle>
        <CardDescription>Análise comparativa: Período atual vs período anterior</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="atual" name="Período Atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="anterior" name="Período Anterior" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <Separator className="my-6" />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Período Atual</TableHead>
              <TableHead className="text-right">Período Anterior</TableHead>
              <TableHead className="text-right">Variação</TableHead>
              <TableHead className="text-right">% Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data || []).map((item) => {
              const variacao = item.atual - item.anterior;
              const percentual = (variacao / item.anterior) * 100;
              return (
                <TableRow key={item.mes}>
                  <TableCell className="font-medium">{item.mes}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.atual)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.anterior)}</TableCell>
                  <TableCell className={cn("text-right font-medium", variacao >= 0 ? "text-success" : "text-destructive")}>
                    {variacao >= 0 ? '+' : ''}{formatCurrency(variacao)}
                  </TableCell>
                  <TableCell className={cn("text-right font-medium", percentual >= 0 ? "text-success" : "text-destructive")}>
                    {percentual >= 0 ? '+' : ''}{percentual.toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
