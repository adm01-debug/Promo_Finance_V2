import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Prejuizo {
  id: string;
  tipo: string;
  ano_origem: number;
  trimestre_origem?: number | null;
  valor_original: number;
  valor_compensado: number;
  saldo_disponivel: number;
  status: string;
}

export function IRPJCSLLLalurTab({ prejuizos }: { prejuizos?: Prejuizo[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>LALUR - Livro de Apuração do Lucro Real</CardTitle>
        <CardDescription>Parte A (Ajustes) e Parte B (Controle)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Parte A - Ajustes do Lucro Líquido
            </h4>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Adições permanentes (despesas indedutíveis)</li>
              <li>• Adições temporárias (diferenças temporárias)</li>
              <li>• Exclusões permanentes (receitas não tributáveis)</li>
              <li>• Exclusões temporárias (realizações Parte B)</li>
              <li>• Compensação de prejuízos fiscais</li>
            </ul>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Parte B - Controle de Valores
            </h4>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Saldo de prejuízos fiscais a compensar</li>
              <li>• Adições temporárias a realizar</li>
              <li>• Exclusões temporárias a realizar</li>
              <li>• Depreciação acelerada incentivada</li>
              <li>• Outros valores controlados</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Prejuízos Fiscais Acumulados</h4>
          {prejuizos && prejuizos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Valor Original</TableHead>
                  <TableHead className="text-right">Compensado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prejuizos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
                    <TableCell>{p.trimestre_origem ? `${p.trimestre_origem}T/${p.ano_origem}` : p.ano_origem}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor_original)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(p.valor_compensado)}</TableCell>
                    <TableCell className="text-right font-medium text-warning">{formatCurrency(p.saldo_disponivel)}</TableCell>
                    <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum prejuízo fiscal registrado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
