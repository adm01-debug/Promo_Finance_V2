import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';

interface LinhaDRE {
  grupo: string;
  nivel: number;
  bold?: boolean;
  separador?: boolean;
  destaque?: boolean;
  valor?: number;
  percentual?: number;
}

interface Props {
  linhasDRE: LinhaDRE[];
  empresaNome: string;
  periodoInicio: string;
  periodoFim: string;
  faturamentoPeriodo: number;
}

export function DRETributarioTab({ linhasDRE, empresaNome, periodoInicio, periodoFim, faturamentoPeriodo }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Demonstração do Resultado - Tributos</CardTitle>
        <CardDescription>{empresaNome} | {periodoInicio} a {periodoFim}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">% Faturamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhasDRE.map((linha, i) => (
              linha.separador ? (
                <TableRow key={i}><TableCell colSpan={3} className="h-2 p-0"><Separator /></TableCell></TableRow>
              ) : (
                <TableRow key={i} className={linha.destaque ? 'bg-muted/50' : ''}>
                  <TableCell className={`${linha.bold ? 'font-semibold' : ''}`} style={{ paddingLeft: `${linha.nivel * 24 + 16}px` }}>{linha.grupo}</TableCell>
                  <TableCell className={`text-right ${linha.bold ? 'font-semibold' : ''} ${(linha.valor ?? 0) < 0 ? 'text-red-600' : ''}`}>
                    {linha.valor !== undefined ? formatCurrency(Math.abs(linha.valor)) : ''}
                    {linha.percentual !== undefined ? `${linha.percentual.toFixed(2)}%` : ''}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {linha.valor !== undefined && faturamentoPeriodo > 0 ? `${((Math.abs(linha.valor) / faturamentoPeriodo) * 100).toFixed(2)}%` : ''}
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
