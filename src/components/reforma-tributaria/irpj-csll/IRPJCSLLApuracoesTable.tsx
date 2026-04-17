import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Apuracao {
  id: string;
  ano: number;
  trimestre?: number | null;
  tipo_apuracao: string;
  lucro_real: number;
  irpj_total: number;
  csll_total: number;
  total_tributos: number;
  status: string;
}

interface Props {
  apuracoesAno: Apuracao[];
  ano: number;
  getStatusBadge: (status: string) => JSX.Element;
}

export function IRPJCSLLApuracoesTable({ apuracoesAno, ano, getStatusBadge }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apurações {ano}</CardTitle>
      </CardHeader>
      <CardContent>
        {apuracoesAno.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Lucro Real</TableHead>
                <TableHead className="text-right">IRPJ</TableHead>
                <TableHead className="text-right">CSLL</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apuracoesAno.map(ap => (
                <TableRow key={ap.id}>
                  <TableCell>
                    {ap.tipo_apuracao === 'trimestral'
                      ? `${ap.trimestre}º Trim/${ap.ano}`
                      : `Anual ${ap.ano}`}
                  </TableCell>
                  <TableCell><Badge variant="outline">{ap.tipo_apuracao}</Badge></TableCell>
                  <TableCell className="text-right">{formatCurrency(ap.lucro_real)}</TableCell>
                  <TableCell className="text-right text-primary">{formatCurrency(ap.irpj_total)}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(ap.csll_total)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(ap.total_tributos)}</TableCell>
                  <TableCell>{getStatusBadge(ap.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma apuração para {ano}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
