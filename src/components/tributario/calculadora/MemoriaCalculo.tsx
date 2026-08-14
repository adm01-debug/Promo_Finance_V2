import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ResultadoRegime } from '@/lib/tributario/calculadora';
import { formatBRL, formatPct } from './number-field.formatters';

export function MemoriaCalculo({ resultado }: { resultado: ResultadoRegime }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Memória de cálculo</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border">
              <tr className="text-left">
                <th className="p-2 w-10">#</th>
                <th className="p-2">Descrição</th>
                <th className="p-2 text-right">Base</th>
                <th className="p-2 text-right">Alíq.</th>
                <th className="p-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {resultado.memoria.map((l) => (
                <tr key={l.ordem} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="p-2 text-muted-foreground">{l.ordem}</td>
                  <td className="p-2">
                    <div className="font-medium">{l.descricao}</div>
                    {l.observacao && <div className="text-[10px] text-muted-foreground">{l.observacao}</div>}
                  </td>
                  <td className="p-2 text-right tabular-nums">{l.base ? formatBRL(l.base) : '—'}</td>
                  <td className="p-2 text-right tabular-nums">{l.aliquota != null ? formatPct(l.aliquota) : '—'}</td>
                  <td className={`p-2 text-right tabular-nums ${l.valor < 0 ? 'text-destructive' : ''}`}>
                    {formatBRL(l.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
